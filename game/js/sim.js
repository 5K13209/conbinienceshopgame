(function () {
  'use strict';
  const CK = window.CK, U = CK.U, CFG = CK.CFG;
  const Sim = (CK.Sim = {});

  Sim.isPlayer = (st) => st.id === 0;
  Sim.other = (st) => CK.S.stores[st.id === 0 ? 1 : 0];
  Sim.changeRep = function (st, delta, raw) {
    if (delta < 0 && !raw && st._d) delta *= Math.max(0.2, 1 + (st._d.acc.repDrop || 0));
    st.rep = U.clamp(st.rep + delta, 1, 5);
  };
  Sim.luck = (st, p) => CK.rand() < p + ((st._d && st._d.acc.eventGood) || 0);
  Sim.useItem = function (st, id) { st.items[id]--; if (st.items[id] <= 0) delete st.items[id]; };
  Sim.trapCost = (st) => (st._d && st._d.acc.trapFree ? 0 : Math.round(CFG.trapCost * Math.max(0, 1 + ((st._d && st._d.acc.trapCostMul) || 0))));
  Sim.targetLabel = (sab, t) => (sab.targetKind === 'seg' ? CK.SEG_NAME[t] : sab.targetKind === 'pref' ? CK.DATA.prefInfo[t].name : '');

  // ---------------- 時間を進める ----------------
  Sim.step = function (realDt) {
    const S = CK.S;
    let remain = (realDt * 7) / CFG.weekRealSeconds;
    while (remain > 1e-9 && S.phase === 'run' && !CK.UI.modalActive()) {
      const d = Math.min(remain, 0.01);
      remain -= d;
      tick(d);
    }
  };

  function tick(d) {
    const S = CK.S;
    const prevDay = Math.floor(S.weekT);
    S.weekT += d; S.abs += d;
    if (Math.floor(S.weekT) !== prevDay && S.weekT < 7) onNewDay();
    const slot = CK.slotNow();
    for (const st of S.stores) {
      st._d = CK.derive(st);
      const R = st._d.R(slot);
      st.tokens = Math.min(Math.max(3, R * CFG.rotBucketMax), st.tokens + R * CFG.rotTokensPerDayPerR * d);
      if (st.snsCooldown > 0) st.snsCooldown = Math.max(0, st.snsCooldown - d);
    }
    // 客の発生
    S.globalEffects = S.globalEffects.filter((g) => g.until > S.abs);
    let gm = 1;
    for (const g of S.globalEffects) gm *= g.v;
    const weekend = CK.dayIdx() >= 5;
    S.spawnAcc += CFG.customersPerDay * d * CFG.slotSpawnMul[slot] * gm;
    while (S.spawnAcc >= 1) { S.spawnAcc -= 1; spawnCustomer(slot, weekend); }
    // ライバルAI
    CK.AI.tick(S.stores[1], d);
    // タイムライン
    S.tlTimer -= d;
    if (S.tlTimer <= 0) { S.tlTimer = CFG.timelineIntervalDays * U.rand(0.6, 1.4); Sim.postAmbient(); }
    while (S.pendingPosts.length && S.pendingPosts[0].at <= S.abs) Sim.post(S.pendingPosts.shift().post);
    // 予定（妨害・イベント）
    while (S.schedule.length && S.schedule[0].t <= S.weekT) {
      trigger(S.schedule.shift());
      if (CK.UI.modalActive()) return;
    }
    if (S.weekT >= 7) { S.weekT = 7; CK.Game.endWeek(); }
  }

  function onNewDay() {
    const S = CK.S;
    for (const st of S.stores) {
      // 評判は時間とともに少しずつ★3.0へ戻っていく（人のうわさも七十五日）
      if (st.rep < CK.CFG.baseRep) st.rep = Math.min(CK.CFG.baseRep, st.rep + 0.015);
      else if (st.rep > CK.CFG.baseRep) st.rep = Math.max(CK.CFG.baseRep, st.rep - 0.012);
      st.effects = st.effects.filter((e) => e.until > S.abs);
      st.snsBuffs = st.snsBuffs.filter((b) => S.abs - b.start < b.days);
      for (const sf of st.staff) {
        sf.slackToday = sf.skills.includes('slacker') && CK.rand() < 0.3;
        if (sf.skills.includes('clumsy') && CK.rand() < 1 / 30) {
          Sim.changeRep(st, -0.05);
          if (Sim.isPlayer(st)) CK.UI.toast(`${sf.name}がうっかりミス…（評判 −0.05）`, 'bad');
        }
      }
      st.pendingSilence = st.pendingSilence.filter((ps) => {
        if (S.abs >= ps.at) { resolveSilence(st, ps); return false; }
        return true;
      });
    }
  }

  // ---------------- 客 ----------------
  function spawnCustomer(slot, weekend) {
    const S = CK.S, D = CK.DATA;
    const ratios = D.slotRatios[slot];
    const seg = U.weighted(CK.SEGS, (s) => ratios[s] * (weekend && s !== 'mid' ? 1 + CFG.weekendBonus : 1));
    const pref = U.weighted(CK.PREFS, (p) => S.prefs[p] || 0);
    const tag = D.prefInfo[pref].tag;
    const ws = S.stores.map((st) => {
      const d = st._d;
      let w = (d.gauges[seg] + 10) * (d.rep / 3) * d.visit(seg, slot);
      if (tag) w *= (1 + CFG.prefTagVisit * (d.tagCount[tag] || 0)) * d.prefVisit(pref);
      return Math.max(0.01, w);
    });
    const r = CK.rand() * (ws[0] + ws[1] + CFG.noneWeight);
    const idx = r < ws[0] ? 0 : r < ws[0] + ws[1] ? 1 : -1;
    if (idx >= 0) visit(S.stores[idx], seg, pref, tag);
  }

  function visit(st, seg, pref, tag) {
    st.weekVisitors++;
    if (st.tokens < 1) { st.weekLost++; CK.Render.onCustomer(st.id, seg, pref, false, 0, true); return; }
    st.tokens -= 1;
    const d = st._d;
    const hasTag = tag && (d.tagCount[tag] || 0) > 0;
    const pBuy = U.clamp(CFG.baseBuy + d.buy(seg) + (hasTag ? CFG.prefMatchBuy : 0), 0.05, 0.97);
    if (!d.prods.length || CK.rand() >= pBuy) { CK.Render.onCustomer(st.id, seg, pref, false, 0, false); return; }
    let n = 1, extra = CFG.baseExtraItem + d.basket(seg);
    while (n < 4 && CK.rand() < extra) { n++; extra *= 0.5; }
    let rev = 0, prof = 0;
    for (let i = 0; i < n; i++) {
      const x = U.weighted(d.prods, (x) => {
        let w = x.p.best.includes(seg) ? 3 : x.p.good.includes(seg) ? 1.5 : 1;
        if (tag && x.p.tags.includes(tag)) w *= 3;
        if (x.p.price === 0) w *= 0.3;
        return w * x.m;
      });
      const price = x.p.price * d.priceMul;
      rev += price;
      prof += price - x.p.cost * d.costMul;
      st.stats.sold[x.p.id] = (st.stats.sold[x.p.id] || 0) + 1;
    }
    st.money += prof; st.weekSales += rev; st.weekGross += prof;
    CK.Render.onCustomer(st.id, seg, pref, true, rev, false);
  }

  function trigger(it) {
    if (it.type === 'event') Sim.runEvent(it.id);
    else if (it.type === 'sab') Sim.resolveSabotage(it);
    else if (it.type === 'hint') Sim.post({ kind: 'hint', handle: 'tantei_office', text: it.text });
  }

  // ---------------- タイムライン ----------------
  Sim.post = function (p) {
    const S = CK.S;
    p.id = ++S.postSeq;
    if (!p.handle) p.handle = p.kind === 'shop' ? S.stores[p.shopId].name : CK.DATA.tl.randomHandle();
    S.timeline.unshift(p);
    if (S.timeline.length > 60) S.timeline.pop();
    CK.UI.addPost(p);
  };
  Sim.postAmbient = function () { const p = CK.DATA.tl.generate(CK.S); if (p) Sim.post(p); };

  // ---------------- SNS ----------------
  Sim.snsCandidates = function (st) {
    const S = CK.S, D = CK.DATA, T = D.sns;
    const prods = CK.prodsOf(st).map((x) => x.p);
    const wk = S.weekTrend, mo = S.monthTrend;
    const seasonWord = U.pick(T.seasonWords[S.season]);
    const segOf = (p) => (p && p.best.length ? U.pick(p.best) : U.pick(CK.SEGS));
    let gp = prods.find((p) => p.tags.includes(wk.tag)), gtag = wk.name;
    if (!gp) { gp = prods.find((p) => p.tags.includes(mo.tag)); gtag = mo.name; }
    if (!gp) { gp = prods.length ? U.pick(prods) : null; gtag = wk.name; }
    const good = { quality: 'good', seg: segOf(gp), text: T.write('good', gp, { item: gp ? gp.name : 'おすすめ商品', tag: gtag, season: seasonWord }) };
    const notOwned = D.products.concat(D.limited).filter((p) => !prods.includes(p));
    // 「普通」の半分は、トレンドのハッシュタグは付いているのに、店に置いていない商品の話（見た目は良さそうな引っかけ）
    let normal;
    const decoy = U.pick(notOwned.filter((p) => p.tags.includes(wk.tag) || p.tags.includes(mo.tag)));
    if (decoy && CK.rand() < 0.5) {
      const dtag = decoy.tags.includes(wk.tag) ? wk.name : mo.name;
      normal = { quality: 'normal', seg: segOf(decoy), text: T.write('good', decoy, { item: decoy.name, tag: dtag, season: seasonWord }) };
    } else {
      const np = prods.length ? U.pick(prods) : null;
      normal = { quality: 'normal', seg: segOf(np), text: T.write('normal', np, { item: np ? np.name : '商品' }) };
    }
    const off = D.limited.filter((p) => p.season !== S.season);
    const bp = U.pick(CK.rand() < 0.5 && off.length ? off : notOwned);
    const otherSeason = U.pick(['spring', 'summer', 'autumn', 'winter'].filter((x) => x !== S.season));
    const bad = { quality: 'bad', seg: segOf(bp), text: T.write('bad', bp, { item: bp.name, tag: U.pick(D.trends[otherSeason]).name }) };
    return U.shuffle([good, normal, bad]);
  };

  Sim.snsPost = function (st, c, noCooldown) {
    const S = CK.S, C = CFG.sns[c.quality], acc = st._d.acc;
    let g = C.gauge;
    if (c.quality === 'bad') { if (acc.snsBadFloor) g = 1; else if (acc.snsBadHalf) g = g / 2; }
    else g += acc.snsGauge || 0;
    st.snsBuffs.push({ seg: c.seg, amount: g, start: S.abs, days: C.days });
    if (c.quality === 'good') {
      CK.addEffect(st, { kind: 'mul', key: 'visit', v: C.visitMul, tag: 'buzz' }, C.visitDays + (acc.snsBoostDays || 0));
      Sim.changeRep(st, C.rep);
      st.stats.buzz++;
    }
    if (c.quality === 'bad' && !acc.snsBadFloor) Sim.changeRep(st, acc.snsBadHalf ? C.rep / 2 : C.rep, true);
    const flamed = c.quality === 'bad' && acc.flameMarketing && CK.rand() < 0.3;
    if (!noCooldown) st.snsCooldown = CFG.snsCooldownDays * Math.max(0.3, 1 + (acc.snsCooldown || 0));
    Sim.post({ kind: 'shop', shopId: st.id, text: c.text, quality: c.quality });
    const reacts = CK.DATA.tl.react[c.quality];
    const n = c.quality === 'good' ? 2 : 1;
    for (let i = 0; i < n; i++) S.pendingPosts.push({ at: S.abs + 0.12 + i * 0.15, post: { kind: 'react', text: U.fill(U.pick(reacts), { shop: st.name }) } });
    S.pendingPosts.sort((a, b) => a.at - b.at);
    if (flamed) Sim.scandal(st, '炎上商法の投稿が大炎上した');
    return { good: '投稿がバズった！🔥', normal: 'そこそこの反応だった', bad: '投稿がスベった…😇' }[c.quality];
  };

  // ---------------- 突発イベント ----------------
  Sim.eventOptions = function (ev, st) {
    const opts = [];
    for (const k of Object.keys(st.items)) {
      const it = CK.byId.item[k];
      if (st.items[k] <= 0) continue;
      if (it.main.includes(ev.id) && ev.itemMain) opts.push({ label: `${it.icon} ${it.name}を使う`, desc: ev.itemMainDesc || 'アイテムで完璧に対処', cls: 'item', isItem: 'main', fn: (s) => { Sim.useItem(s, k); return ev.itemMain(s); } });
      else if (it.sub.includes(ev.id) && ev.itemSub) opts.push({ label: `${it.icon} ${it.name}を使う`, desc: ev.itemSubDesc || 'アイテムで少し有利に', cls: 'item', isItem: 'sub', fn: (s) => { Sim.useItem(s, k); return ev.itemSub(s); } });
    }
    if (ev.skillOption) { const so = ev.skillOption(st); if (so) opts.push(Object.assign({ cls: 'item' }, so)); }
    const base = typeof ev.options === 'function' ? ev.options(st) : ev.options;
    return opts.concat(base);
  };

  Sim.runEvent = function (id) {
    const S = CK.S;
    const ev = CK.byId.event[id];
    if (ev.global) ev.global();
    const ai = S.stores[1];
    const ch = CK.AI.chooseEvent(ai, ev, Sim.eventOptions(ev, ai));
    ch.fn(ai);
    const pl = S.stores[0];
    const text = typeof ev.text === 'function' ? ev.text(pl) : ev.text;
    CK.UI.choice({
      icon: ev.icon, title: ev.name,
      text: text + '<div class="muted small" style="margin-top:6px">※ライバル店にも同じことが起きています</div>',
      options: Sim.eventOptions(ev, pl).map((o) => ({ label: o.label, desc: o.desc, cls: o.cls, onPick: () => { const r = o.fn(pl); if (r) CK.UI.toast(r, 'info'); } })),
    });
  };

  // ---------------- 妨害 ----------------
  Sim.sabCost = (att, sab) => (sab.costFn ? sab.costFn(att) : sab.cost);
  Sim.sabOdds = function (att, sab) {
    const acc = att._d ? att._d.acc : {};
    const lvl = CK.suspLevel(att);
    let sc = sab.scandal + (lvl === '中' ? CFG.suspicionScandal.mid : lvl === '高' ? CFG.suspicionScandal.high : 0) + (acc.sabScandal || 0);
    sc = U.clamp(sc, 1, 60);
    let su = sab.success + (acc.sabSuccess || 0) + (sab.cat === 'sns' ? acc.sabSuccessSns || 0 : 0);
    su = U.clamp(su, 5, 100 - sc);
    return { success: Math.round(su), scandal: Math.round(sc), fail: Math.round(100 - su - sc) };
  };
  Sim.sabAvailable = (att) => CK.DATA.sabotages.filter((s) => !s.req || s.req(att));
  Sim.sabCandidates = (att) => U.sample(Sim.sabAvailable(att), 3 + ((att._d && att._d.acc.sabChoices) || 0));
  Sim.planSabotage = function (att, sabId) {
    const sab = CK.byId.sab[sabId];
    const def = Sim.other(att);
    att.money -= Sim.sabCost(att, sab);
    att.sabUsed++;
    att.plannedSab = { sabId, target: sab.target ? sab.target(def) : null };
    if (att.id === 0) CK.S.playerSabHistory[sab.cat]++;
  };

  Sim.sabResponseOptions = function (def, sab) {
    const opts = [];
    for (const k of Object.keys(def.items)) {
      const it = CK.byId.item[k];
      if (def.items[k] <= 0) continue;
      if (it.main.includes(sab.id)) opts.push({ label: `${it.icon} ${it.name}を使う`, desc: 'この妨害を完全に防ぐ' + (it.counterScandal ? `（相手のスキャンダル率 +${it.counterScandal}%）` : ''), cls: 'item', factor: 0, useItem: k, extra: it.counterScandal || 0, msg: `${it.name}で防いだ！` });
      else if (it.sub.includes(sab.id)) opts.push({ label: `${it.icon} ${it.name}を使う`, desc: '効果を30%減らす', cls: 'item', factor: 0.7, useItem: k, msg: `${it.name}で少し被害を減らした` });
    }
    opts.push({ label: '💴 お金でなんとかする', desc: `${U.yen(CFG.payDefenseCost)}払って効果を半減`, factor: 0.5, pay: CFG.payDefenseCost, msg: 'お金で被害を半分に抑えた' });
    opts.push({ label: '😣 我慢する', desc: 'タダ。効果をそのまま受ける', factor: 1, msg: '' });
    return opts;
  };

  function applyResponse(def, sab, m, ctx, o) {
    if (o.useItem) Sim.useItem(def, o.useItem);
    if (o.pay) def.money -= o.pay;
    if (o.factor > 0) {
      sab.apply(def, m * o.factor, ctx);
      // 相手から離れた客の一部が、仕掛けた側に流れてくる
      CK.addEffect(ctx.att, { kind: 'mul', key: 'visit', v: 1 + 0.15 * o.factor, tag: 'steal' }, 3);
    } else def.stats.defended++;
    if (o.extra && CK.rand() * 100 < o.extra) Sim.scandal(ctx.att, `「${sab.name}」の黒幕だと突き止められた`);
  }

  Sim.resolveSabotage = function (it) {
    const S = CK.S;
    const att = S.stores[it.att], def = Sim.other(att), sab = CK.byId.sab[it.sabId];
    const P = Sim.isPlayer(att);
    att.stats.sabTried++;
    att.suspicion += Math.max(0.5, 1 + (att._d.acc.suspicionGain || 0));

    // 罠
    const trap = def.trap;
    let bonus = 0, trapName = null;
    if (trap) {
      if (trap.type === 'generic' && trap.cat === sab.cat) { bonus = CFG.trapScandalBonus; trapName = CK.DATA.trapNames[sab.cat]; }
      else if (trap.type === 'item') {
        const itm = CK.byId.item[trap.item];
        if (itm && itm.main.includes(sab.id) && (def.items[itm.id] || 0) > 0) { bonus = itm.trapBonus || 25; trapName = itm.name; Sim.useItem(def, itm.id); }
      }
    }
    if (trapName) {
      def.trap = null;
      def.stats.defended++;
      const caught = CK.rand() * 100 < Sim.sabOdds(att, sab).scandal + bonus;
      if (P) CK.UI.toast(`${sab.icon}「${sab.name}」は相手の罠（${trapName}）に阻まれた…${caught ? 'しかも犯行がバレた！' : ''}`, 'bad');
      else CK.UI.toast(`🪤 罠（${trapName}）が発動！ライバルの「${sab.name}」を防いだ${caught ? '。黒幕がバレてライバルが炎上！' : ''}`, 'good');
      if (caught) Sim.scandal(att, `「${sab.name}」の黒幕だとバレた`);
      return;
    }

    const odds = Sim.sabOdds(att, sab);
    const r = CK.rand() * 100;
    if (r < odds.scandal) {
      if (P) CK.UI.toast(`${sab.icon}「${sab.name}」が失敗…しかもバレた！`, 'bad');
      else CK.UI.toast('👀 ライバル店が何か仕掛けようとして、バレたらしい', 'good');
      Sim.scandal(att, `「${sab.name}」をしようとしたのがバレた`);
      return;
    }
    if (r >= odds.scandal + odds.success) {
      if (P) CK.UI.toast(`${sab.icon}「${sab.name}」は失敗に終わった（お金だけ消えた）`, 'warn');
      return;
    }
    // 成功
    if (sab.cat === 'physical' && CK.rand() < (def._d.acc.guardBlock || 0)) {
      def.stats.defended++;
      if (P) CK.UI.toast(`${sab.icon}「${sab.name}」は相手の警備員に追い払われた`, 'warn');
      else CK.UI.toast(`👮 警備員が「${sab.name}」を追い払った！`, 'good');
      return;
    }
    let m = 1 + (att._d.acc.sabEffect || 0);
    if (sab.cat === 'physical') m *= Math.max(0, 1 - (def._d.acc.physReduce || 0));
    if ((sab.id === 'yankee' || sab.id === 'streamer') && def._d.acc.scaryFace) m *= 0.7;
    const ctx = { att, def, target: it.target };
    if (P) {
      const res = CK.AI.sabResponse(def, sab);
      applyResponse(def, sab, m, ctx, res);
      if (res.factor > 0) att.stats.sabSuccess++;
      const how = res.factor === 0 ? '…が、相手にアイテムで防がれた' : res.pay ? '（相手はお金で被害を半分にした）' : res.useItem ? '（相手はアイテムで少し被害を減らした）' : '';
      CK.UI.toast(`${sab.icon}「${sab.name}」成功！${how}`, res.factor === 0 ? 'warn' : 'good');
      if (res.factor > 0) Sim.post({ kind: 'voice', text: U.fill(U.pick(CK.DATA.tl.sabRumor[sab.id]), { shop: def.name }) });
    } else {
      att.stats.sabSuccess++;
      const opts = Sim.sabResponseOptions(def, sab);
      CK.UI.choice({
        icon: sab.icon, title: `妨害を受けた！「${sab.name}」`, cls: 'danger',
        text: `${sab.desc}${it.target ? `<br>狙われたのは：<b>${Sim.targetLabel(sab, it.target)}</b>` : ''}<br><span class="muted">どう対応する？</span>`,
        options: opts.map((o) => ({ label: o.label, desc: o.desc, cls: o.cls, onPick: () => { applyResponse(def, sab, m, ctx, o); if (o.msg) CK.UI.toast(o.msg, 'info'); if (o.factor > 0) Sim.post({ kind: 'voice', text: U.fill(U.pick(CK.DATA.tl.sabRumor[sab.id]), { shop: def.name }) }); } })),
      });
    }
  };

  // ---------------- スキャンダル ----------------
  Sim.scandalOptions = function (st, loss) {
    const exP = 0.3 + ((st.items.rebuttal || 0) > 0 ? 0.2 : 0);
    const cost = CFG.scandal.apologyCost * (st._d && st._d.acc.apologyHalf ? 0.5 : 1);
    return [
      { id: 'apology', label: '🙇 謝罪会見を開く', desc: `${U.yen(cost)}。評判のダメージ半減＆客離れがすぐ終わる`, fn: (s) => { s.money -= cost; Sim.changeRep(s, loss * 0.5, true); s.effects = s.effects.filter((e) => e.tag !== 'flame'); return '誠意ある謝罪で、炎上は落ち着いた'; } },
      { id: 'silence', label: '🤐 だんまりを決め込む', desc: 'タダ。50%で2週間後に評判が半分戻る／50%で長引く（評判 −0.2）', fn: (s) => { s.pendingSilence.push({ at: CK.S.abs + 14, loss }); return '沈黙を貫くことにした…'; } },
      { id: 'excuse', label: '🗣️ 言い訳する', desc: `タダ。${Math.round(exP * 100)}%で鎮火（評判が半分戻る）／失敗すると再炎上（評判 −0.5）`, fn: (s) => { if (Sim.luck(s, exP)) { Sim.changeRep(s, loss * 0.5, true); return '言い訳が通った！鎮火した'; } Sim.changeRep(s, -0.5, true); return '言い訳が火に油を注いだ…再炎上'; } },
    ];
  };

  Sim.scandal = function (st, reason) {
    const S = CK.S;
    st.stats.scandals++;
    st.lastScandalAbs = S.abs;
    const dm = Math.max(0.1, 1 + ((st._d && st._d.acc.scandalDmg) || 0));
    const loss = -CFG.scandal.rep * dm;
    Sim.changeRep(st, -loss, true);
    CK.addEffect(st, { kind: 'add', key: 'gauge', seg: 'all', v: CFG.scandal.gauge * dm, tag: 'flame' }, CFG.scandal.gaugeDays);
    CK.addEffect(st, { kind: 'mul', key: 'visit', v: 1 - (1 - CFG.scandal.visitMul) * dm, tag: 'flame' }, CFG.scandal.visitDays);
    for (let i = 0; i < 4; i++) S.pendingPosts.push({ at: S.abs + i * 0.05, post: { kind: 'flame', text: U.fill(U.pick(CK.DATA.tl.flame), { shop: st.name }) } });
    S.pendingPosts.sort((a, b) => a.at - b.at);
    const opts = Sim.scandalOptions(st, loss);
    if (Sim.isPlayer(st)) {
      CK.UI.choice({
        icon: '🔥', title: 'スキャンダル発生！', cls: 'danger',
        text: `${reason}。店が炎上している…<br>評判 −${loss.toFixed(1)}、全ゲージ −${Math.round(-CFG.scandal.gauge * dm)}、<b>1週間 来店 −${Math.round((1 - CFG.scandal.visitMul) * dm * 100)}%</b><br>どう対応する？`,
        options: opts.map((o) => ({ label: o.label, desc: o.desc, onPick: () => { const r = o.fn(st); if (r) CK.UI.toast(r, 'info'); } })),
      });
    } else {
      CK.AI.chooseScandal(st, opts).fn(st);
      CK.UI.toast(`🔥 ライバル店「${st.name}」が炎上中！`, 'good');
    }
  };

  function resolveSilence(st, ps) {
    if (CK.rand() < 0.5) {
      Sim.changeRep(st, ps.loss * 0.5, true);
      if (Sim.isPlayer(st)) CK.UI.toast('ほとぼりが冷めて、評判が少し戻った', 'good');
    } else {
      Sim.changeRep(st, -0.2, true);
      if (Sim.isPlayer(st)) CK.UI.toast('だんまりが裏目に…まだ叩かれている（評判 −0.2）', 'bad');
    }
  }
})();

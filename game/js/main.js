(function () {
  'use strict';
  const CK = window.CK, U = CK.U, CFG = CK.CFG;
  const Game = (CK.Game = {});

  // その月にありえるトレンドだけから選ぶ（2月に「初日の出」などが出ないように）
  const trendOk = (t, month) => !t.months || t.months.includes(month);
  const pickTrend = (month, excludeTag) => U.pick(CK.DATA.trends[CK.seasonOf(month)].filter((t) => t.tag !== excludeTag && trendOk(t, month)));

  Game.newGame = function (o) {
    CK.setSeed((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
    const P = CK.DATA.personalities;
    const pers = o.ai === 'random' ? U.pick(Object.keys(P)) : o.ai;
    const startCal = o.mode === 'random' ? U.randInt(1, 12) : { spring: 3, summer: 6, autumn: 9, winter: 12 }[o.season];
    CK.S = {
      monthsTotal: o.months, startCal, aiHidden: o.ai === 'random',
      monthIdx: 0, week: 0, weekT: 0, abs: 0,
      viewIdx: 0, speed: 1, paused: false, phase: 'setup',
      schedule: [], spawnAcc: 0, globalEffects: [], timeline: [], tlTimer: 0.1, postSeq: 0, pendingPosts: [],
      playerSabHistory: { physical: 0, sns: 0, business: 0 }, monthWins: 0, shopItems: [], weekCount: 0,
    };
    const S = CK.S;
    S.stores = [
      CK.newStore(0, (o.name || '').trim() || 'わたしのコンビニ', false, null),
      CK.newStore(1, U.pick(CK.DATA.rivalNames), true, pers),
    ];
    S.stores.forEach((st) => st.staff.push(CK.DATA.genStaff('basic')));
    CK.Render.reset();
    CK.UI.clearTimeline();
    CK.UI.setTabs();
    Game.beginMonth(0);
    S.stores.forEach((st) => (st._d = CK.derive(st)));
    CK.AI.initial(S.stores[1]);
    CK.UI.screenProducts(() => CK.UI.screenStaff(() => { S.week = 0; Game.beginWeek(); }), { initial: true });
  };

  Game.beginMonth = function (idx) {
    const S = CK.S;
    S.monthIdx = idx;
    S.calMonth = ((S.startCal - 1 + idx) % 12) + 1;
    S.season = CK.seasonOf(S.calMonth);
    S.prefs = CK.DATA.genPrefs(S.season);
    S.monthTrend = pickTrend(S.calMonth, null);
    S.nextWeekTrend = pickTrend(S.calMonth, S.monthTrend.tag);
    S.shopItems = U.sample(CK.DATA.items, CFG.shopItemCount);
    for (const st of S.stores) {
      st.lastLostRatio = st.monthVisitors ? st.monthLost / st.monthVisitors : 0;
      st.monthLost = 0; st.monthVisitors = 0; st.sabUsed = 0;
    }
  };

  Game.beginWeek = function () {
    const S = CK.S;
    S.phase = 'prep';
    S.weekT = 0;
    const nw = S.nextWeekTrend;
    S.weekTrend = nw && nw.season === S.season && trendOk(nw, S.calMonth) && nw.tag !== S.monthTrend.tag ? nw : pickTrend(S.calMonth, S.monthTrend.tag);
    const lastWeek = S.week >= CFG.weeksPerMonth - 1;
    S.nextWeekTrend = pickTrend(lastWeek ? (S.calMonth % 12) + 1 : S.calMonth, lastWeek ? null : S.monthTrend.tag);
    for (const st of S.stores) {
      st._d = CK.derive(st);
      if (st.noLimitedNext) { st.offers = []; st.noLimitedNext = false; }
      else {
        const pool = CK.DATA.limited.filter((p) => p.season === S.season && (!p.months || p.months.includes(S.calMonth)));
        st.offers = U.sample(pool, CFG.limitedChoices + (st._d.acc.limitedChoices || 0)).map((p) => p.id);
      }
    }
    CK.AI.prepWeek(S.stores[1]);
    CK.Sim.post({ kind: 'trend', text: `今週のトレンド：${S.weekTrend.name}` });
    CK.UI.screenPrep(Game.startRun);
  };

  Game.startRun = function () {
    const S = CK.S;
    S.schedule = [];
    const nEv = U.randInt(CFG.eventsPerWeek[0], CFG.eventsPerWeek[1]);
    const pool = CK.DATA.events.filter((e) => (!e.seasons || e.seasons.includes(S.season)) && (!e.months || e.months.includes(S.calMonth)));
    U.sample(pool, nEv).forEach((e) => S.schedule.push({ t: U.rand(0.4, 6.6), type: 'event', id: e.id }));
    for (const st of S.stores) {
      if (!st.plannedSab) continue;
      const t = U.rand(0.5, 6.5);
      S.schedule.push({ t, type: 'sab', att: st.id, sabId: st.plannedSab.sabId, target: st.plannedSab.target });
      if (st.id === 1 && (CK.hasJob(S.stores[0], 'detective') || (S.stores[0]._d && S.stores[0]._d.acc.spy))) {
        const cat = CK.byId.sab[st.plannedSab.sabId].cat;
        S.schedule.push({ t: U.rand(0.1, Math.max(0.2, t - 0.3)), type: 'hint', text: U.pick(CK.DATA.tl.detective[cat]) });
      }
      st.plannedSab = null;
    }
    S.schedule.sort((a, b) => a.t - b.t);
    S.phase = 'run';
    S.paused = false;
    CK.UI.hideOverlay();
    CK.UI.toast(`${S.calMonth}月 第${S.week + 1}週、営業開始！`, 'info');
  };

  Game.endWeek = function () {
    const S = CK.S;
    S.phase = 'weekEnd';
    const rows = S.stores.map((st) => {
      const wages = Math.round(st.staff.reduce((a, s) => a + s.wage, 0) * Math.max(0.3, 1 + (st._d.acc.wage || 0)));
      const rent = CFG.rent + (st._d.acc.rentAdd || 0);
      st.money -= rent + wages;
      st.monthLost += st.weekLost; st.monthVisitors += st.weekVisitors;
      st.stats.visitors += st.weekVisitors; st.stats.lostTotal += st.weekLost;
      return { st, wages, rent, net: st.weekGross - rent - wages };
    });
    const r = rows[0], me = r.st;
    const tr = (k, v, cls) => `<tr><td>${k}</td><td class="${cls || ''}">${v}</td></tr>`;
    CK.UI.choice({
      icon: '📊', title: `${S.calMonth}月 第${S.week + 1}週 おつかれさま！`,
      text: `<table class="rep">
        ${tr('売上', U.yen(me.weekSales))}
        ${tr('粗利（売上 − 原価）', U.yen(me.weekGross))}
        ${tr('人件費', '−' + U.yen(r.wages))}
        ${tr("家賃", "−" + U.yen(r.rent))}
        ${tr('営業利益', U.yen(r.net), r.net >= 0 ? 'plus' : 'minus')}
        ${tr('来店した客', me.weekVisitors + '人')}
        ${tr('さばききれなかった客', me.weekLost + '人', me.weekLost > me.weekVisitors * 0.05 ? 'minus' : '')}
        ${tr('所持金', U.yen(me.money))}
      </table>${me.weekLost > me.weekVisitors * 0.05 ? '<div class="hint">💡 さばききれない客が多い！バイトかレジ増設で回転率を上げよう</div>' : ''}`,
      options: [{ label: S.week < CFG.weeksPerMonth - 1 ? '次の週へ ▶' : '月末の決算へ ▶', onPick: Game.afterWeek }],
    });
  };

  Game.afterWeek = function () {
    const S = CK.S;
    for (const st of S.stores) { st.weekSales = 0; st.weekGross = 0; st.weekLost = 0; st.weekVisitors = 0; st.trap = null; }
    S.weekCount = (S.weekCount || 0) + 1;
    const cont = () => { if (S.week < CFG.weeksPerMonth - 1) { S.week++; Game.beginWeek(); } else Game.monthEnd(); };
    const lastWeekOfGame = S.monthIdx >= S.monthsTotal - 1 && S.week >= CFG.weeksPerMonth - 1;
    if (S.weekCount % CFG.cardEveryWeeks === 0 && !lastWeekOfGame) {
      S.phase = 'cards';
      CK.AI.cardPick(S.stores[1]);
      CK.UI.screenCards(cont);
    } else cont();
  };

  Game.monthEnd = function () {
    const S = CK.S;
    S.phase = 'monthEnd';
    for (const st of S.stores) { st.monthProfits.push(st.money - st.monthStartMoney); st.monthStartMoney = st.money; }
    const me = S.stores[0], rv = S.stores[1];
    if (me.monthProfits[me.monthProfits.length - 1] >= rv.monthProfits[rv.monthProfits.length - 1]) S.monthWins++;
    const final = S.monthIdx >= S.monthsTotal - 1;
    CK.UI.screenSettle(() => {
      if (final) { Game.finish(); return; }
      Game.beginMonth(S.monthIdx + 1);
      S.stores.forEach((st) => (st._d = CK.derive(st)));
      CK.AI.monthEnd(rv);
      CK.UI.screenShop(() => CK.UI.screenStaff(() => CK.UI.screenProducts(() => { S.week = 0; Game.beginWeek(); })));
    });
  };

  Game.finish = function () {
    CK.S.phase = 'result';
    CK.UI.screenResult();
  };

  // ---- 月末まわりの共通処理（プレイヤーとAIで共通） ----
  Game.cardOffers = function (st) {
    const out = [];
    let guard = 0;
    while (out.length < 3 && guard++ < 60) {
      const r = CK.rand();
      const R = CFG.cardRarity;
      const rar = r < R.legend ? 'legend' : r < R.legend + R.peaky ? 'peaky' : r < R.legend + R.peaky + R.rare ? 'rare' : 'normal';
      const pool = CK.DATA.cards.filter((c) => c.rarity === rar && !out.includes(c) && !((c.rarity === 'legend' || c.rarity === 'peaky') && st.cardList.includes(c.id)));
      if (pool.length) out.push(U.pick(pool));
    }
    return out;
  };
  // replaceIdx を渡すと、その枠のカードと入れ替える
  Game.takeCard = (st, id, replaceIdx) => {
    if (replaceIdx != null) st.cardList[replaceIdx] = id;
    else st.cardList.push(id);
    CK.syncCards(st);
    st._d = CK.derive(st);
  };
  Game.facPrice = (st, f) => { const n = st.facilities[f.id] || 0; return f.prices ? f.prices[Math.min(n, f.prices.length - 1)] : Math.round(f.base * Math.pow(f.growth || 1, n)); };
  Game.facCanBuy = (st, f) => !f.max || (st.facilities[f.id] || 0) < f.max;
  Game.buyFac = function (st, id) {
    const f = CK.byId.fac[id];
    if (!Game.facCanBuy(st, f)) return;
    st.money -= Game.facPrice(st, f);
    st.facilities[id] = (st.facilities[id] || 0) + 1;
    if (f.onBuy) f.onBuy(st);
  };
  Game.buyItem = (st, id) => { const it = CK.byId.item[id]; st.money -= it.price; st.items[id] = (st.items[id] || 0) + it.uses; };
  Game.staffCandidates = function (st) {
    const n = CFG.staffCandidates + ((st._d && st._d.acc.staffCandidates) || 0);
    const out = [];
    for (let i = 0; i < n; i++) out.push(CK.DATA.genStaff());
    return out;
  };

  // ---- メインループ ----
  let last = 0, hudT = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const S = CK.S;
    let running = false;
    if (S && S.stores && S.monthTrend) {
      running = S.phase === 'run' && !S.paused && !CK.UI.modalActive();
      if (running) CK.Sim.step(dt * S.speed);
      else S.stores.forEach((st) => (st._d = CK.derive(st)));
    }
    CK.Render.draw(dt, running && CK.S && CK.S.phase === 'run');
    hudT -= dt;
    if (hudT <= 0) { hudT = 0.2; CK.UI.refresh(); }
    requestAnimationFrame(frame);
  }

  window.addEventListener('load', () => {
    CK.indexData();
    CK.Render.init();
    CK.UI.init();
    CK.UI.screenTitle();
    requestAnimationFrame((t) => { last = t; frame(t); });
  });
})();

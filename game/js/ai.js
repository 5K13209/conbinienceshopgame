(function () {
  'use strict';
  const CK = window.CK, U = CK.U, CFG = CK.CFG;
  const AI = (CK.AI = {});
  const pers = (st) => CK.DATA.personalities[st.personality];

  function prodScore(st, p, chosen) {
    const S = CK.S;
    let s = 10 * p.best.length + 4 * p.good.length;
    for (const k of CK.PREFS) {
      const tag = CK.DATA.prefInfo[k].tag;
      if (tag && p.tags.includes(tag)) s += 120 * (S.prefs[k] || 0);
    }
    if (S.monthTrend && p.tags.includes(S.monthTrend.tag)) s += 10;
    if (S.weekTrend && p.tags.includes(S.weekTrend.tag)) s += 4;
    for (const c of chosen) {
      if (c.best.some((b) => p.best.includes(b))) s += 6;
      if (c.tags.some((t) => p.tags.includes(t))) s += 6;
    }
    if (p.price === 0) s -= 4;
    return s + U.rand(0, 8);
  }

  AI.pickProducts = function (st) {
    const slots = CFG.stdSlots + ((st._d && st._d.acc.stdSlots) || 0);
    const chosen = [];
    while (chosen.length < slots) {
      let best = null, bs = -1e9;
      for (const p of CK.DATA.products) {
        if (chosen.includes(p)) continue;
        const s = prodScore(st, p, chosen);
        if (s > bs) { bs = s; best = p; }
      }
      chosen.push(best);
    }
    st.products = chosen.map((p) => p.id);
  };

  AI.hireLoop = function (st, cands) {
    const pp = pers(st);
    const isClerk = (s) => CK.byId.job[s.job].cat === 'clerk';
    // 店員が少ないとお客をさばけないので、性格に関係なくまず店員を2人以上そろえる
    if (st.staff.length >= st.staffSlots && st.lastLostRatio > 0.03) {
      const nonClerk = st.staff.filter((s) => !isClerk(s));
      const clerkCand = cands.find(isClerk);
      if (nonClerk.length && clerkCand) st.staff.splice(st.staff.indexOf(nonClerk[nonClerk.length - 1]), 1);
    }
    while (st.staff.length < st.staffSlots && cands.length) {
      const needRot = st.lastLostRatio > 0.02 || st.staff.filter(isClerk).length < 2;
      const pool = needRot && cands.some(isClerk) ? cands.filter(isClerk) : cands;
      const c = U.weighted(pool, (c) => {
        let w = pp.staffPref[c.job] || 1;
        if (needRot && CK.byId.job[c.job].cat === 'clerk') w *= 3;
        if (c.skills.some((s) => CK.byId.skill[s].neg)) w *= 0.4;
        return w;
      });
      if (st.money < CFG.aiReserve + c.wage * 10) break;
      st.staff.push(c);
      cands.splice(cands.indexOf(c), 1);
      if (!needRot && CK.rand() < 0.1) break;
    }
  };

  AI.initial = function (st) {
    st._d = CK.derive(st);
    AI.pickProducts(st);
    AI.hireLoop(st, CK.Game.staffCandidates(st));
  };

  AI.prepWeek = function (st) {
    const S = CK.S, pp = pers(st);
    // 限定品
    if (st.offers.length) {
      const base = CK.prodsOf(st).filter((x) => !x.limited).map((x) => x.p);
      let best = null, bs = -1e9;
      for (const id of st.offers) { const s = prodScore(st, CK.byId.product[id], base); if (s > bs) { bs = s; best = id; } }
      st.limited = best;
    }
    // 妨害
    const quota = CK.sabQuota(st);
    // 疑惑が高いときは（陰湿型以外）いったん控える
    const tooHot = CK.suspLevel(st) === '高' && st.personality !== 'sneaky';
    if (st.sabUsed < quota && st.money > 80000 && !tooHot) {
      const need = quota - st.sabUsed;
      const left = CFG.weeksPerMonth - S.week;
      const p = pp.sabAll && need >= left ? 1 : pp.sabWeekChance;
      if (CK.rand() < p) {
        const cands = CK.Sim.sabCandidates(st).filter((s) => CK.Sim.sabCost(st, s) < st.money - 50000);
        if (cands.length) {
          let pick;
          if (pp.sabStyle === 'effect') pick = cands.reduce((a, b) => (CK.Sim.sabCost(st, b) > CK.Sim.sabCost(st, a) ? b : a));
          else if (pp.sabStyle === 'sns') pick = cands.find((s) => s.cat === 'sns') || cands[0];
          else pick = cands.reduce((a, b) => (CK.Sim.sabOdds(st, b).success > CK.Sim.sabOdds(st, a).success ? b : a));
          CK.Sim.planSabotage(st, pick.id);
        }
      }
    }
    // 罠
    st.trap = null;
    if (CK.rand() < pp.trapChance) {
      const h = S.playerSabHistory;
      const tot = h.physical + h.sns + h.business;
      const cat = tot > 0 ? U.weighted(CK.CATS, (c) => h[c] + 0.5) : U.pick(CK.CATS);
      const itemId = Object.keys(st.items).find((k) => st.items[k] > 0 && CK.byId.item[k].main.some((id) => CK.byId.sab[id] && CK.byId.sab[id].cat === cat));
      if (itemId) st.trap = { type: 'item', item: itemId };
      else {
        const cost = CK.Sim.trapCost(st);
        if (st.money > cost + 60000) { st.money -= cost; st.trap = { type: 'generic', cat }; }
      }
    }
  };

  AI.tick = function (st, d) {
    const pp = pers(st);
    if (st.snsCooldown <= 0 && CK.rand() < pp.snsDaily * d) {
      const cands = CK.Sim.snsCandidates(st);
      const q = CK.rand() < pp.goodPick ? 'good' : CK.rand() < 0.75 ? 'normal' : 'bad';
      CK.Sim.snsPost(st, cands.find((x) => x.quality === q));
    }
  };

  AI.chooseEvent = function (st, ev, opts) {
    const itemOpt = opts.find((o) => o.isItem === 'main');
    if (itemOpt && CK.rand() < 0.85) return itemOpt;
    const plain = opts.filter((o) => !o.isItem);
    const k = st.personality;
    return U.weighted(plain.length ? plain : opts, (o) => (o.ai && o.ai[k] != null ? o.ai[k] : 1));
  };

  AI.sabResponse = function (st, sab) {
    const opts = CK.Sim.sabResponseOptions(st, sab);
    const main = opts.find((o) => o.useItem && o.factor === 0);
    if (main) return main;
    const sub = opts.find((o) => o.useItem);
    if (sub && CK.rand() < 0.7) return sub;
    const k = st.personality;
    if ((k === 'defensive' || (k === 'normal' && CK.rand() < 0.5)) && st.money > 150000) return opts.find((o) => o.pay);
    return opts[opts.length - 1];
  };

  AI.chooseScandal = function (st, opts) {
    const k = st.personality;
    const by = (id) => opts.find((o) => o.id === id);
    if (k === 'sneaky') return st.money > 350000 ? by('apology') : by('silence');
    if (k === 'sns') return CK.rand() < 0.5 ? by('excuse') : by('apology');
    return st.money > 150000 ? by('apology') : by('silence');
  };

  // 2週間ごとの強化カード。枠がいっぱいなら、いちばん要らないカードと入れ替えるか見送る
  AI.cardPick = function (st) {
    const pp = pers(st);
    const val = (c) => (pp.cardCat[c.cat] || 1) * { normal: 1, rare: 2, legend: 4, peaky: 2.5 }[c.rarity];
    const offers = CK.Game.cardOffers(st);
    if (!offers.length) return;
    const card = U.weighted(offers, val);
    if (st.cardList.length < CK.cardSlots(st)) { CK.Game.takeCard(st, card.id); return; }
    let worst = 0;
    st.cardList.forEach((id, i) => { if (val(CK.byId.card[id]) < val(CK.byId.card[st.cardList[worst]])) worst = i; });
    if (val(card) > val(CK.byId.card[st.cardList[worst]])) CK.Game.takeCard(st, card.id, worst);
  };

  AI.monthEnd = function (st) {
    const S = CK.S, pp = pers(st), G = CK.Game, reserve = CFG.aiReserve;
    st._d = CK.derive(st);
    // 設備
    if (st.lastLostRatio > 0.02) {
      const f = CK.byId.fac.register;
      if (st.money - G.facPrice(st, f) > reserve) G.buyFac(st, f.id);
    }
    if (st.staff.length >= st.staffSlots && st.money > 260000) {
      const f = CK.byId.fac.expand;
      if (G.facCanBuy(st, f) && st.money - G.facPrice(st, f) > reserve) G.buyFac(st, f.id);
    }
    if (!st.facilities.sign && st.money > 300000 && CK.rand() < 0.5) G.buyFac(st, 'sign');
    // 対策アイテム
    for (let i = 0; i < pp.itemBuys; i++) {
      const it = U.pick(S.shopItems);
      if (it && st.money - it.price > reserve) G.buyItem(st, it.id);
    }
    // バイト
    AI.hireLoop(st, G.staffCandidates(st));
    // 定番商品
    st._d = CK.derive(st);
    AI.pickProducts(st);
  };
})();

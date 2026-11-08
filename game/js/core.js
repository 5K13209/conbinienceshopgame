(function () {
  'use strict';
  const CK = (window.CK = window.CK || {});
  const CFG = CK.CFG;

  // ---- シード付き乱数（mulberry32） ----
  let _s = 123456789;
  CK.setSeed = (s) => { _s = (s >>> 0) || 1; };
  CK.rand = function () {
    _s |= 0; _s = (_s + 0x6d2b79f5) | 0;
    let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const U = (CK.U = {
    rand: (a = 0, b = 1) => a + (b - a) * CK.rand(),
    randInt: (a, b) => Math.floor(a + (b - a + 1) * CK.rand()),
    pick: (arr) => arr[Math.floor(CK.rand() * arr.length)],
    shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(CK.rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    sample: (arr, n) => U.shuffle(arr).slice(0, n),
    weighted: (arr, wf) => {
      let tot = 0; const ws = arr.map((x) => { const w = Math.max(0, wf(x) || 0); tot += w; return w; });
      if (tot <= 0) return U.pick(arr);
      let r = CK.rand() * tot;
      for (let i = 0; i < arr.length; i++) { r -= ws[i]; if (r <= 0) return arr[i]; }
      return arr[arr.length - 1];
    },
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    yen: (n) => (n < 0 ? '-¥' : '¥') + Math.abs(Math.round(n)).toLocaleString(),
    fill: (tpl, o) => tpl.replace(/\{(\w+)\}/g, (m, k) => (o[k] !== undefined ? o[k] : m)),
  });

  CK.SEGS = ['young', 'mid', 'old'];
  CK.SEG_NAME = { young: '若者', mid: '中年', old: '老人' };
  // 明るいモニターでも読めるよう、濃いめで色相がはっきり違う3色
  CK.SEG_COLOR = { young: '#c2255c', mid: '#2f5fb3', old: '#1e7a46' };
  CK.PREFS = ['normal', 'sweet', 'spicy', 'hearty', 'healthy', 'otaku'];
  CK.CATS = ['physical', 'sns', 'business'];
  CK.CAT_NAME = { physical: '物理', sns: 'SNS', business: '業務' };
  CK.DAY_NAME = ['月', '火', '水', '木', '金', '土', '日'];
  CK.SLOT_ICON = { morning: '🌅', noon: '☀️', night: '🌙' };
  CK.SEASON_NAME = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
  CK.SEASON_ICON = { spring: '🌸', summer: '🌻', autumn: '🍁', winter: '⛄' };
  CK.seasonOf = (m) => (m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter');
  CK.slotOf = (t) => { const f = t - Math.floor(t); return f < 1 / 3 ? 'morning' : f < 2 / 3 ? 'noon' : 'night'; };
  CK.slotNow = () => CK.slotOf(Math.min(CK.S.weekT, 6.999));
  CK.dayIdx = () => Math.min(6, Math.floor(CK.S.weekT));

  // ---- 効果の足し算 ----
  CK.Eff = {
    add(acc, eff, k = 1) {
      if (!eff) return;
      for (const key in eff) {
        const v = eff[key];
        if (typeof v === 'number') acc[key] = (acc[key] || 0) + v * k;
        else if (typeof v === 'boolean') { if (v && k > 0) acc[key] = true; }
        else if (v && typeof v === 'object') {
          acc[key] = acc[key] || {};
          for (const s in v) acc[key][s] = (acc[key][s] || 0) + v[s] * k;
        }
      }
    },
    get(acc, key, sub) {
      const o = acc[key];
      if (!o) return 0;
      if (sub === undefined) return typeof o === 'number' ? o : 0;
      return (o[sub] || 0) + (o.all || 0);
    },
  };

  CK.indexData = function () {
    const D = CK.DATA;
    const idx = (arr) => { const o = {}; arr.forEach((x) => (o[x.id] = x)); return o; };
    CK.byId = {
      product: idx(D.products.concat(D.limited)),
      sab: idx(D.sabotages),
      item: idx(D.items),
      event: idx(D.events),
      card: idx(D.cards),
      fac: idx(D.facilities),
      job: idx(D.jobs),
      skill: idx(D.skills),
    };
  };

  CK.newStore = function (id, name, isAI, personality) {
    return {
      id, name, isAI, personality,
      money: CFG.startMoney, rep: CFG.baseRep,
      products: [], limited: null, offers: [],
      staff: [], staffSlots: CFG.staffSlots,
      cardList: [], cards: {}, facilities: {}, items: {},
      suspicion: 0, snsCooldown: 0, snsBuffs: [], effects: [],
      sabUsed: 0, plannedSab: null, trap: null, noLimitedNext: false,
      tokens: 5,
      weekSales: 0, weekGross: 0, weekLost: 0, weekVisitors: 0,
      monthLost: 0, monthVisitors: 0, lastLostRatio: 0,
      monthStartMoney: CFG.startMoney, monthProfits: [],
      lastScandalAbs: -999, pendingSilence: [],
      stats: { sabTried: 0, sabSuccess: 0, defended: 0, scandals: 0, buzz: 0, sold: {}, visitors: 0, lostTotal: 0 },
    };
  };

  CK.hasJob = (st, job) => st.staff.some((s) => s.job === job);
  CK.addEffect = (st, e, days) => { e.until = CK.S.abs + days; st.effects.push(e); };
  CK.prodsOf = (st) => {
    const arr = st.products.map((id) => ({ p: CK.byId.product[id], limited: false })).filter((x) => x.p);
    if (st.limited && CK.byId.product[st.limited]) arr.push({ p: CK.byId.product[st.limited], limited: true });
    return arr;
  };
  CK.synCtx = function (list) {
    const ps = list.map((x) => x.p);
    const tagCount = {};
    ps.forEach((p) => p.tags.forEach((t) => (tagCount[t] = (tagCount[t] || 0) + 1)));
    const lim = list.find((x) => x.limited);
    const shun = !!lim && list.some((x) => !x.limited && x.p.tags.some((t) => lim.p.tags.includes(t)));
    return { ps, tagCount, shun, list };
  };
  CK.synergiesOf = (list) => { const c = CK.synCtx(list); return CK.DATA.synergies.filter((s) => s.check(c)); };
  CK.topSeg = (st) => { const g = st._d ? st._d.gauges : { young: 1, mid: 0, old: 0 }; return CK.SEGS.reduce((a, b) => (g[b] > g[a] ? b : a)); };
  CK.topPref = () => { const p = CK.S.prefs; return CK.PREFS.filter((x) => x !== 'normal').reduce((a, b) => (p[b] > p[a] ? b : a)); };
  CK.suspLevel = (st) => (st.suspicion >= 7 ? '高' : st.suspicion >= 3 ? '中' : '低');
  CK.sabQuota = (st) => Math.max(0, CFG.sabotagePerMonth + ((st._d && st._d.acc.sabMax) || 0));
  CK.cardSlots = (st) => CFG.cardSlots + ((st._d && st._d.acc.cardSlots) || 0);
  CK.syncCards = (st) => { st.cards = {}; for (const id of st.cardList) st.cards[id] = (st.cards[id] || 0) + 1; };

  // ---- 店の「いまの能力値」をまとめて計算する ----
  CK.derive = function (st) {
    const S = CK.S, E = CK.Eff, acc = {};
    for (const sf of st.staff) {
      const job = CK.byId.job[sf.job];
      E.add(acc, job.eff, sf.slackToday ? 0.5 : 1);
      for (const sk of sf.skills) E.add(acc, CK.byId.skill[sk].eff);
    }
    for (const id of st.cardList) E.add(acc, CK.byId.card[id].eff);
    for (const id in st.facilities) E.add(acc, CK.byId.fac[id].eff, st.facilities[id]);

    const list = CK.prodsOf(st);
    const ctx = CK.synCtx(list);
    const seasonTag = CK.DATA.seasonTag[S.season] || {};
    const prods = [];
    for (const x of list) {
      const p = x.p;
      let m = 1, trendHit = false;
      const tb = acc.trendBoost || 0;
      if (S.monthTrend && p.tags.includes(S.monthTrend.tag)) { m *= CFG.trendMonthMul + tb; trendHit = true; }
      if (S.weekTrend && p.tags.includes(S.weekTrend.tag)) { m *= CFG.trendWeekMul + tb * 0.5; trendHit = true; }
      if (!trendHit && acc.offTrendPenalty) m *= Math.max(0.1, 1 - acc.offTrendPenalty);
      for (const t of p.tags) {
        if (seasonTag[t]) m *= seasonTag[t];
        if (acc.tagMult && acc.tagMult[t]) m *= 1 + acc.tagMult[t];
      }
      if (x.limited && ctx.shun) m *= 1.5;
      m *= Math.max(0.1, 1 + (x.limited ? acc.limitedBoost || 0 : acc.stdBoost || 0));
      E.add(acc, p.eff, m);
      if (p.special === 'xmas' && S.calMonth === 12 && S.week === 3) E.add(acc, { basket: { all: 0.4 } });
      if (p.special === 'ehomaki' && S.calMonth === 2 && S.week === 0) E.add(acc, { visit: { all: 0.3 } });
      prods.push({ p, m, limited: x.limited });
    }
    const syns = CK.DATA.synergies.filter((s) => s.check(ctx));
    for (const s of syns) E.add(acc, s.eff);

    let rotMul = 1, costMul = 1;
    const visitMul = { all: 1 }, prefMul = {};
    for (const e of st.effects) {
      if (e.until <= S.abs) continue;
      if (e.kind === 'add') E.add(acc, { [e.key]: e.seg ? { [e.seg]: e.v } : e.v });
      else if (e.key === 'visit') { const k = e.seg || 'all'; visitMul[k] = (visitMul[k] || 1) * e.v; }
      else if (e.key === 'rot') rotMul *= e.v;
      else if (e.key === 'cost') costMul *= e.v;
      else if (e.key === 'pref') prefMul[e.pref] = (prefMul[e.pref] || 1) * e.v;
    }
    costMul *= Math.max(0.3, 1 + (acc.costPct || 0));
    for (const b of st.snsBuffs) {
      const age = S.abs - b.start;
      if (age >= 0 && age < b.days) E.add(acc, { gauge: { [b.seg]: b.amount * (1 - age / b.days) } });
    }
    const gauges = {};
    for (const s of CK.SEGS) gauges[s] = U.clamp(CFG.gaugeBase + E.get(acc, 'gauge', s), 0, 100);
    const rep = U.clamp(st.rep + (acc.repStatic || 0), 1, 5);
    const d = { acc, prods, syns, shun: ctx.shun, gauges, rep, tagCount: ctx.tagCount, rotMul, costMul, visitMul, prefMul, priceMul: 1 + (acc.price || 0) };
    d.R = (slot) => Math.max(1, (CFG.rotBase + (acc.rot || 0) + (slot === 'night' ? acc.rotNight || 0 : 0)) * (1 + (acc.rotPct || 0)) * rotMul);
    d.visit = (seg, slot) => Math.max(0.05, (1 + E.get(acc, 'visit', seg)) * (1 + E.get(acc, 'visitSlot', slot))) * visitMul.all * (visitMul[seg] || 1);
    d.prefVisit = (pref) => (1 + E.get(acc, 'visitPref', pref)) * (prefMul[pref] || 1);
    d.buy = (seg) => E.get(acc, 'buy', seg);
    d.basket = (seg) => E.get(acc, 'basket', seg);
    return d;
  };
})();

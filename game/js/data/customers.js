(function () {
  const D = (CK.DATA = CK.DATA || {});

  D.prefInfo = {
    normal: { name: '普通', icon: '🙂', tag: null },
    sweet: { name: '甘党', icon: '🍰', tag: '甘い' },
    spicy: { name: '辛党', icon: '🌶️', tag: '辛い' },
    hearty: { name: 'がっつり派', icon: '🍖', tag: 'ガッツリ' },
    healthy: { name: '健康志向', icon: '🥦', tag: '健康' },
    otaku: { name: 'オタク', icon: '🎮', tag: '趣味' },
  };

  // 内部の時間帯ごとの客層比率
  D.slotRatios = {
    morning: { young: 0.3, mid: 0.5, old: 0.2 },
    noon: { young: 0.2, mid: 0.3, old: 0.5 },
    night: { young: 0.6, mid: 0.3, old: 0.1 },
  };

  // 季節ごとの「好み」の傾き
  D.prefTilt = {
    spring: { sweet: 3, spicy: 1, hearty: 1, healthy: 1.5, otaku: 1.5 },
    summer: { sweet: 1.2, spicy: 2.5, hearty: 2.5, healthy: 1, otaku: 1.5 },
    autumn: { sweet: 2.5, spicy: 1, hearty: 2.5, healthy: 1, otaku: 1.5 },
    winter: { sweet: 1.2, spicy: 2.2, hearty: 1.2, healthy: 2.5, otaku: 1.2 },
  };

  D.genPrefs = function (season) {
    const U = CK.U;
    const non = U.rand(0.25, 0.35);
    const t = D.prefTilt[season];
    const w = {};
    let s = 0;
    for (const k in t) { w[k] = t[k] * U.rand(0.6, 1.4); s += w[k]; }
    const r = { normal: 1 - non };
    for (const k in t) r[k] = (non * w[k]) / s;
    return r;
  };
})();

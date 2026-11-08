(function () {
  const D = (CK.DATA = CK.DATA || {});
  const add = (...a) => CK.addEffect(...a);
  const rep = (st, v) => CK.Sim.changeRep(st, v);
  const down = (x) => Math.max(0.1, 1 - x); // 「−x」の倍率（下がりすぎないように）

  D.trapNames = { physical: '見張り番', sns: '通報対策チーム', business: '電話番号の確認' };

  // success / scandal はパーセント。決まれば相手の1週間の売上が大きく削れる強さにしてある
  D.sabotages = [
    { id: 'dirty', name: '店の前を汚す', icon: '🗑️', cat: 'physical', cost: 15000, success: 75, scandal: 6,
      desc: '相手の来店 −30%（4日）、評判 −0.2',
      apply: (def, m) => { add(def, { kind: 'mul', key: 'visit', v: down(0.3 * m), tag: 'dirty' }, 4); rep(def, -0.2 * m); } },
    { id: 'yankee', name: 'ヤンキーをたむろさせる', icon: '😎', cat: 'physical', cost: 45000, success: 70, scandal: 8,
      desc: '相手の来店 −45%、老人はさらに −50%（5日）',
      costFn: (att) => (CK.hasJob(att, 'yankee') ? 22000 : 45000),
      apply: (def, m, ctx) => {
        const days = 5 + (ctx && ctx.att && CK.hasJob(ctx.att, 'yankee') ? 2 : 0);
        add(def, { kind: 'mul', key: 'visit', v: down(0.45 * m), tag: 'yankee' }, days);
        add(def, { kind: 'mul', key: 'visit', seg: 'old', v: down(0.5 * m) }, days);
      } },
    { id: 'streamer', name: '迷惑系配信者をけしかける', icon: '📱', cat: 'physical', cost: 60000, success: 60, scandal: 9,
      desc: '相手の評判 −0.6、3日間 回転率 −50%・来店 −20%',
      apply: (def, m) => { rep(def, -0.6 * m); add(def, { kind: 'mul', key: 'rot', v: down(0.5 * m), tag: 'streamer' }, 3); add(def, { kind: 'mul', key: 'visit', v: down(0.2 * m) }, 3); } },
    { id: 'parking', name: '違法駐車で入口をふさぐ', icon: '🚗', cat: 'physical', cost: 20000, success: 75, scandal: 7,
      desc: '相手の来店 −35%（3日）',
      apply: (def, m) => { add(def, { kind: 'mul', key: 'visit', v: down(0.35 * m), tag: 'car' }, 3); } },
    { id: 'review', name: '酷評レビューを流す', icon: '⭐', cat: 'sns', cost: 25000, success: 70, scandal: 7,
      desc: '相手の評判 −0.6、5日間 来店 −15%',
      apply: (def, m) => { rep(def, -0.6 * m); add(def, { kind: 'mul', key: 'visit', v: down(0.15 * m), tag: 'review' }, 5); } },
    { id: 'impersonate', name: 'なりすまし投稿', icon: '🎭', cat: 'sns', cost: 60000, success: 65, scandal: 10,
      desc: '相手のいちばん強い客層ゲージ −35（2週）', req: (att) => CK.hasJob(att, 'hacker'), reqText: 'ハッカーが必要',
      targetKind: 'seg', target: (def) => CK.topSeg(def),
      apply: (def, m, ctx) => { add(def, { kind: 'add', key: 'gauge', seg: ctx.target, v: -35 * m, tag: 'fake' }, 14); } },
    { id: 'rumor', name: '変なうわさを流す', icon: '🗯️', cat: 'sns', cost: 35000, success: 65, scandal: 8,
      desc: '街でいちばん多い「好み」の客が相手の店に来なくなる（−80%、10日）＋評判 −0.2',
      targetKind: 'pref', target: () => CK.topPref(),
      apply: (def, m, ctx) => { add(def, { kind: 'mul', key: 'pref', pref: ctx.target, v: down(0.8 * m), tag: 'rumor' }, 10); rep(def, -0.2 * m); } },
    { id: 'prank', name: 'いたずら大量注文の電話', icon: '☎️', cat: 'business', cost: 30000, success: 70, scandal: 7,
      desc: '相手の回転率 −60%（2日）',
      apply: (def, m) => { add(def, { kind: 'mul', key: 'rot', v: down(0.6 * m), tag: 'phone' }, 2); } },
    { id: 'supplier', name: '仕入れ業者に手を回す', icon: '📦', cat: 'business', cost: 70000, success: 55, scandal: 10,
      desc: '相手の今の限定品を撤去させ、来週の限定品も届かなくする。さらに1週間 原価 +20%',
      apply: (def, m) => { def.limited = null; def.noLimitedNext = true; add(def, { kind: 'mul', key: 'cost', v: 1 + 0.2 * m, tag: 'supply' }, 7); } },
  ];
})();

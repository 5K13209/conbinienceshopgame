(function () {
  const D = (CK.DATA = CK.DATA || {});
  const add = (...a) => CK.addEffect(...a);
  const rep = (st, v) => CK.Sim.changeRep(st, v);
  const luck = (st, p) => CK.Sim.luck(st, p);
  const yen = (n) => CK.U.yen(n);

  // 欠勤するバイト（決定的に選ぶ：同じイベントで文と選択肢がズレないように）
  function absentStaff(st) {
    const c = st.staff.filter((s) => !s.skills.includes('stamina'));
    if (!c.length) return null;
    return c.find((s) => s.skills.includes('late')) || c[c.length - 1];
  }
  function sportsLike(id, name, icon, seasons, mul, text) {
    return {
      id, name, icon, seasons, text,
      global: () => { CK.S.globalEffects.push({ v: mul, until: CK.S.abs + 1 }); },
      options: [
        { label: '👥 臨時で増員', desc: '50,000円。その日の回転率 +60%', ai: { normal: 2, defensive: 3, sneaky: 1, sns: 2 }, fn: (st) => { st.money -= 50000; add(st, { kind: 'mul', key: 'rot', v: 1.6 }, 1); return '臨時スタッフで迎え撃つ！'; } },
        { label: '😐 いつも通り', desc: 'タダ。さばききれない客が出るかも', ai: { normal: 1, defensive: 0.5, sneaky: 2, sns: 1 }, fn: () => 'いつも通りの体制でいく' },
      ],
      itemMain: (st) => { add(st, { kind: 'mul', key: 'rot', v: 1.6 }, 1); return '派遣券でタダで増員できた！'; },
      itemMainDesc: 'タダで増員（回転率 +60%）',
    };
  }

  D.events = [
    { id: 'claim', name: 'クレーム客', icon: '😡', text: '「弁当がぬるいんだけど！」お客さんがカンカンだ。',
      options: [
        { label: '🙇 平謝りする', desc: '半日 回転率 −40%。評判は守れる', ai: { normal: 2, defensive: 3, sneaky: 1, sns: 2 }, fn: (st) => { add(st, { kind: 'mul', key: 'rot', v: 0.6 }, 0.5); return '平謝りでなんとか収まった'; } },
        { label: '😤 毅然と断る', desc: 'タダ。40%で低評価レビュー拡散（評判 −0.4、3日間 来店 −15%）', ai: { normal: 1, defensive: 0.5, sneaky: 2, sns: 1 }, fn: (st) => { if (!luck(st, 0.6)) { rep(st, -0.4); add(st, { kind: 'mul', key: 'visit', v: 0.85 }, 3); return '低評価レビューが拡散された…（評判 −0.4）'; } return 'お客さんは引き下がった'; } },
      ],
      itemMain: () => 'マニュアル通りの神対応で、逆に感謝された', itemMainDesc: '回転率ロスなし・評判ダウンなし',
      itemSub: () => '強面の店長代理が出てきたら、静かに帰っていった', itemSubDesc: '評判ダウンなしで追い返す' },

    { id: 'cat', name: '店の前で猫が寝てる', icon: '🐈', text: '入口の前で、ぽっちゃりした猫が気持ちよさそうに寝ている。',
      options: [
        { label: '📸 写真を投稿する', desc: 'クールタイム無視で「良い」投稿と同じ効果', ai: { normal: 3, defensive: 2, sneaky: 2, sns: 6 }, fn: (st) => { CK.Sim.snsPost(st, { quality: 'good', seg: CK.topSeg(st), text: CK.U.fill(CK.U.pick(CK.DATA.sns.cat), { shop: st.name }) }, true); return '猫の写真がバズった！🐈'; } },
        { label: '😌 そっとしておく', desc: '何も起きない', ai: { normal: 1, defensive: 1, sneaky: 1, sns: 0.2 }, fn: () => '猫はしばらくして去っていった' },
      ] },

    { id: 'absence', name: 'バイトの急な欠勤', icon: '🤒',
      text: (st) => { const s = absentStaff(st); return s ? `${s.name}から「今日休みます…」と連絡が来た。` : 'シフトの穴が…と思ったら、全員ちゃんと来ていた！'; },
      options: (st) => absentStaff(st) ? [
        { label: '💪 店長が自分で入る', desc: '2日間 回転率 −35%', ai: { normal: 2, defensive: 1, sneaky: 2, sns: 2 }, fn: (s) => { add(s, { kind: 'mul', key: 'rot', v: 0.65 }, 2); return '店長がレジに立った'; } },
        { label: '📞 代わりを呼ぶ', desc: '40,000円', ai: { normal: 1, defensive: 2, sneaky: 1, sns: 1 }, fn: (s) => { s.money -= 40000; return '代わりのバイトが来てくれた'; } },
      ] : [{ label: '👍 よかった', desc: '何も起きない', fn: () => '' }],
      itemMain: () => '派遣券で、すぐに代わりが来た', itemMainDesc: 'タダで穴埋め' },

    { id: 'shady', name: '怪しい業者の売り込み', icon: '🕴️', text: '「いい品、安く卸しますよ…出どころは聞かないでね」',
      options: [
        { label: '🤝 乗る', desc: '2週間 原価 −35%。疑惑 +2、15%でスキャンダル', ai: { normal: 0.6, defensive: 0.1, sneaky: 3, sns: 0.8 }, fn: (st) => { add(st, { kind: 'mul', key: 'cost', v: 0.65 }, 14); st.suspicion += 2; if (CK.rand() < 0.15) { CK.Sim.scandal(st, '怪しい業者との取引がバレた'); return ''; } return '安く仕入れられた…（疑惑 +2）'; } },
        { label: '🙅 断る', desc: '何も起きない', ai: { normal: 2, defensive: 3, sneaky: 0.5, sns: 1.5 }, fn: () => '丁重にお断りした' },
      ] },

    { id: 'shoplifter', name: '万引き犯', icon: '🏃', text: 'お菓子をポケットに入れて走り出した客がいる！',
      options: [
        { label: '🏃 追いかける', desc: '50%で捕まえて評判 +0.3／50%で逃げられて 30,000円の損', ai: { normal: 2, defensive: 1, sneaky: 2, sns: 2 }, fn: (st) => { if (luck(st, 0.5)) { rep(st, 0.3); return '捕まえた！地域で評判に（評判 +0.3）'; } st.money -= 30000; return '逃げられた…（−¥30,000）'; } },
        { label: '📞 通報だけする', desc: '15,000円の損（盗まれた分）', ai: { normal: 1, defensive: 2, sneaky: 0.5, sns: 1 }, fn: (st) => { st.money -= 15000; return '警察に任せた（−¥15,000）'; } },
        { label: '🙈 見逃す', desc: '30,000円の損＋常習犯になる（評判 −0.1）', ai: { normal: 0.3, defensive: 0.3, sneaky: 0.5, sns: 0.3 }, fn: (st) => { st.money -= 30000; rep(st, -0.1); return '見なかったことにした…（−¥30,000）'; } },
      ],
      itemMain: (st) => { rep(st, 0.2); return '万引きGメンが確保！（評判 +0.2）'; }, itemMainDesc: '必ず捕まえる（評判 +0.2）',
      itemSub: (st) => { if (CK.rand() < 0.7) { rep(st, 0.2); return '監視カメラの映像で犯人が捕まった（評判 +0.2）'; } return 'カメラの死角だった…'; }, itemSubDesc: '70%で捕まえる（評判 +0.2）',
      skillOption: (st) => (st._d && st._d.acc.sharpEye ? { label: '👀 目ざといバイトに任せる', desc: '必ず捕まえる（評判 +0.2）', isItem: 'main', fn: (s) => { rep(s, 0.2); return '目ざといバイトが確保した！（評判 +0.2）'; } } : null) },

    { id: 'influencer', name: 'インフルエンサーが来店', icon: '🤳', text: 'フォロワー10万人の人気インフルエンサーが来店した！',
      options: [
        { label: '✨ 神対応する', desc: 'その日の回転率 −25%。若者ゲージ +20（2週）、3日間 来店 +25%', ai: { normal: 2, defensive: 1, sneaky: 1, sns: 4 }, fn: (st) => { add(st, { kind: 'mul', key: 'rot', v: 0.75 }, 1); st.snsBuffs.push({ seg: 'young', amount: 20, start: CK.S.abs, days: 14 }); add(st, { kind: 'mul', key: 'visit', v: 1.25, tag: 'buzz' }, 3); return '神対応が紹介されてバズった！'; } },
        { label: '🙂 普通に接客', desc: '何も起きない', ai: { normal: 1, defensive: 2, sneaky: 1, sns: 0.3 }, fn: () => '普通に帰っていった' },
      ],
      itemSub: (st) => { st.snsBuffs.push({ seg: 'young', amount: 20, start: CK.S.abs, days: 14 }); add(st, { kind: 'mul', key: 'visit', v: 1.25, tag: 'buzz' }, 3); return '派遣スタッフのおかげで、店を回しつつ神対応できた！'; }, itemSubDesc: '回転率ロスなしで神対応' },

    { id: 'drunk', name: '酔っ払い客', icon: '🍶', text: 'ベロベロの酔っ払いがレジ前で絡んできた…',
      options: [
        { label: '😅 なだめる', desc: '半日 回転率 −40%、20%で暴れて 40,000円の損害', ai: { normal: 2, defensive: 1, sneaky: 1, sns: 2 }, fn: (st) => { add(st, { kind: 'mul', key: 'rot', v: 0.6 }, 0.5); if (!luck(st, 0.8)) { st.money -= 40000; return '暴れて商品棚が…（−¥40,000）'; } return 'なんとか帰ってもらった'; } },
        { label: '🚓 警察を呼ぶ', desc: '2日間 来店 −15%', ai: { normal: 1, defensive: 2, sneaky: 1, sns: 1 }, fn: (st) => { add(st, { kind: 'mul', key: 'visit', v: 0.85 }, 2); return 'パトカーが来て、ちょっとした騒ぎに'; } },
      ],
      itemMain: () => '強面の店長代理がひとにらみで追い返した', itemMainDesc: 'ノーダメージで追い返す' },

    { id: 'campaign', name: '本部の新商品キャンペーン', icon: '📣', text: '本部から「新商品キャンペーンに参加しませんか？」と連絡が来た。',
      options: [
        { label: '✋ 参加する', desc: '60,000円。1週間 来店 +30%', ai: { normal: 2, defensive: 1, sneaky: 1, sns: 2 }, fn: (st) => { st.money -= 60000; add(st, { kind: 'mul', key: 'visit', v: 1.3, tag: 'campaign' }, 7); return 'キャンペーンのぼりが立った！'; } },
        { label: '🙅 断る', desc: '何も起きない', ai: { normal: 1, defensive: 1.5, sneaky: 1, sns: 1 }, fn: () => '今回は見送った' },
      ],
      itemSub: (st) => { st.money -= 30000; add(st, { kind: 'mul', key: 'visit', v: 1.3, tag: 'campaign' }, 7); return 'ホットラインのおかげで半額で参加できた'; }, itemSubDesc: '30,000円で参加（1週間 来店 +30%）' },

    { id: 'register', name: 'レジの故障', icon: '💥', text: 'レジが「ピーーー」と鳴ったまま動かなくなった！',
      options: [
        { label: '🔧 修理を呼ぶ', desc: '70,000円', ai: { normal: 2, defensive: 2, sneaky: 1, sns: 2 }, fn: (st) => { st.money -= 70000; return '修理完了（−¥70,000）'; } },
        { label: '🧮 手計算で乗り切る', desc: '3日間 回転率 −50%', ai: { normal: 1, defensive: 0.5, sneaky: 2, sns: 1 }, fn: (st) => { add(st, { kind: 'mul', key: 'rot', v: 0.5 }, 3); return '電卓で必死にさばいている…'; } },
      ],
      itemMain: () => '予備のレジに切り替えて、何事もなかった', itemMainDesc: 'ノーダメージ' },

    { id: 'bulk', name: '部活の大量注文', icon: '⚾', seasons: ['spring', 'summer', 'autumn'], text: '「明日の試合用に、おにぎり100個お願いできますか！」',
      options: [
        { label: '💪 受ける', desc: '売上 +200,000円（利益 +90,000円）。半日 他の客をほぼさばけない', ai: { normal: 2, defensive: 1, sneaky: 2, sns: 2 }, fn: (st) => { st.money += 90000; st.weekSales += 200000; st.weekGross += 90000; add(st, { kind: 'mul', key: 'rot', v: 0.2 }, 0.5); return '大量注文をこなした！'; } },
        { label: '🙅 断る', desc: '何も起きない', ai: { normal: 1, defensive: 1, sneaky: 1, sns: 1 }, fn: () => '今回はお断りした' },
      ],
      itemSub: (st) => { st.money += 90000; st.weekSales += 200000; st.weekGross += 90000; return '段取りよく対応、他のお客さんも待たせなかった'; }, itemSubDesc: '他の客を待たせずに受ける（利益 +90,000円）' },

    { id: 'audit', name: '本部の監査', icon: '🕵️',
      text: (st) => `本部の監査担当がやってきた。「最近、変なことしてませんよね？」<br><span class="muted">あなたの疑惑：${CK.suspLevel(st)}</span>`,
      options: (st) => [
        { label: '📝 正直に申告する', desc: `罰金 ${yen(20000 * st.suspicion)}、疑惑リセット`, ai: { normal: 2, defensive: 3, sneaky: 0.5, sns: 1.5 }, fn: (s) => { const f = 20000 * s.suspicion; s.money -= f; s.suspicion = 0; return f ? `罰金を払った（−${yen(f)}）` : 'やましいことは何もなかった'; } },
        { label: '😇 ごまかす', desc: '疑惑が高いほどバレやすい。バレたら大スキャンダル（評判 −1.2）', ai: { normal: 1, defensive: 0.3, sneaky: 3, sns: 1 }, fn: (s) => { const p = s._d.acc.auditImmune ? 0 : Math.min(0.9, s.suspicion * 0.08); if (CK.rand() < p) { CK.Sim.changeRep(s, -0.4, true); CK.Sim.scandal(s, '監査でごまかしがバレた'); return ''; } return '監査を乗り切った…'; } },
      ],
      itemSub: (st) => { const f = 10000 * st.suspicion; st.money -= f; st.suspicion = 0; return `顧問弁護士の同席で、罰金は半額（−${yen(f)}）`; }, itemSubDesc: '正直に申告して罰金半額' },

    { id: 'tv', name: 'テレビの取材', icon: '📺', text: 'ローカル番組「街角コンビニ探訪」から取材の依頼が来た！',
      options: [
        { label: '🎤 受ける', desc: '4日間 来店 +80%。ただし過去3ヶ月にスキャンダルがあれば蒸し返される（評判 −0.8、1週間 来店 −20%）', ai: { normal: 2, defensive: 1, sneaky: 1.5, sns: 3 }, fn: (st) => { if (CK.S.abs - st.lastScandalAbs < 105) { rep(st, -0.8); add(st, { kind: 'mul', key: 'visit', v: 0.8, tag: 'flame' }, 7); return 'オンエア…でも過去の炎上を蒸し返された！'; } add(st, { kind: 'mul', key: 'visit', v: 1.8, tag: 'tv' }, 4); return 'オンエアされた！客が押し寄せる！'; } },
        { label: '🙅 断る', desc: '何も起きない', ai: { normal: 1, defensive: 1.5, sneaky: 1, sns: 0.3 }, fn: () => '取材は断った' },
      ] },

    sportsLike('fireworks', '近所で花火大会', '🎆', ['summer'], 2, '今夜は近所で花火大会！人出がすごいことになりそうだ（今日の客が2倍）。'),
    sportsLike('sports', '運動会', '🏃‍♀️', ['spring', 'autumn'], 1.6, '近くの小学校で運動会！家族連れがたくさん来そうだ（今日の客が1.6倍）。'),

    { id: 'shower', name: '急な夕立', icon: '⛈️', seasons: ['summer'], text: '空が急に暗くなって、ザーッと夕立が来た！',
      options: [
        { label: '☂️ 傘を店頭に出す', desc: '15,000円。2日間 来店 +40%', ai: { normal: 2, defensive: 2, sneaky: 1, sns: 2 }, fn: (st) => { st.money -= 15000; add(st, { kind: 'mul', key: 'visit', v: 1.4 }, 2); return '傘が飛ぶように売れた！'; } },
        { label: '😐 何もしない', desc: '何も起きない', ai: { normal: 1, defensive: 1, sneaky: 1, sns: 1 }, fn: () => '雨宿りの客がちらほら' },
      ],
      itemMain: (st) => { add(st, { kind: 'mul', key: 'visit', v: 1.5 }, 2); return '傘立てを出して大繁盛！'; }, itemMainDesc: 'タダで2日間 来店 +50%' },

    { id: 'snow', name: '大雪', icon: '❄️', seasons: ['winter'], text: '一晩で雪が積もった！店の前が真っ白だ。',
      options: [
        { label: '🧹 雪かきをする', desc: '40,000円。来店が落ちない', ai: { normal: 2, defensive: 2, sneaky: 1, sns: 2 }, fn: (st) => { st.money -= 40000; return '雪かき完了！'; } },
        { label: '😐 何もしない', desc: '2日間 来店 −50%', ai: { normal: 1, defensive: 0.5, sneaky: 1.5, sns: 1 }, fn: (st) => { add(st, { kind: 'mul', key: 'visit', v: 0.5 }, 2); return '客足が遠のいた…'; } },
      ],
      itemMain: (st) => { add(st, { kind: 'mul', key: 'visit', v: 1.3 }, 2); return 'スコップで一番に雪かき！むしろ客が集まった'; }, itemMainDesc: 'タダで2日間 来店 +30%',
      itemSub: (st) => { add(st, { kind: 'mul', key: 'visit', v: 0.75 }, 2); return '清掃道具で少しはマシに（来店 −25%）'; }, itemSubDesc: '被害を半減（来店 −25%）' },

    { id: 'exam', name: '受験シーズン', icon: '🎓', months: [1, 2], text: '受験生がピリピリしている季節。',
      options: [
        { label: '⛩️ 合格祈願コーナーを作る', desc: '30,000円。若者ゲージ +20（2週）', ai: { normal: 2, defensive: 1, sneaky: 1, sns: 2 }, fn: (st) => { st.money -= 30000; st.snsBuffs.push({ seg: 'young', amount: 20, start: CK.S.abs, days: 14 }); return '合格祈願コーナーが好評！'; } },
        { label: '😐 何もしない', desc: '何も起きない', ai: { normal: 1, defensive: 1, sneaky: 1, sns: 1 }, fn: () => '特に何もしなかった' },
      ] },
  ];
})();

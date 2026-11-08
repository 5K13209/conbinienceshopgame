(function () {
  const D = (CK.DATA = CK.DATA || {});

  // トレンド（タグと結びついている）
  const T = (tag, name, months) => ({ tag, name, months });
  D.trends = {
    spring: [
      T('甘い', '#いちごスイーツ', [3, 4, 5]), T('甘い', '#桜スイーツ', [3, 4]), T('映え', '#お花見映え', [3, 4]), T('映え', '#春コーデ'), T('和風', '#春の和菓子'), T('和風', '#花見団子', [3, 4]),
      T('健康', '#新生活ヘルシー', [3, 4]), T('健康', '#花粉対策', [3, 4]), T('朝型', '#朝活'), T('朝型', '#新社会人の朝', [4]), T('趣味', '#新弾発売'), T('趣味', '#春アニメ', [4]),
      T('ガッツリ', '#新生活スタミナ', [3, 4]), T('ガッツリ', '#部活はじまる', [4]), T('定番', '#いつものやつ'), T('夜型', '#歓迎会帰り', [4]), T('辛い', '#春の激辛祭り'),
    ],
    summer: [
      T('冷たい', '#ひんやり'), T('冷たい', '#猛暑日', [7, 8]), T('冷たい', '#アイス祭り', [7, 8]), T('辛い', '#激辛チャレンジ'), T('辛い', '#汗かき飯'),
      T('夜型', '#夜ふかし'), T('夜型', '#熱帯夜', [7, 8]), T('映え', '#夏映え'), T('映え', '#かき氷映え', [7, 8]), T('ガッツリ', '#スタミナ飯'), T('ガッツリ', '#夏バテ対策', [7, 8]),
      T('趣味', '#夏休み', [7, 8]), T('趣味', '#夏コミ', [8]), T('甘い', '#夏スイーツ'), T('健康', '#熱中症対策', [7, 8]), T('朝型', '#ラジオ体操', [7, 8]), T('定番', '#キャンプ飯'),
    ],
    autumn: [
      T('甘い', '#秋スイーツ'), T('甘い', '#栗スイーツ', [9, 10]), T('ホット', '#焼きいも', [10, 11]), T('ホット', '#肌寒い'), T('ガッツリ', '#食欲の秋'), T('ガッツリ', '#新米', [9, 10, 11]),
      T('和風', '#お月見', [9, 10]), T('和風', '#秋の味覚'), T('趣味', '#読書の秋'), T('趣味', '#ゲームの秋'), T('健康', '#秋の健康診断'), T('健康', '#スポーツの秋'),
      T('映え', '#紅葉映え', [10, 11]), T('映え', '#ハロウィン', [10]), T('夜型', '#長い夜'), T('朝型', '#早起きの秋'), T('辛い', '#秋の激辛'),
    ],
    winter: [
      T('ホット', '#あったかグルメ'), T('ホット', '#寒波襲来'), T('辛い', '#激辛であったまる'), T('辛い', '#鍋の季節'), T('甘い', '#冬スイーツ'), T('甘い', '#バレンタイン', [2]),
      T('健康', '#風邪予防'), T('健康', '#正月太り解消', [1, 2]), T('和風', '#お正月', [1]), T('和風', '#おせち', [12, 1]), T('夜型', '#年末夜ふかし', [12]), T('夜型', '#初日の出待ち', [12]),
      T('映え', '#イルミネーション'), T('映え', '#クリスマス映え', [12]), T('趣味', '#冬休み', [12, 1]), T('ガッツリ', '#受験生応援', [1, 2]), T('定番', '#こたつでぬくぬく'),
    ],
  };
  for (const s in D.trends) D.trends[s].forEach((t) => (t.season = s));

  D.sns = {
    seasonWords: {
      spring: ['春', 'お花見シーズン', '新生活'],
      summer: ['夏', '暑い日', '夏休み'],
      autumn: ['秋', '食欲の秋', '涼しくなってきた今日'],
      winter: ['冬', '寒い日', '年末年始'],
    },
    // 投稿文のテンプレート。k = 使ってよい商品の種類（food 食べ物 / drink 飲み物 / goods グッズ / service サービス）
    // ids = 種類に関係なく使ってよい商品（「毎日食べてるゲーム課金カード」はわざと残しているネタ）
    good: [
      { t: '{season}といえば{item}！ 今がいちばんおいしい季節です✨ {tag}', k: ['food', 'drink'] },
      { t: 'お待たせしました！{item}、たっぷり入荷してます🙌 {tag}', k: ['food', 'drink', 'goods'] },
      { t: '店長イチオシの{item}、本日も揃ってます！ {tag}', k: ['food', 'drink', 'goods'] },
      { t: '{tag} に乗っかって…今週は{item}推しでいきます！', k: ['food', 'drink', 'goods', 'service'] },
      { t: '{season}のおともに{item}はいかがですか？ {tag}', k: ['food', 'drink', 'goods'] },
      { t: 'スタッフも毎日食べてる{item}🥹 {tag}', k: ['food'], ids: ['gamecard'] },
      { t: 'スタッフも毎日飲んでる{item}🥹 {tag}', k: ['drink'] },
      { t: 'スタッフもついつい買っちゃう{item}🥹 {tag}', k: ['goods'] },
      { t: '今週の主役は{item}！見つけたら即買い推奨です {tag}', k: ['food', 'drink', 'goods'] },
      { t: '{item}、ついに最高の季節が来ました🎉 {tag}', k: ['food', 'drink'] },
      { t: '{item}あります。{tag} の波、うちにも来てます🌊', k: ['food', 'drink', 'goods', 'service'] },
      { t: '迷ったら{item}。これが{season}の正解です {tag}', k: ['food', 'drink', 'goods'] },
      { t: 'ひと口で{season}を感じる{item}、できました {tag}', k: ['food'] },
      { t: 'ごくっと一杯、{item}で{season}をのりきろう {tag}', k: ['drink'] },
      { t: '{item}、売り場を広げました！ {tag}', k: ['goods'] },
      { t: '{item}の窓口、いつでもどうぞ！お買い物ついでにぜひ {tag}', k: ['service'] },
    ],
    normal: [
      { t: '本日も元気に営業中です！{item}あります。', k: ['food', 'drink', 'goods', 'service'] },
      { t: 'いらっしゃいませ〜。{item}、ご用意してます。', k: ['food', 'drink', 'goods', 'service'] },
      { t: '{item}、在庫ございます。よろしくお願いします。', k: ['food', 'drink', 'goods'] },
      { t: '今日もがんばります！ #コンビニ', k: ['food', 'drink', 'goods', 'service'] },
      { t: 'おはようございます。{item}入荷しました。', k: ['food', 'drink', 'goods'] },
      { t: '{item}おいしいですよ。たぶん。', k: ['food', 'drink'] },
      { t: '店内きれいにしました！ぜひお立ち寄りください。', k: ['food', 'drink', 'goods', 'service'] },
      { t: 'ポイントカードお持ちですか？ #コンビニ', k: ['food', 'drink', 'goods', 'service'] },
      { t: '{item}の品出し完了しました。', k: ['food', 'drink', 'goods'] },
      { t: '新人さんが入りました！よろしくお願いします。', k: ['food', 'drink', 'goods', 'service'] },
      { t: '{item}、ご利用お待ちしています。', k: ['service'] },
    ],
    bad: [
      { t: '{item}始めました！！ {tag}', k: ['food', 'drink', 'goods'] },
      { t: '{item}大量入荷！…と思ったら置いてませんでした😇', k: ['food', 'drink', 'goods'] },
      { t: '暇なので誰か来てください。{item}あります（ありません）', k: ['food', 'drink', 'goods', 'service'] },
      { t: '{tag} {item}の季節がやってきた〜！（たぶん違う）', k: ['food', 'drink', 'goods'] },
      { t: '向かいの店より安いです。たぶん。知らんけど。', k: ['food', 'drink', 'goods', 'service'] },
      { t: '店長の自撮りです📸 {item}は売り切れです', k: ['food', 'drink', 'goods'] },
      { t: '{item}って正直どうなんですかね？ {tag}', k: ['food', 'drink', 'goods', 'service'] },
      { t: 'バイトが全員帰りました。{item}は自分で探してください', k: ['food', 'drink', 'goods'] },
    ],
    cat: [
      '看板猫(仮)が今日も店の前でお昼寝中です🐈 #猫のいるコンビニ',
      '店の前に猫さんが…かわいすぎて仕事になりません🐱 #猫のいるコンビニ',
    ],
  };

  // 商品の種類（書いていないものは「食べ物」）
  const KIND = {
    energy: 'drink', coffee: 'drink', eiyou: 'drink', tea: 'drink', sportsdrink: 'drink', tapioca: 'drink', matcha: 'drink', beer: 'drink', cocoa: 'drink',
    cardpack: 'goods', manga: 'goods', newspaper: 'goods', acrylic: 'goods', gamecard: 'goods', hanabi: 'goods',
    bills: 'service',
  };
  D.sns.kindOf = (p) => (p ? KIND[p.id] || 'food' : null);
  // その商品に合うテンプレートを1つ選んで、文を作る
  D.sns.write = function (type, p, vars) {
    const kind = D.sns.kindOf(p);
    const pool = D.sns[type].filter((x) => !kind || x.k.includes(kind) || (x.ids && x.ids.includes(p.id)));
    return CK.U.fill(CK.U.pick(pool.length ? pool : D.sns[type]).t, vars);
  };

  const tl = (D.tl = {});
  tl.pref = {
    sweet: ['最近なんか甘いもの食べたくなるんだよな', '疲れたときはやっぱスイーツ', '今日のご褒美なににしよ🍰', '甘いもの断ち、3日で終了しました', 'あまいの…あまいのがほしい…'],
    spicy: ['辛いもの食べて汗かきたい気分', '激辛チャレンジ動画見てたら食べたくなった', '口の中がヒリヒリするやつ求む🌶️', '最近辛いものにハマってる', '辛さレベル5でも物足りなくなってきた'],
    hearty: ['部活終わりにガッツリ食えるとこないかな', '腹ペコすぎて倒れそう', '大盛りって最高の言葉だよね', '今日は量で勝負したい気分', '育ち盛りの胃袋なめんなよ'],
    healthy: ['健康診断の結果がやばい…', '最近野菜足りてない気がする', 'カロリー控えめなやつどこかにないかな', 'ダイエット始めました（3回目）', '塩分ひかえろって医者に言われた'],
    otaku: ['新しいカードの弾、もうすぐ発売じゃん', '今週のマンガ、続きが気になりすぎる', '推しのコラボまだかな', '徹夜でゲームしてたら朝だった', '箱買いするか迷ってる'],
  };
  tl.lost = ['{shop}、いつもレジ並んでるんだよな', '{shop}混みすぎてて諦めた', '{shop}の店員さん足りてなくない？', '{shop}のレジ待ちで遅刻しかけた'];
  tl.segStrong = {
    young: ['最近、学生はみんな{shop}行ってるよね', '{shop}の前、高校生でいっぱいだった'],
    mid: ['仕事帰りはつい{shop}に寄っちゃう', 'うちの部長、毎朝{shop}で何か買ってる'],
    old: ['おばあちゃんが、{shop}は話しやすいって言ってた', '{shop}、近所のじいちゃんたちのたまり場になってる'],
  };
  tl.rivalProduct = ['{shop}の{item}、地味にうまい', '{shop}で{item}買ってきた', '{item}なら{shop}だよな', '{shop}って{item}置いてるんだ'];
  tl.chatter = [
    '眠い', '明日テストなんだが？', '今日めっちゃいい天気', '電車止まってて草', '月曜日つらい',
    '金曜日だ〜！', '推しが尊い', 'お腹すいた', '傘忘れた', '洗濯物干してきた',
    '駅前に新しいカフェできてた', 'バイト行きたくない', '給料日まであと3日…', 'スマホの充電あと5%', '今日は早く寝る（寝ない）',
    '猫に起こされた', '筋トレ3日目', '電車で寝過ごした', '部屋の掃除終わらない', 'なんか面白いことないかな',
  ];
  tl.flame = ['{shop}、ヤバくない？', '{shop}炎上してて草', '{shop}もう行かないわ', 'え、{shop}そんなことしてたの…', '{shop}の件、まとめサイトに載ってる', '{shop}の公式、だんまりかよ'];
  tl.sabRumor = {
    dirty: ['{shop}の前、ゴミだらけだった…'],
    yankee: ['{shop}の前、ヤンキーたまってて怖かった'],
    streamer: ['{shop}に迷惑系配信者来てたらしい'],
    parking: ['{shop}の前に変な車停まってて入れなかった'],
    review: ['{shop}、星1レビュー増えてない？'],
    impersonate: ['{shop}の公式、なんか変な投稿してない？'],
    rumor: ['{shop}って、なんか変なうわさあるよね'],
    prank: ['{shop}、電話鳴りっぱなしだった'],
    supplier: ['{shop}、限定品入ってなかった'],
  };
  tl.detective = {
    physical: ['（探偵より）向かいの店長が、ガラの悪い連中と話し込んでいました…'],
    sns: ['（探偵より）向かいの店のスタッフが、捨てアカを量産しているようです'],
    business: ['（探偵より）向かいの店から、妙な業者への電話が増えています'],
  };
  tl.peek = ['来週は{name}が来そうな予感', '{name}、来週あたりバズりそう', 'そろそろ{name}の季節じゃない？'];
  tl.react = {
    good: ['{shop}の投稿見て来ちゃった', '{shop}のやつ、めっちゃ気になる', 'これ見たら行くしかない', '{shop}の中の人、センスある'],
    normal: ['へー', '{shop}って何置いてたっけ', 'ふーん'],
    bad: ['{shop}の中の人、大丈夫？', '季節感どうした', 'なんか寒い投稿流れてきた', '公式がこれはやばい'],
  };

  const handles = ['konbini', 'harahe', 'yorufuka', 'neko', 'otaku', 'salaryman', 'gakusei', 'baachan', 'kaishaiki', 'ramen', 'sweets', 'mogumogu', 'tabearuki', 'nemui', 'kyoumo', 'ojisan', 'jk', 'dk', 'mama', 'otosan'];
  const avatars = ['🐶', '🐱', '🐰', '🐻', '🐼', '🦊', '🐸', '🐧', '🐹', '🐨', '🦁', '🐯', '🐮', '🐷', '🐔', '🐙'];
  tl.randomHandle = () => handles[Math.floor(Math.random() * handles.length)] + '_' + Math.floor(Math.random() * 900 + 100);
  tl.avatar = (h) => { let x = 0; for (const c of h) x = (x * 31 + c.charCodeAt(0)) >>> 0; return avatars[x % avatars.length]; };

  // 環境のつぶやきを1件作る（ほのめかし中心）
  tl.generate = function (S) {
    const U = CK.U;
    const me = S.stores[0], rv = S.stores[1];
    if (!me._d || !rv._d) return null;
    const types = [['pref', 30], ['chatter', 28], ['state', 16], ['rival', 10], ['trend', 8]];
    if (me._d.acc.trendPeek && S.nextWeekTrend) types.push(['peek', 10]);
    const t = U.weighted(types, (x) => x[1])[0];
    if (t === 'pref') {
      const p = U.weighted(CK.PREFS.filter((x) => x !== 'normal'), (x) => S.prefs[x]);
      return { kind: 'voice', text: U.pick(tl.pref[p]) };
    }
    if (t === 'state') {
      const lostR = me.weekVisitors > 20 ? me.weekLost / me.weekVisitors : 0;
      if (lostR > 0.05 && CK.rand() < 0.6) return { kind: 'voice', text: U.fill(U.pick(tl.lost), { shop: me.name }) };
      const seg = U.pick(CK.SEGS);
      const a = me._d.gauges[seg], b = rv._d.gauges[seg];
      if (b > a + 8) return { kind: 'voice', text: U.fill(U.pick(tl.segStrong[seg]), { shop: rv.name }) };
      if (a > b + 8) return { kind: 'voice', text: U.fill(U.pick(tl.segStrong[seg]), { shop: me.name }) };
      return { kind: 'voice', text: U.pick(tl.chatter) };
    }
    if (t === 'rival') {
      const ps = CK.prodsOf(rv);
      if (!ps.length) return null;
      return { kind: 'voice', text: U.fill(U.pick(tl.rivalProduct), { shop: rv.name, item: U.pick(ps).p.name }) };
    }
    if (t === 'trend') {
      const tr = CK.rand() < 0.5 ? S.weekTrend : S.monthTrend;
      return tr ? { kind: 'trend', text: `${tr.name} がトレンド入り` } : null;
    }
    if (t === 'peek') return { kind: 'hint', handle: 'trend_uranai', text: U.fill(U.pick(tl.peek), { name: S.nextWeekTrend.name }) };
    return { kind: 'voice', text: U.pick(tl.chatter) };
  };
})();

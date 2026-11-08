(function () {
  const D = (CK.DATA = CK.DATA || {});

  // best = ◎（その客層が来やすく選ばれやすい）、good = ○
  D.products = [
    { id: 'ramen', name: '濃厚激辛カップ麺', icon: '🍜', price: 300, cost: 180, best: ['young'], good: [], tags: ['ガッツリ', '辛い', '夜型'], eff: { gauge: { young: 7 } }, desc: '若者ゲージ +7' },
    { id: 'cardpack', name: 'カードゲームパック', icon: '🃏', price: 200, cost: 120, best: ['young'], good: [], tags: ['趣味'], eff: { buy: { young: 0.10 } }, desc: '若者の購入率 +10%' },
    { id: 'energy', name: 'エナジードリンク', icon: '⚡', price: 250, cost: 130, best: ['young'], good: [], tags: ['夜型', '甘い', '冷たい'], eff: { visitSlot: { night: 0.07 } }, desc: '夜の来店 +7%' },
    { id: 'manga', name: '週刊マンガ雑誌', icon: '📖', price: 300, cost: 210, best: ['young'], good: [], tags: ['趣味'], eff: { basket: { young: 0.10 } }, desc: '若者の客単価 +10%' },
    { id: 'coffee', name: 'ホット缶コーヒー', icon: '☕', price: 150, cost: 70, best: ['mid'], good: [], tags: ['朝型', 'ホット'], eff: { visitSlot: { morning: 0.10 } }, desc: '朝の来店 +10%' },
    { id: 'makunouchi', name: '幕の内弁当', icon: '🍱', price: 600, cost: 400, best: ['mid'], good: [], tags: ['ガッツリ', '健康', '定番'], eff: { gauge: { mid: 7 } }, desc: '中年ゲージ +7' },
    { id: 'beer', name: 'ビールとピリ辛おつまみ', icon: '🍺', price: 500, cost: 320, best: ['mid'], good: [], tags: ['夜型', '辛い', '冷たい'], eff: { basket: { mid: 0.07 } }, desc: '中年の客単価 +7%' },
    { id: 'eiyou', name: '栄養ドリンク', icon: '🧪', price: 250, cost: 130, best: ['mid'], good: [], tags: ['健康'], eff: { buy: { mid: 0.10 } }, desc: '中年の購入率 +10%' },
    { id: 'daifuku', name: '大福', icon: '🍡', price: 180, cost: 90, best: ['old'], good: [], tags: ['甘い'], eff: { gauge: { old: 10 } }, desc: '老人ゲージ +10' },
    { id: 'newspaper', name: '新聞', icon: '📰', price: 150, cost: 110, best: ['old'], good: [], tags: ['朝型'], eff: { visitSlot: { morning: 0.10 } }, desc: '朝の来店 +10%' },
    { id: 'gentle', name: '減塩おそうざい', icon: '🥗', price: 350, cost: 210, best: ['old'], good: [], tags: ['健康'], eff: { buy: { old: 0.10 } }, desc: '老人の購入率 +10%' },
    { id: 'bills', name: '公共料金の支払い窓口', icon: '🧾', price: 0, cost: 0, best: ['old'], good: [], tags: ['サービス'], eff: { gauge: { old: 12 }, basket: { old: 0.10 } }, desc: '老人ゲージ +12、老人の客単価 +10%（売上はない）' },
    { id: 'onigiri', name: 'おにぎり', icon: '🍙', price: 150, cost: 90, best: [], good: ['young', 'mid', 'old'], tags: ['定番'], eff: { gauge: { all: 3 } }, desc: '全ゲージ +3（万能）' },
    { id: 'tea', name: 'ペットボトルのお茶', icon: '🍵', price: 150, cost: 80, best: [], good: ['young', 'mid', 'old'], tags: ['定番', '健康'], eff: { gauge: { all: 3 } }, desc: '全ゲージ +3（万能）' },
    { id: 'karaage', name: 'からあげ', icon: '🍗', price: 250, cost: 140, best: [], good: ['young', 'mid', 'old'], tags: ['定番', 'ガッツリ', 'ホット'], eff: { gauge: { all: 2 } }, desc: '全ゲージ +2（万能）' },
    // ---- 追加分（新しいタグ・トレンドに対応） ----
    { id: 'icecream', name: 'ソフトクリームバー', icon: '🍦', price: 180, cost: 90, best: ['young'], good: ['old'], tags: ['冷たい', '甘い', '映え'], eff: { visitSlot: { noon: 0.06 }, gauge: { young: 3 } }, desc: '昼の来店 +6%、若者ゲージ +3' },
    { id: 'sportsdrink', name: 'スポーツドリンク', icon: '🧃', price: 160, cost: 70, best: [], good: ['young', 'mid'], tags: ['冷たい', '健康'], eff: { gauge: { young: 4, mid: 4 } }, desc: '若者・中年ゲージ +4' },
    { id: 'soup', name: 'カップスープ', icon: '🥣', price: 200, cost: 100, best: ['old'], good: ['mid'], tags: ['ホット', '健康', '朝型'], eff: { gauge: { old: 4, mid: 3 } }, desc: '老人ゲージ +4、中年ゲージ +3' },
    { id: 'fruitsando', name: 'フルーツサンド', icon: '🥪', price: 380, cost: 230, best: ['young'], good: ['mid'], tags: ['甘い', '映え'], eff: { gauge: { young: 8 } }, desc: '若者ゲージ +8' },
    { id: 'tapioca', name: 'タピオカミルクティー', icon: '🧋', price: 450, cost: 220, best: ['young'], good: [], tags: ['甘い', '映え', '冷たい'], eff: { buy: { young: 0.06 } }, desc: '若者の購入率 +6%' },
    { id: 'matcha', name: '抹茶ラテ', icon: '🥤', price: 280, cost: 140, best: ['young'], good: ['mid'], tags: ['和風', '映え', '甘い'], eff: { buy: { young: 0.04, mid: 0.03 } }, desc: '若者の購入率 +4%、中年 +3%' },
    { id: 'acrylic', name: '推しのアクスタくじ', icon: '🧸', price: 800, cost: 520, best: ['young'], good: [], tags: ['趣味', '映え'], eff: { gauge: { young: 6 } }, desc: '若者ゲージ +6（単価が高い）' },
    { id: 'gamecard', name: 'ゲーム課金カード', icon: '🎮', price: 1000, cost: 900, best: ['young'], good: ['mid'], tags: ['趣味', '夜型'], eff: { visitSlot: { night: 0.08 } }, desc: '夜の来店 +8%（利益は薄い）' },
    { id: 'spicysnack', name: '激辛ポテチ', icon: '🌶️', price: 180, cost: 90, best: ['young'], good: [], tags: ['辛い', '趣味'], eff: { basket: { young: 0.08 } }, desc: '若者の客単価 +8%' },
    { id: 'kimchi', name: 'キムチ', icon: '🥬', price: 300, cost: 170, best: ['mid'], good: ['old'], tags: ['辛い', '健康'], eff: { gauge: { mid: 6, old: 4 } }, desc: '中年ゲージ +6、老人ゲージ +4' },
    { id: 'katsucurry', name: 'カツカレー', icon: '🍛', price: 550, cost: 330, best: ['young', 'mid'], good: [], tags: ['ガッツリ', '辛い', 'ホット'], eff: { gauge: { young: 4, mid: 4 } }, desc: '若者・中年ゲージ +4' },
    { id: 'yakisobapan', name: '焼きそばパン', icon: '🥖', price: 200, cost: 100, best: ['young'], good: [], tags: ['ガッツリ', '朝型'], eff: { visitSlot: { morning: 0.08 } }, desc: '朝の来店 +8%' },
    { id: 'morningset', name: 'モーニングセット', icon: '🍳', price: 350, cost: 200, best: ['mid'], good: ['young'], tags: ['朝型', '定番', 'ホット'], eff: { visitSlot: { morning: 0.06 }, gauge: { mid: 2 } }, desc: '朝の来店 +6%、中年ゲージ +2' },
    { id: 'proteinbar', name: 'プロテインバー', icon: '🍫', price: 250, cost: 120, best: ['mid'], good: ['young'], tags: ['健康', '朝型'], eff: { buy: { mid: 0.08 } }, desc: '中年の購入率 +8%' },
    { id: 'saladchicken', name: 'サラダチキン', icon: '🥩', price: 300, cost: 170, best: ['mid'], good: ['young'], tags: ['健康', '定番'], eff: { gauge: { mid: 6, young: 3 } }, desc: '中年ゲージ +6、若者ゲージ +3' },
    { id: 'cheese', name: 'おつまみチーズ', icon: '🧀', price: 300, cost: 170, best: ['mid'], good: [], tags: ['夜型', '定番'], eff: { visitSlot: { night: 0.06 }, basket: { mid: 0.04 } }, desc: '夜の来店 +6%、中年の客単価 +4%' },
    { id: 'inari', name: 'いなり寿司', icon: '🍣', price: 300, cost: 160, best: ['old'], good: ['mid'], tags: ['和風', '定番', '甘い'], eff: { gauge: { old: 4, mid: 2 } }, desc: '老人ゲージ +4、中年ゲージ +2' },
    { id: 'senbei', name: '手焼きせんべい', icon: '🍘', price: 200, cost: 100, best: ['old'], good: [], tags: ['和風'], eff: { basket: { old: 0.08 } }, desc: '老人の客単価 +8%' },
  ];

  // 限定品：相性2つ＋タグ2つ
  D.limited = [
    { id: 'sakuramochi', season: 'spring', name: '桜もち', icon: '🌸', price: 200, cost: 110, best: ['old'], good: ['mid'], tags: ['甘い', '和風'], eff: { gauge: { old: 12, mid: 5 } }, desc: '老人ゲージ +12、中年ゲージ +5' },
    { id: 'strawberry', season: 'spring', name: 'いちごスイーツ', icon: '🍓', price: 350, cost: 200, best: ['young'], good: ['mid'], tags: ['甘い', '映え'], eff: { gauge: { young: 12, mid: 5 } }, desc: '若者ゲージ +12、中年ゲージ +5' },
    { id: 'shinseikatsu', season: 'spring', name: '新生活応援弁当', icon: '🍱', price: 500, cost: 320, best: ['young', 'mid'], good: [], tags: ['ガッツリ', '定番'], eff: { gauge: { young: 8, mid: 8 } }, desc: '若者・中年ゲージ +8' },
    { id: 'hanamidango', season: 'spring', name: '花見だんご', icon: '🍡', price: 220, cost: 110, best: ['old'], good: ['young'], tags: ['和風', '映え'], eff: { visitSlot: { noon: 0.12 } }, desc: '昼の来店 +12%' },
    { id: 'kakigori', season: 'summer', name: 'かき氷', icon: '🍧', price: 250, cost: 120, best: ['young'], good: ['old'], tags: ['甘い', '冷たい'], eff: { visitSlot: { noon: 0.15 } }, desc: '昼の来店 +15%' },
    { id: 'hiyashitantan', season: 'summer', name: '冷やし担々麺', icon: '🥢', price: 550, cost: 330, best: ['mid'], good: ['young'], tags: ['辛い', '冷たい'], eff: { gauge: { mid: 12, young: 5 } }, desc: '中年ゲージ +12、若者ゲージ +5' },
    { id: 'hanabi', season: 'summer', name: '花火セット', icon: '🎆', price: 800, cost: 500, best: ['young'], good: ['mid'], tags: ['趣味', '夜型'], eff: { visitSlot: { night: 0.15 } }, desc: '夜の来店 +15%' },
    { id: 'premiumice', season: 'summer', name: 'プレミアムアイス', icon: '🍨', price: 300, cost: 160, best: ['young', 'mid'], good: [], tags: ['甘い', '冷たい'], eff: { buy: { all: 0.08 } }, desc: '全客層の購入率 +8%' },
    { id: 'yakiimo', season: 'autumn', name: '焼きいも', icon: '🍠', price: 250, cost: 120, best: ['old'], good: ['young'], tags: ['甘い', 'ホット'], eff: { gauge: { old: 12, young: 5 } }, desc: '老人ゲージ +12、若者ゲージ +5' },
    { id: 'kurimanju', season: 'autumn', name: '栗まんじゅう', icon: '🌰', price: 200, cost: 100, best: ['old'], good: ['mid'], tags: ['甘い', '和風'], eff: { basket: { all: 0.10 } }, desc: '全客層の客単価 +10%' },
    { id: 'tsukimi', season: 'autumn', name: '月見バーガー', icon: '🍔', price: 400, cost: 240, best: ['young'], good: ['mid'], tags: ['ガッツリ', '映え'], eff: { gauge: { young: 12 } }, desc: '若者ゲージ +12' },
    { id: 'matsutake', season: 'autumn', name: '松茸ごはん', icon: '🍄', price: 650, cost: 420, best: ['mid'], good: ['old'], tags: ['和風', 'ガッツリ'], eff: { gauge: { mid: 10, old: 6 } }, desc: '中年ゲージ +10、老人ゲージ +6' },
    { id: 'oden', season: 'winter', name: 'おでん', icon: '🍢', price: 300, cost: 150, best: ['mid', 'old'], good: [], tags: ['ホット', '健康'], eff: { gauge: { all: 6 } }, desc: '全ゲージ +6' },
    { id: 'nikuman', season: 'winter', name: '激辛肉まん', icon: '🥟', price: 200, cost: 100, best: ['young'], good: ['mid'], tags: ['辛い', 'ホット'], eff: { visitSlot: { night: 0.10 } }, desc: '夜の来店 +10%' },
    { id: 'cocoa', season: 'winter', name: 'ホットココア', icon: '☕', price: 180, cost: 80, best: ['young'], good: ['old'], tags: ['甘い', 'ホット'], eff: { gauge: { young: 10, old: 4 } }, desc: '若者ゲージ +10、老人ゲージ +4' },
    { id: 'xmascake', season: 'winter', months: [12], name: 'クリスマスケーキ', icon: '🎂', price: 1200, cost: 700, best: [], good: ['young', 'mid', 'old'], tags: ['甘い', '映え'], eff: {}, special: 'xmas', desc: '12月の第4週だけ客単価 +40%' },
    { id: 'ehomaki', season: 'winter', months: [2], name: '恵方巻', icon: '🍣', price: 800, cost: 500, best: [], good: ['young', 'mid', 'old'], tags: ['ガッツリ', '和風'], eff: {}, special: 'ehomaki', desc: '2月の第1週だけ来店 +30%' },
  ];

  // 季節によるタグの売れ行き補正
  D.seasonTag = {
    spring: {},
    summer: { 'ホット': 0.7, '冷たい': 1.3 },
    autumn: { 'ホット': 1.1 },
    winter: { 'ホット': 1.3, '冷たい': 0.7 },
  };

  const segCount = (c, seg) => c.ps.filter((p) => p.best.includes(seg)).length;
  const tagN = (c, t) => c.tagCount[t] || 0;
  // タグのシナジー：2つでLv1、3つでLv2（効果がもう1回分のる）
  const tagSyn = (id, name, icon, tag, effText, eff) => [
    { id, name, icon, desc: `#${tag} が2つ → ${effText}`, check: (c) => tagN(c, tag) >= 2, eff },
    { id: id + '2', name: name + '＋', icon, desc: `#${tag} が3つ → さらに ${effText}`, check: (c) => tagN(c, tag) >= 3, eff },
  ];
  D.synergies = [
    { id: 'young3', name: '若者のたまり場', icon: '🛹', desc: '若者◎の商品3つ → 若者ゲージ +12、若者の来店 +12%', check: (c) => segCount(c, 'young') >= 3, eff: { gauge: { young: 12 }, visit: { young: 0.12 } } },
    { id: 'young5', name: '若者の聖地', icon: '🛹', desc: '若者◎の商品5つ → さらに若者の来店 +20%', check: (c) => segCount(c, 'young') >= 5, eff: { visit: { young: 0.2 } } },
    { id: 'mid3', name: 'サラリーマンの味方', icon: '💼', desc: '中年◎の商品3つ → 中年ゲージ +12、中年の客単価 +12%', check: (c) => segCount(c, 'mid') >= 3, eff: { gauge: { mid: 12 }, basket: { mid: 0.12 } } },
    { id: 'mid5', name: '企業戦士の基地', icon: '💼', desc: '中年◎の商品5つ → さらに中年の来店 +20%', check: (c) => segCount(c, 'mid') >= 5, eff: { visit: { mid: 0.2 } } },
    { id: 'old3', name: '地域の憩いの場', icon: '🏡', desc: '老人◎の商品3つ → 老人ゲージ +12、評判 +0.2', check: (c) => segCount(c, 'old') >= 3, eff: { gauge: { old: 12 }, repStatic: 0.2 } },
    { id: 'old5', name: '町のよりどころ', icon: '🏡', desc: '老人◎の商品5つ → さらに老人の来店 +20%', check: (c) => segCount(c, 'old') >= 5, eff: { visit: { old: 0.2 } } },
    ...tagSyn('morning', '朝活コンビニ', '🌅', '朝型', '朝の来店 +20%', { visitSlot: { morning: 0.2 } }),
    ...tagSyn('night', '眠らない店', '🌙', '夜型', '夜の来店 +20%', { visitSlot: { night: 0.2 } }),
    ...tagSyn('hearty', 'ガッツリ系', '🍖', 'ガッツリ', '客単価 +8%、がっつり派の来店 +20%', { basket: { all: 0.08 }, visitPref: { hearty: 0.2 } }),
    ...tagSyn('sweet', '甘いもの天国', '🍰', '甘い', '甘党の来店 +25%', { visitPref: { sweet: 0.25 } }),
    ...tagSyn('spicy', '激辛の聖地', '🌶️', '辛い', '辛党の来店 +25%', { visitPref: { spicy: 0.25 } }),
    ...tagSyn('otaku', 'オタクの聖地', '🎮', '趣味', 'オタクの来店 +25%、若者の購入率 +6%', { visitPref: { otaku: 0.25 }, buy: { young: 0.06 } }),
    ...tagSyn('healthy', '健康志向', '🥦', '健康', '健康志向の来店 +25%、中年・老人ゲージ +4', { visitPref: { healthy: 0.25 }, gauge: { mid: 4, old: 4 } }),
    ...tagSyn('wafu', '和の心', '🎐', '和風', '老人ゲージ +8、評判 +0.1', { gauge: { old: 8 }, repStatic: 0.1 }),
    ...tagSyn('bae', '映えスポット', '📸', '映え', '若者ゲージ +8、SNS宣伝のゲージ効果 +3', { gauge: { young: 8 }, snsGauge: 3 }),
    ...tagSyn('cold', 'ひんやり天国', '🧊', '冷たい', '昼の来店 +15%', { visitSlot: { noon: 0.15 } }),
    ...tagSyn('hot', 'ほかほかステーション', '♨️', 'ホット', '朝・夜の来店 +10%', { visitSlot: { morning: 0.1, night: 0.1 } }),
    { id: 'safe', name: '安心の品揃え', icon: '🛡️', desc: '#定番 が3つ → スキャンダルのダメージ −20%、全ゲージ +3', check: (c) => tagN(c, '定番') >= 3, eff: { scandalDmg: -0.2, gauge: { all: 3 } } },
    { id: 'shun', name: '旬の組み合わせ', icon: '✨', desc: '限定品と同じタグの定番がある → 限定品の効果 ×1.5', check: (c) => c.shun, eff: {} },
  ];
})();

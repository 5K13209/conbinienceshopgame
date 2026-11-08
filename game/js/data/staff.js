(function () {
  const D = (CK.DATA = CK.DATA || {});

  // cat: clerk（店員）/ sns / shady（裏方）/ guard（守り）
  D.jobs = [
    { id: 'basic', name: '普通のバイト', icon: '🙂', cat: 'clerk', wage: 10000, weight: 3, desc: '回転率 +6', eff: { rot: 6 } },
    { id: 'student', name: '学生バイト', icon: '🎒', cat: 'clerk', wage: 8000, weight: 2, desc: '回転率 +4、若者ゲージ +3', eff: { rot: 4, gauge: { young: 3 } } },
    { id: 'night', name: '深夜バイト', icon: '🌙', cat: 'clerk', wage: 12000, weight: 1.5, desc: '回転率 +2、夜の回転率 +10', eff: { rot: 2, rotNight: 10 } },
    { id: 'part', name: 'ベテランパート', icon: '🧺', cat: 'clerk', wage: 15000, weight: 2, desc: '回転率 +6、中年・老人ゲージ +4', eff: { rot: 6, gauge: { mid: 4, old: 4 } } },
    { id: 'star', name: '看板スタッフ', icon: '🌟', cat: 'clerk', wage: 15000, weight: 1, desc: '回転率 +4、若者ゲージ +8', eff: { rot: 4, gauge: { young: 8 } } },
    { id: 'exmanager', name: '元店長', icon: '🧓', cat: 'clerk', wage: 25000, weight: 0.6, desc: '回転率 +10、評判 +0.1、購入率 +5%', eff: { rot: 10, repStatic: 0.1, buy: { all: 0.05 } } },
    { id: 'consultant', name: 'SNS運用コンサル', icon: '📈', cat: 'sns', wage: 25000, weight: 1, desc: 'SNS宣伝のゲージ効果 +5', eff: { snsGauge: 5 } },
    { id: 'creator', name: '動画クリエイター', icon: '🎥', cat: 'sns', wage: 22000, weight: 0.8, desc: 'SNS宣伝のゲージ効果 +2、来店ブーストが1日長い', eff: { snsGauge: 2, snsBoostDays: 1 } },
    { id: 'hacker', name: 'ハッカー', icon: '💻', cat: 'shady', wage: 25000, weight: 0.7, desc: '「なりすまし投稿」が使える、SNS系妨害の成功率 +10%', eff: { sabSuccessSns: 10 } },
    { id: 'yankee', name: 'ヤンキー', icon: '😎', cat: 'shady', wage: 12000, weight: 0.8, desc: '「ヤンキーをたむろさせる」が半額・+1日。自店の老人ゲージ −5', eff: { gauge: { old: -5 } } },
    { id: 'detective', name: '探偵', icon: '🕵️', cat: 'shady', wage: 20000, weight: 0.6, desc: 'ライバルが妨害を仕掛けた週、その系統をタイムラインでほのめかしてくれる', eff: {} },
    { id: 'guard', name: '警備員', icon: '👮', cat: 'guard', wage: 20000, weight: 0.9, desc: '物理系の妨害を30%で自動で防ぐ', eff: { guardBlock: 0.3 } },
    { id: 'pr', name: '広報担当', icon: '🎙️', cat: 'guard', wage: 22000, weight: 0.8, desc: 'スキャンダルのダメージ −30%', eff: { scandalDmg: -0.3 } },
  ];

  D.skills = [
    { id: 'hospitality', name: '接客上手', cats: ['clerk'], desc: '購入率 +3%', eff: { buy: { all: 0.03 } } },
    { id: 'stocking', name: '品出し上手', cats: ['clerk'], desc: '客が商品を取りやすい：回転率 +2、客単価 +3%', eff: { rot: 2, basket: { all: 0.03 } } },
    { id: 'quick', name: '早業', cats: ['clerk'], desc: '回転率 +3', eff: { rot: 3 } },
    { id: 'smile', name: '笑顔がいい', cats: ['clerk'], desc: '評判の下がり幅 −10%', eff: { repDrop: -0.1 } },
    { id: 'granny', name: 'おばあちゃんっ子', cats: ['clerk'], desc: '老人ゲージ +4', eff: { gauge: { old: 4 } } },
    { id: 'trendy', name: '話題が合う', cats: ['clerk'], desc: '若者ゲージ +4', eff: { gauge: { young: 4 } } },
    { id: 'sweettooth', name: '甘いもの好き', cats: ['clerk'], desc: '甘いタグの商品の効果 +10%', eff: { tagMult: { '甘い': 0.1 } } },
    { id: 'stamina', name: '体力自慢', cats: ['clerk'], desc: '急な欠勤をしない', eff: {} },
    { id: 'promo', name: '宣伝上手', cats: ['sns'], desc: 'SNS宣伝のゲージ効果 +3', eff: { snsGauge: 3 } },
    { id: 'hedge', name: 'リスクヘッジ上手', cats: ['sns'], desc: '「とんでもない」投稿でもマイナスにならず、最低 +1', eff: { snsBadFloor: true } },
    { id: 'hunter', name: 'トレンドハンター', cats: ['sns'], desc: '来週のトレンドがタイムラインに流れる', eff: { trendPeek: true } },
    { id: 'flameproof', name: '炎上慣れ', cats: ['sns'], desc: 'スキャンダルのダメージ −15%', eff: { scandalDmg: -0.15 } },
    { id: 'deft', name: '手際がいい', cats: ['shady'], desc: '妨害の成功率 +5%', eff: { sabSuccess: 5 } },
    { id: 'tightlip', name: '口が堅い', cats: ['shady'], desc: '妨害のスキャンダル率 −2%', eff: { sabScandal: -2 } },
    { id: 'network', name: '顔が広い', cats: ['shady'], desc: '妨害の候補が1つ増える', eff: { sabChoices: 1 } },
    { id: 'sharp', name: '目ざとい', cats: ['guard'], desc: '万引き犯を必ず捕まえられる', eff: { sharpEye: true } },
    { id: 'scaryface', name: '強面', cats: ['guard'], desc: 'ヤンキー・迷惑系配信者の効果 −30%', eff: { scaryFace: true } },
    { id: 'late', name: '遅刻魔', neg: true, cats: ['clerk', 'sns', 'shady', 'guard'], desc: '急な欠勤をしやすい', eff: {} },
    { id: 'clumsy', name: 'うっかり', neg: true, cats: ['clerk', 'sns', 'shady', 'guard'], desc: 'たまに小さなミスで評判 −0.05', eff: {} },
    { id: 'loose', name: '口が軽い', neg: true, cats: ['shady'], desc: '妨害のスキャンダル率 +3%', eff: { sabScandal: 3 } },
    { id: 'slacker', name: 'サボりぐせ', neg: true, cats: ['clerk'], desc: '本業の効果が半分になる日がある', eff: {} },
  ];

  D.surnames = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田', '松本', '井上', '木村', '林', '清水', '山口', '森', '池田', '橋本', '石川', '前田', '藤田', '岡田', '後藤', '長谷川', '村上', '近藤', '坂本'];
  D.namesF = ['ひなた', 'さくら', 'みお', 'ゆい', 'あおい', 'りん', 'めい', 'かえで', 'ことね', 'ほのか', 'まゆ', 'しずか'];
  D.namesM = ['はると', 'そうた', 'ゆうと', 'れん', 'たくみ', 'こうき', 'だいち', 'りく', 'けんた', 'しょう', 'まさと', 'つよし'];
  D.rivalNames = ['デイリーハッピー', 'ミナトマート', 'サンライズ24', 'まいにちストア', 'ヨルマート', 'コンビニエンス鈴木'];

  D._uid = 0;
  D.genStaff = function (jobId) {
    const U = CK.U;
    const job = jobId ? CK.byId.job[jobId] : U.weighted(D.jobs, (j) => j.weight);
    const ok = (s) => s.cats.includes(job.cat);
    const pos = D.skills.filter((s) => !s.neg && ok(s));
    const negs = D.skills.filter((s) => s.neg && ok(s));
    const skills = U.sample(pos, CK.rand() < 0.45 ? 2 : 1).map((s) => s.id);
    let wage = job.wage + skills.length * 1000;
    if (job.wage <= 15000 && negs.length && CK.rand() < 0.35) { skills.push(U.pick(negs).id); wage -= 3000; }
    const female = CK.rand() < 0.5;
    return {
      uid: ++D._uid,
      name: U.pick(D.surnames) + ' ' + U.pick(female ? D.namesF : D.namesM),
      job: job.id,
      skills,
      wage: Math.max(5000, wage),
      look: { hair: U.pick(['#3b2a20', '#1d1d1d', '#6b4423', '#c98f45', '#8a5a3b']), style: female ? U.pick(['long', 'bob']) : 'short' },
      slackToday: false,
    };
  };

  // ライバルAIの性格
  D.personalities = {
    normal: { name: '普通型', desc: '特徴なし。全部をほどほどにやる', sabWeekChance: 0.4, sabStyle: 'success', trapChance: 0.4, snsDaily: 2, goodPick: 0.7, cardCat: {}, staffPref: { basic: 2, part: 2, student: 1.5 }, itemBuys: 1 },
    defensive: { name: '守備型', desc: '罠と防御を優先。妨害はたまにしかしない', sabWeekChance: 0.25, sabStyle: 'success', trapChance: 0.6, snsDaily: 2, goodPick: 0.65, cardCat: { defense: 4 }, staffPref: { guard: 3, pr: 3, part: 2, basic: 2 }, itemBuys: 1 },
    sneaky: { name: '陰湿型', desc: '妨害の上限を毎月使い切る。スキャンダルも多い', sabWeekChance: 0.7, sabAll: true, sabStyle: 'effect', trapChance: 0.3, snsDaily: 2, goodPick: 0.6, cardCat: { sabotage: 4 }, staffPref: { hacker: 4, yankee: 4, basic: 1.5 }, itemBuys: 0 },
    sns: { name: 'SNS型（現代適応型）', desc: 'SNS系バイトを最優先。良い投稿を選ぶのが上手い', sabWeekChance: 0.4, sabStyle: 'sns', trapChance: 0.35, snsDaily: 3, goodPick: 0.9, cardCat: { sns: 4 }, staffPref: { consultant: 5, creator: 4, star: 2 }, itemBuys: 1 },
  };
})();

// 調整用の数値はすべてここに集める（仕様書の「（仮）」の値）
window.CK = window.CK || {};
CK.CFG = {
  startMoney: 500000,
  weekRealSeconds: 30,          // ×1で1週間が何秒か（×2〜×4の倍速あり）
  weeksPerMonth: 5,
  customersPerDay: 240,         // エリア全体に1日に発生する客
  slotSpawnMul: { morning: 1.1, noon: 1.0, night: 0.9 },
  weekendBonus: 0.1,            // 土日の若者・老人の比率アップ
  noneWeight: 8,                // 「どちらの店にも行かない」重み
  gaugeBase: 20,
  baseRep: 3.0,
  baseBuy: 0.6,
  baseExtraItem: 0.3,
  prefMatchBuy: 0.15,
  prefTagVisit: 0.15,
  rotBase: 6,                   // 店長ひとりぶんの回転率
  rotTokensPerDayPerR: 10,      // 回転率1あたり、1日にさばける客
  rotBucketMax: 0.6,
  rent: 20000,
  snsCooldownDays: 6,
  sns: {
    good:   { gauge: 12, days: 14, visitMul: 1.2, visitDays: 2, rep: 0.05 },
    normal: { gauge: 5,  days: 7 },
    bad:    { gauge: -5, days: 7, rep: -0.1 },
  },
  sabotagePerMonth: 2,
  trapCost: 10000,
  trapScandalBonus: 30,
  payDefenseCost: 50000,
  scandal: { rep: -1.2, gauge: -25, gaugeDays: 21, visitMul: 0.55, visitDays: 10, apologyCost: 200000 },
  suspicionScandal: { mid: 2, high: 5 },
  cardRarity: { legend: 0.02, peaky: 0.08, rare: 0.22 },   // 残りがノーマル
  cardSlots: 5,                 // 強化カードを持てる枚数
  cardEveryWeeks: 1,            // 何週ごとに強化カードを引けるか
  stdSlots: 5,                  // 定番商品を置ける数
  staffCandidates: 4,
  staffSlots: 3,
  shopItemCount: 4,
  limitedChoices: 3,
  trendMonthMul: 1.2,
  trendWeekMul: 1.1,
  eventsPerWeek: [1, 2],
  aiReserve: 100000,
  timelineIntervalDays: 0.33,
  maxSprites: 22,
};

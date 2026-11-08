(function () {
  const D = (CK.DATA = CK.DATA || {});
  // main：強く効く（妨害なら無効化）、sub：少し効く（妨害なら −30%）
  // main / sub には妨害のidと突発イベントのidが入る
  D.items = [
    { id: 'gmen', name: '万引きGメン', icon: '🕶️', price: 25000, uses: 3, main: ['shoplifter'], sub: ['yankee', 'streamer'], desc: '万引き犯を必ず捕まえる／ヤンキー・迷惑系配信者 −30%' },
    { id: 'camera', name: '監視カメラ', icon: '📹', price: 30000, uses: 2, main: ['dirty', 'yankee', 'streamer', 'parking'], sub: ['shoplifter'], trapBonus: 40, desc: '物理系の妨害を無効化（罠にすると相手のスキャンダル率 +40%）／万引き犯を70%で捕まえる' },
    { id: 'cleaning', name: '清掃道具セット', icon: '🧹', price: 10000, uses: 3, main: ['dirty', 'parking'], sub: ['snow'], desc: '店の前を汚す・違法駐車を無効化／大雪の被害を半減' },
    { id: 'scary', name: '強面の店長代理', icon: '💪', price: 25000, uses: 2, main: ['yankee', 'streamer', 'drunk'], sub: ['claim'], desc: 'ヤンキー・迷惑系配信者・酔っ払い客を無効化／クレーム客を評判ダウンなしで追い返す' },
    { id: 'manual', name: 'クレーム対応マニュアル', icon: '📘', price: 15000, uses: 3, main: ['claim'], sub: ['review'], desc: 'クレーム客をノーダメージで対応／酷評レビュー −30%' },
    { id: 'rebuttal', name: '公式アカウントの反論テンプレ', icon: '📝', price: 20000, uses: 2, main: ['review', 'rumor'], sub: [], desc: '酷評レビュー・変なうわさを無効化／持っているだけでスキャンダル時の「言い訳」成功率 +20%' },
    { id: 'lawyer', name: '顧問弁護士の名刺', icon: '⚖️', price: 40000, uses: 2, main: ['impersonate'], sub: ['audit'], counterScandal: 30, trapBonus: 30, desc: 'なりすまし投稿を無効化し、相手のスキャンダル率 +30%／監査の罰金半額' },
    { id: 'callcheck', name: '着信確認システム', icon: '📟', price: 15000, uses: 3, main: ['prank'], sub: ['bulk'], desc: 'いたずら電話を無効化／部活の大量注文を他の客を待たせずに受けられる' },
    { id: 'spareReg', name: '予備のレジ', icon: '🖨️', price: 20000, uses: 2, main: ['register'], sub: ['prank'], desc: 'レジの故障をノーダメージ／いたずら電話 −30%' },
    { id: 'dispatch', name: '臨時バイト派遣券', icon: '🎫', price: 15000, uses: 2, main: ['absence', 'fireworks', 'sports'], sub: ['influencer'], desc: '欠勤・花火大会・運動会の増員がタダ／インフルエンサーを回転率ロスなしで神対応' },
    { id: 'hotline', name: '本部とのホットライン', icon: '📞', price: 30000, uses: 1, main: ['supplier'], sub: ['campaign'], desc: '仕入れ業者への妨害を無効化／本部キャンペーンの参加費半額' },
    { id: 'shovel', name: '雪かきスコップ・傘立て', icon: '⛄', price: 8000, uses: 3, main: ['snow', 'shower'], sub: ['dirty'], desc: '大雪・夕立をチャンスに変える（来店アップ）／店の前を汚す −30%' },
  ];
})();

(function () {
  'use strict';
  const CK = window.CK, U = CK.U, CFG = CK.CFG;
  const UI = (CK.UI = {});
  const $ = (id) => document.getElementById(id);

  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) for (const k in props) {
      const v = props[k];
      if (v === false || v == null) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat(3)) {
      if (c == null || c === false) continue;
      el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    }
    return el;
  }
  UI.h = h;
  const setHTML = (el, html) => { if (el._h !== html) { el._h = html; el.innerHTML = html; } };

  // ---------------- 選択モーダル（イベント・妨害・SNS共通） ----------------
  const queue = [];
  let active = null;
  UI.modalActive = () => !!active;
  UI.choice = function (o) { queue.push(o); if (!active) next(); };
  function next() {
    const m = $('modal');
    if (!queue.length) { active = null; m.classList.add('hidden'); m.innerHTML = ''; return; }
    active = queue.shift();
    m.innerHTML = '';
    const box = h('div', { class: 'mbox ' + (active.cls || '') },
      h('div', { class: 'micon' }, active.icon || '❗'),
      h('div', { class: 'mtitle' }, active.title || ''),
      h('div', { class: 'mtext', html: active.text || '' }),
      h('div', { class: 'mopts' }, active.options.map((op) =>
        h('button', {
          class: 'mopt ' + (op.cls || ''), disabled: op.disabled,
          onclick: () => {
            active = null;
            m.classList.add('hidden');
            if (op.onPick) op.onPick();
            if (!active) next();
          },
        }, h('div', { class: 'olabel' }, op.label), op.desc ? h('div', { class: 'odesc' }, op.desc) : null))));
    m.appendChild(box);
    m.classList.remove('hidden');
  }

  // ---------------- トースト ----------------
  UI.toast = function (msg, kind) {
    if (!msg) return;
    const box = $('toasts');
    const el = h('div', { class: 'toast ' + (kind || 'info') }, msg);
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 3800);
    setTimeout(() => el.remove(), 4300);
    while (box.children.length > 5) box.firstChild.remove();
  };

  // ---------------- タイムライン ----------------
  UI.clearTimeline = () => { $('timeline').innerHTML = ''; };
  UI.addPost = function (p) {
    const tl = $('timeline');
    let av, name;
    if (p.kind === 'shop') { av = p.shopId === 0 ? '🏪' : '🏬'; name = p.handle + (p.shopId === 0 ? '（あなた）' : '（ライバル）'); }
    else if (p.kind === 'trend') { av = '📈'; name = 'トレンド'; }
    else if (p.kind === 'flame') { av = '🔥'; name = '@' + p.handle; }
    else if (p.kind === 'hint') { av = p.handle === 'tantei_office' ? '🕵️' : '🔮'; name = '@' + p.handle; }
    else { av = CK.DATA.tl.avatar(p.handle); name = '@' + p.handle; }
    const el = h('div', { class: 'post ' + p.kind + (p.shopId === 0 ? ' mine' : '') },
      h('div', { class: 'pav' }, av),
      h('div', { class: 'pbody' }, h('div', { class: 'pname' }, name), h('div', { class: 'ptext' }, p.text)));
    tl.prepend(el);
    while (tl.children.length > 50) tl.lastChild.remove();
  };

  // ---------------- 常時表示のHUD ----------------
  UI.init = function () {
    $('topbar').innerHTML = `
      <div class="tb-date" id="tbDate"></div>
      <div class="tb-month" id="tbMonth"></div>
      <div class="tb-money" id="tbMoney"></div>
      <div class="tb-speed">
        <button class="spd" data-speed="0" title="一時停止（スペース）">⏸</button>
        <button class="spd" data-speed="1" title="ふつう（1）">▶ ×1（ふつう）</button>
        <button class="spd" data-speed="2" title="2倍速（2）">×2</button>
        <button class="spd" data-speed="3" title="3倍速（3）">×3</button>
        <button class="spd" data-speed="4" title="4倍速（4）">×4</button>
      </div>
      <div class="tb-trend" id="tbTrend"></div>`;
    $('topbar').addEventListener('click', (e) => { const b = e.target.closest('[data-speed]'); if (b) UI.setSpeed(+b.dataset.speed); });
    $('snsbox').innerHTML = '<button class="sns-btn" id="snsBtn">📱 SNSに投稿する</button><div class="sns-cd" id="snsCd"></div>';
    $('snsBtn').addEventListener('click', UI.openSNS);
    $('panel').innerHTML = '<div id="pnA"></div><div id="pnB"></div><div id="pnC"></div><div id="pnD"></div>';
    $('tabOwn').addEventListener('click', () => UI.setView(0));
    $('tabRival').addEventListener('click', () => UI.setView(1));
    document.addEventListener('keydown', (e) => {
      const S = CK.S;
      if (!S || e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); UI.setSpeed(0); }
      if (['1', '2', '3', '4'].includes(e.key)) UI.setSpeed(+e.key);
    });
  };

  UI.setSpeed = function (v) {
    const S = CK.S;
    if (!S) return;
    if (v === 0) S.paused = !S.paused;
    else { S.speed = v; S.paused = false; }
  };
  UI.setView = function (v) {
    const S = CK.S;
    if (!S) return;
    S.viewIdx = v;
    CK.Render.reset();
    UI.setTabs();
    UI.refresh();
  };
  UI.setTabs = function () {
    const v = CK.S ? CK.S.viewIdx : 0;
    $('tabOwn').classList.toggle('active', v === 0);
    $('tabRival').classList.toggle('active', v === 1);
  };

  const gauge = (seg, v) => `<div class="g"><span class="gl">${CK.SEG_NAME[seg]}</span><div class="gb"><div class="gf" style="width:${v}%;background:${CK.SEG_COLOR[seg]}"></div></div><span class="gv">${Math.round(v)}</span></div>`;
  const stars = (r) => `<span class="stars">${'★'.repeat(Math.round(r))}<span class="off">${'★'.repeat(5 - Math.round(r))}</span></span> ${r.toFixed(1)}`;
  const chip = (text, title, cls) => `<span class="chip2 ${cls || ''}" title="${(title || '').replace(/"/g, '')}">${text}</span>`;
  const effName = { dirty: '🗑️ 店の前が汚い', yankee: '😎 ヤンキー', streamer: '📱 迷惑系配信者', car: '🚗 違法駐車', phone: '☎️ いたずら電話', buzz: '✨ バズり中', tv: '📺 テレビ効果', campaign: '📣 キャンペーン', flame: '🔥 炎上', fake: '🎭 なりすまし被害', rumor: '🗯️ 変なうわさ', review: '⭐ 酷評レビュー', supply: '📦 仕入れ妨害', steal: '🧲 客が流れてきた' };

  function effectChips(st) {
    const S = CK.S, seen = {};
    for (const e of st.effects) {
      if (!e.tag || e.until <= S.abs) continue;
      seen[e.tag] = Math.max(seen[e.tag] || 0, e.until - S.abs);
    }
    const keys = Object.keys(seen);
    if (!keys.length) return '<span class="muted">なし</span>';
    return keys.map((k) => chip(`${effName[k] || k} <small>あと${seen[k].toFixed(1)}日</small>`, '', /buzz|tv|campaign|steal/.test(k) ? 'good' : 'bad')).join('');
  }

  UI.refresh = function () {
    const S = CK.S;
    if (!S || !S.stores || !S.monthTrend) return;
    const me = S.stores[0], rv = S.stores[1];
    const slot = CK.slotOf(Math.min(S.weekT, 6.999));
    const day = CK.dayIdx();
    setHTML($('tbDate'), `${CK.SEASON_ICON[S.season]} ${S.calMonth}月 第${S.week + 1}週 <b>${CK.DAY_NAME[day]}曜</b> ${CK.SLOT_ICON[slot]}`);
    setHTML($('tbMonth'), `${S.monthIdx + 1} / ${S.monthsTotal}ヶ月目`);
    const money = $('tbMoney');
    money.textContent = '💰 ' + U.yen(me.money);
    money.classList.toggle('neg', me.money < 0);
    setHTML($('tbTrend'), `今月 <b>${S.monthTrend.name}</b>　今週 <b>${S.weekTrend ? S.weekTrend.name : '—'}</b>`);
    const spd = S.paused ? 0 : S.speed;
    document.querySelectorAll('.spd').forEach((b) => b.classList.toggle('on', +b.dataset.speed === spd));

    const cd = me.snsCooldown;
    const can = cd <= 0 && S.phase === 'run';
    $('snsBtn').disabled = !can;
    setHTML($('snsCd'), cd > 0 ? `次の投稿まで あと${Math.ceil(cd)}日` : S.phase === 'run' ? '<b class="ok">投稿できます！</b>' : '営業中に投稿できます');

    const d = me._d, rd = rv._d;
    if (!d || !rd) return;
    if (S.viewIdx === 0) {
      setHTML($('pnA'), `<div class="pn-title">🏪 ${me.name} <span class="muted small">（あなた）</span></div>
        <div class="bigsale"><small>今週の売上</small>${U.yen(me.weekSales)}</div>
        ${CK.SEGS.map((s) => gauge(s, d.gauges[s])).join('')}
        <div class="kv"><span>評判</span><b>${stars(d.rep)}</b></div>`);
      const trap = me.trap ? (me.trap.type === 'generic' ? `${CK.DATA.trapNames[me.trap.cat]}` : CK.byId.item[me.trap.item].name) : 'なし';
      setHTML($('pnB'), `
        <div class="kv"><span>今週の来店</span><b>${me.weekVisitors}人</b></div>
        <div class="kv"><span>さばけず</span><b class="${me.weekLost > me.weekVisitors * 0.05 ? 'warnc' : ''}">${me.weekLost}人</b></div>
        <div class="kv"><span>疑惑</span><b>${CK.suspLevel(me)}</b></div>
        <div class="kv"><span>妨害枠</span><b>${me.sabUsed}/${CK.sabQuota(me)}</b></div>
        <div class="kv"><span>罠</span><b>${trap}</b></div>
        <div class="kv eff"><span>効果中</span><div>${effectChips(me)}</div></div>`);
      const prods = CK.prodsOf(me);
      const items = Object.keys(me.items).filter((k) => me.items[k] > 0);
      const maxC = CK.cardSlots(me);
      const slots = [];
      for (let i = 0; i < Math.max(maxC, me.cardList.length); i++) {
        const c = me.cardList[i] ? CK.byId.card[me.cardList[i]] : null;
        slots.push(c ? `<div class="cslot r-${c.rarity}" title="${c.name}：${c.desc}${c.debuff ? ' ／ ' + c.debuff : ''}">${c.icon}<small>${c.name}</small></div>` : '<div class="cslot empty">＋</div>');
      }
      setHTML($('pnC'), `<div class="pn-title">🃏 強化カード（${me.cardList.length}/${maxC}）</div><div class="cslots">${slots.join('')}</div>
        <div class="muted small" style="margin-top:6px">毎週1枚。上限を超えたら入れ替え</div>`);
      setHTML($('pnD'), `
        <div class="row"><span class="lbl">商品</span>${prods.map((x) => chip(`${x.p.icon} ${x.p.name}`, x.p.desc + ' / ' + x.p.tags.join('・'), x.limited ? 'lim' : '')).join('') || '<span class="muted">なし</span>'}</div>
        <div class="row"><span class="lbl">シナジー</span>${d.syns.map((s) => chip(`${s.icon} ${s.name}`, s.desc, 'syn')).join('') || '<span class="muted">なし</span>'}</div>
        <div class="row"><span class="lbl">アイテム</span>${items.map((k) => chip(`${CK.byId.item[k].icon} ${CK.byId.item[k].name}×${me.items[k]}`, CK.byId.item[k].desc)).join('') || '<span class="muted">なし</span>'}</div>
        <div class="row"><span class="lbl">バイト（${me.staff.length}/${me.staffSlots}）</span>${me.staff.map((s) => chip(`${CK.byId.job[s.job].icon} ${s.name.split(' ')[0]}`, CK.byId.job[s.job].name + '：' + s.skills.map((k) => CK.byId.skill[k].name).join('・'))).join('') || '<span class="muted">なし</span>'}</div>`);
    } else {
      setHTML($('pnA'), `<div class="pn-title">🏬 ${rv.name}</div><div class="muted small">ライバル：${S.aiHidden ? '性格は？' : CK.DATA.personalities[rv.personality].name}</div>
        <div class="bigsale"><small>今週の売上</small>？？？</div>
        ${CK.SEGS.map((s) => gauge(s, rd.gauges[s])).join('')}
        <div class="kv"><span>評判</span><b>${stars(rd.rep)}</b></div>`);
      setHTML($('pnB'), `<div class="kv eff"><span>効果中</span><div>${effectChips(rv)}</div></div>`);
      setHTML($('pnC'), `<div class="pn-title">🃏 強化カード</div><div class="cslots">${'<div class="cslot empty">？</div>'.repeat(CK.cardSlots(rv))}</div>`);
      setHTML($('pnD'), `<div class="muted">ライバル店の品揃え・バイト・強化カード・売上は見えません。<br>タイムラインの口コミや、ゲージの変化から読み取ろう。</div>`);
    }
  };

  // ---------------- SNS投稿 ----------------
  UI.openSNS = function () {
    const S = CK.S;
    if (!S || S.phase !== 'run' || UI.modalActive()) return;
    const me = S.stores[0];
    if (me.snsCooldown > 0) return;
    const cands = CK.Sim.snsCandidates(me);
    UI.choice({
      icon: '📱', title: 'SNSに投稿する',
      text: `どの投稿にする？<br><span class="muted small">今月 ${S.monthTrend.name}／今週 ${S.weekTrend.name}。トレンドと街の空気を読もう</span>`,
      options: cands.map((c) => ({
        label: c.text, desc: `狙い：${CK.SEG_NAME[c.seg]}`, cls: 'post-opt',
        onPick: () => { const r = CK.Sim.snsPost(me, c); UI.toast(r, c.quality === 'good' ? 'good' : c.quality === 'bad' ? 'bad' : 'info'); },
      })).concat([{ label: 'やめておく', cls: 'ghost', onPick: () => {} }]),
    });
  };

  // ---------------- 全画面オーバーレイ ----------------
  // 同じ画面の描き直し（商品を選んだ、バイトを雇った等）ならスクロール位置を保つ。別の画面に切り替わったときだけ一番上へ
  UI.overlay = function (node) {
    const o = $('overlay');
    const heading = (el) => { const x = el.querySelector('h1, h2'); return x ? x.textContent : null; };
    const prev = o.classList.contains('hidden') ? null : heading(o);
    const keep = prev !== null && prev === heading(node);
    const top = o.scrollTop;
    o.innerHTML = '';
    o.appendChild(node);
    o.classList.remove('hidden');
    o.scrollTop = keep ? top : 0;
  };
  UI.hideOverlay = () => { $('overlay').classList.add('hidden'); $('overlay').innerHTML = ''; };

  const segBadges = (p) => h('div', { class: 'segs' },
    p.best.map((s) => h('span', { class: 'segb', style: `background:${CK.SEG_COLOR[s]}` }, '◎' + CK.SEG_NAME[s])),
    p.good.map((s) => h('span', { class: 'segb light', style: `border-color:${CK.SEG_COLOR[s]};color:${CK.SEG_COLOR[s]};background:${CK.SEG_COLOR[s]}1f` }, '○' + CK.SEG_NAME[s])));
  const isTrend = (t) => { const S = CK.S; return (S.monthTrend && S.monthTrend.tag === t) || (S.weekTrend && S.weekTrend.tag === t); };
  const prefOfTag = (t) => CK.PREFS.find((p) => CK.DATA.prefInfo[p].tag === t);

  UI.productCard = (p, on, onClick) => h('div', { class: 'pcard' + (on ? ' on' : ''), onclick: onClick },
    h('div', { class: 'pc-icon' }, p.icon),
    h('div', { class: 'pc-name' }, p.name),
    segBadges(p),
    h('div', { class: 'pc-tags' }, p.tags.map((t) => { const pr = prefOfTag(t); return h('span', { class: 'tag' + (isTrend(t) ? ' hot' : ''), title: pr ? `${CK.DATA.prefInfo[pr].name}の客が来やすい` : '' }, (isTrend(t) ? '🔥' : '') + '#' + t + (pr ? ' ' + CK.DATA.prefInfo[pr].icon : '')); })),
    h('div', { class: 'pc-eff' }, p.desc),
    h('div', { class: 'pc-price' }, p.price ? `売価 ¥${p.price}／原価 ¥${p.cost}` : '売上なし（ついで買いを呼ぶ）'));

  UI.prefBars = (prefs) => h('div', { class: 'prefbars' }, CK.PREFS.map((p) =>
    h('div', { class: 'pb' }, h('span', { class: 'pbl' }, CK.DATA.prefInfo[p].icon + ' ' + CK.DATA.prefInfo[p].name),
      h('div', { class: 'pbb' }, h('div', { class: 'pbf', style: `width:${Math.round(prefs[p] * 100)}%` })),
      h('span', { class: 'pbv' }, Math.round(prefs[p] * 100) + '%'))));

  UI.monthInfo = function () {
    const S = CK.S;
    return h('div', { class: 'minfo' },
      h('div', { class: 'mi-l' },
        h('div', { class: 'mi-season' }, `${CK.SEASON_ICON[S.season]} ${S.calMonth}月（${CK.SEASON_NAME[S.season]}）`),
        h('div', {}, '今月のトレンド：', h('b', { class: 'trend' }, S.monthTrend.name)),
        h('div', { class: 'muted small' }, `「${S.monthTrend.tag}」タグの商品の効果 ×1.2（1ヶ月ずっと）`)),
      h('div', { class: 'mi-r' }, h('div', { class: 'small b' }, '今月の街の好み'), UI.prefBars(S.prefs)));
  };

  // ---- タイトル ----
  UI.screenTitle = function () {
    const st = { months: 3, mode: 'select', season: 'spring', ai: 'random', name: '' };
    const P = CK.DATA.personalities;
    const opt = (group, val, text) => h('button', { class: 'chip' + (st[group] === val ? ' on' : ''), onclick: () => { st[group] = val; render(); } }, text);
    const row = (lbl, kids) => h('div', { class: 'frow' }, h('div', { class: 'flbl' }, lbl), h('div', { class: 'fopts' }, kids));
    function render() {
      UI.overlay(h('div', { class: 'screen title' },
        h('div', { class: 'logo' },
          h('div', { class: 'logo-sub' }, '対戦型コンビニ経営ローグライク'),
          h('h1', {}, 'コンビニ激戦区'),
          h('div', { class: 'logo-emo' }, '🏪 ⚡ 🏬')),
        h('div', { class: 'form' },
          row('プレイ期間', [3, 6, 9, 12].map((m) => opt('months', m, m + 'ヶ月'))),
          row('開始月', [opt('mode', 'select', '季節を選ぶ'), opt('mode', 'random', '🎲 ランダム')]),
          st.mode === 'select' ? row('開始の季節', ['spring', 'summer', 'autumn', 'winter'].map((s) => opt('season', s, CK.SEASON_ICON[s] + ' ' + CK.SEASON_NAME[s]))) : null,
          row('ライバルの性格', [opt('ai', 'random', '🎲 ランダム（伏せる）')].concat(Object.keys(P).map((k) => opt('ai', k, P[k].name)))),
          row('店の名前', [h('input', { class: 'name-in', placeholder: 'わたしのコンビニ', value: st.name, maxlength: 12, oninput: (e) => (st.name = e.target.value) })])),
        h('button', { class: 'big-btn', onclick: () => CK.Game.newGame(st) }, 'ゲームスタート ▶'),
        h('div', { class: 'howto' },
          h('b', {}, 'あそびかた'),
          h('ul', {},
            h('li', {}, '向かいのライバル店と、最終的な「総利益」で勝負！'),
            h('li', {}, '客層（若者・中年・老人）と「好み」を読んで品揃えを組もう。タグがそろうとシナジー発動'),
            h('li', {}, '営業中はSNSで宣伝。トレンドに乗った投稿を選ぶとバズる'),
            h('li', {}, '週の初めに妨害や罠を仕掛けられる。でもバレたら炎上…'),
            h('li', {}, '毎週、強化カードを1枚もらえる。持てるのは5枚までなので、入れ替えながらビルドを組もう'),
            h('li', {}, '月末には設備・アイテム・バイト・品揃えを見直そう')),
          h('div', { class: 'muted small' }, '操作：スペース＝一時停止　1〜4＝倍速'))));
    }
    render();
  };

  // ---- 定番商品 ----
  UI.screenProducts = function (onDone, opts) {
    opts = opts || {};
    const S = CK.S, me = S.stores[0];
    me._d = CK.derive(me);
    const slots = CFG.stdSlots + (me._d.acc.stdSlots || 0);
    let sel = me.products.filter((id) => CK.byId.product[id]).slice(0, slots);
    function render() {
      const list = sel.map((id) => ({ p: CK.byId.product[id], limited: false }));
      if (me.limited) list.push({ p: CK.byId.product[me.limited], limited: true });
      const syns = CK.synergiesOf(list);
      UI.overlay(h('div', { class: 'screen' },
        h('h2', {}, opts.initial ? '🏪 開店準備：定番商品を選ぼう' : `📦 ${S.calMonth}月の定番商品を選ぼう`),
        UI.monthInfo(),
        h('div', { class: 'sel-count' }, `定番枠 ${sel.length} / ${slots}`, h('span', { class: 'muted small' }, '　◎の客層が来やすい。好みタグ（🍰🌶️🍖🥦🎮）が同じ客も来やすい')),
        h('div', { class: 'pgrid' }, CK.DATA.products.map((p) => UI.productCard(p, sel.includes(p.id), () => {
          if (sel.includes(p.id)) sel = sel.filter((x) => x !== p.id);
          else if (sel.length < slots) sel.push(p.id);
          render();
        }))),
        h('div', { class: 'syn-prev' }, h('b', {}, 'シナジー予想：'), syns.length ? syns.map((s) => h('span', { class: 'syn', title: s.desc }, `${s.icon} ${s.name}`)) : h('span', { class: 'muted' }, 'なし'),
          me.limited ? h('span', { class: 'muted small' }, `（限定品 ${CK.byId.product[me.limited].name} を含む）`) : null),
        h('button', { class: 'big-btn', disabled: sel.length !== slots, onclick: () => { me.products = sel.slice(); onDone(); } }, sel.length === slots ? '決定 ▶' : `あと${slots - sel.length}品えらんでね`)));
    }
    render();
  };

  // ---- バイト ----
  UI.staffCard = function (s, btn) {
    const job = CK.byId.job[s.job];
    return h('div', { class: 'scard' },
      h('div', { class: 'sc-top' }, h('span', { class: 'sc-icon' }, job.icon), h('div', {}, h('div', { class: 'sc-name' }, s.name), h('div', { class: 'sc-job' }, job.name))),
      h('div', { class: 'sc-eff' }, job.desc),
      h('div', { class: 'sc-skills' }, s.skills.map((id) => { const sk = CK.byId.skill[id]; return h('div', { class: 'skill' + (sk.neg ? ' neg' : '') }, (sk.neg ? '⚠ ' : '★ ') + sk.name + '：' + sk.desc); })),
      h('div', { class: 'sc-wage' }, '週給 ' + U.yen(s.wage)), btn);
  };
  UI.screenStaff = function (onDone) {
    const S = CK.S, me = S.stores[0];
    me._d = CK.derive(me);
    const cands = CK.Game.staffCandidates(me);
    function render() {
      const wages = me.staff.reduce((a, s) => a + s.wage, 0);
      UI.overlay(h('div', { class: 'screen' },
        h('h2', {}, '👥 バイトを雇う'),
        h('div', { class: 'money-line' }, `枠 ${me.staff.length} / ${me.staffSlots}　｜　週給の合計 ${U.yen(wages)}　｜　所持金 ${U.yen(me.money)}`),
        h('div', { class: 'muted small' }, '回転率が足りないと、客をさばききれずに帰してしまう。店長ひとりで回転率 6。'),
        h('h3', {}, 'いまのバイト'),
        h('div', { class: 'sgrid' }, me.staff.length ? me.staff.map((s) => UI.staffCard(s, h('button', { class: 'small-btn danger', onclick: () => { me.staff = me.staff.filter((x) => x !== s); render(); } }, '解雇する'))) : h('div', { class: 'muted' }, 'まだ誰もいない')),
        h('h3', {}, '応募してきた人'),
        h('div', { class: 'sgrid' }, cands.length ? cands.map((s) => UI.staffCard(s, h('button', { class: 'small-btn', disabled: me.staff.length >= me.staffSlots, onclick: () => { me.staff.push(s); cands.splice(cands.indexOf(s), 1); render(); } }, me.staff.length >= me.staffSlots ? '枠がいっぱい' : '雇う'))) : h('div', { class: 'muted' }, 'もう応募者はいない')),
        h('button', { class: 'big-btn', onclick: onDone }, '決定 ▶')));
    }
    render();
  };

  // ---- 週の初めの準備 ----
  UI.screenPrep = function (onDone) {
    const S = CK.S, me = S.stores[0], rv = S.stores[1];
    me._d = CK.derive(me);
    let limSel = null, sabSel = null, trapSel = null;
    const sabCands = me.sabUsed < CK.sabQuota(me) ? CK.Sim.sabCandidates(me) : [];
    const trapItems = Object.keys(me.items).filter((k) => me.items[k] > 0 && CK.byId.item[k].main.some((id) => CK.byId.sab[id]));
    function trapBtn(val, text, sub) {
      const on = JSON.stringify(val) === JSON.stringify(trapSel);
      return h('button', { class: 'trap' + (on ? ' on' : ''), onclick: () => { trapSel = val; render(); } }, h('div', {}, text), sub ? h('div', { class: 'small muted' }, sub) : null);
    }
    function render() {
      const trapCost = CK.Sim.trapCost(me);
      const sabCost = sabSel ? CK.Sim.sabCost(me, CK.byId.sab[sabSel]) : 0;
      const total = sabCost + (trapSel && trapSel.type === 'generic' ? trapCost : 0);
      UI.overlay(h('div', { class: 'screen prep' },
        h('h2', {}, `📋 ${S.calMonth}月 第${S.week + 1}週の準備`),
        h('div', { class: 'trendrow' }, '今月 ', h('b', { class: 'trend' }, S.monthTrend.name), '　今週 ', h('b', { class: 'trend' }, S.weekTrend.name),
          h('span', { class: 'muted small' }, `　（「${S.monthTrend.tag}」×1.2 ／「${S.weekTrend.tag}」×1.1。SNSでは今週のトレンドに乗ると強い）`)),
        h('div', { class: 'cols' },
          h('div', { class: 'col' },
            h('h3', {}, '🎁 本部から限定品が届いた'),
            me.offers.length
              ? h('div', { class: 'pgrid small' }, me.offers.map((id) => UI.productCard(CK.byId.product[id], limSel === id, () => { limSel = limSel === id ? null : id; render(); })))
              : h('div', { class: 'muted' }, '今週は限定品が届かなかった…（誰かに手を回された？）'),
            h('div', { class: 'muted small' }, me.limited ? `いまの限定品：${CK.byId.product[me.limited].icon} ${CK.byId.product[me.limited].name}（選ばなければそのまま）` : '選ばなければ限定品枠は空のまま')),
          h('div', { class: 'col' },
            h('h3', {}, `😈 妨害を仕掛ける（今月 ${me.sabUsed}/${CK.sabQuota(me)}回）`),
            sabCands.length ? h('div', { class: 'sablist' }, sabCands.map((sab) => {
              const o = CK.Sim.sabOdds(me, sab), cost = CK.Sim.sabCost(me, sab);
              const tgt = sab.target ? sab.target(rv) : null;
              return h('div', { class: 'sabcard' + (sabSel === sab.id ? ' on' : ''), onclick: () => { sabSel = sabSel === sab.id ? null : sab.id; render(); } },
                h('div', { class: 'sab-h' }, h('span', { class: 'sab-icon' }, sab.icon), h('b', {}, sab.name), h('span', { class: 'cat cat-' + sab.cat }, CK.CAT_NAME[sab.cat])),
                h('div', { class: 'small' }, sab.desc + (tgt ? `（狙い：${CK.Sim.targetLabel(sab, tgt)}）` : '')),
                h('div', { class: 'oddbar' }, h('i', { class: 's', style: `width:${o.success}%` }), h('i', { class: 'f', style: `width:${o.fail}%` }), h('i', { class: 'x', style: `width:${o.scandal}%` })),
                h('div', { class: 'odds' }, h('span', { class: 'o-s' }, `成功 ${o.success}%`), h('span', { class: 'o-f' }, `失敗 ${o.fail}%`), h('span', { class: 'o-x' }, `スキャンダル ${o.scandal}%`)),
                h('div', { class: 'small b' }, '費用 ' + U.yen(cost)));
            })) : h('div', { class: 'muted' }, CK.sabQuota(me) === 0 ? '「完全防御」のカードを持っているので妨害できない' : '今月の妨害枠は使い切った'),
            h('div', { class: 'muted small' }, `成功すると相手の客の一部が自分の店に流れてくる（3日間 来店 +15%）。あなたの疑惑：${CK.suspLevel(me)}（高いほどスキャンダル率が上がる）。相手の罠に引っかかると、さらにバレやすい`)),
          h('div', { class: 'col' },
            h('h3', {}, '🪤 罠を仕掛ける'),
            h('div', { class: 'traplist' },
              trapBtn(null, 'なし', ''),
              CK.CATS.map((c) => trapBtn({ type: 'generic', cat: c }, `${CK.DATA.trapNames[c]}（${CK.CAT_NAME[c]}系の妨害）`, trapCost ? U.yen(trapCost) + '（来なければ無駄になる）' : '無料')),
              trapItems.map((k) => trapBtn({ type: 'item', item: k }, `${CK.byId.item[k].icon} ${CK.byId.item[k].name}を置く`, '来なければアイテムは戻ってくる'))),
            h('div', { class: 'muted small' }, '相手の妨害の系統を読んで置く。当たれば無効化＋相手のスキャンダル率アップ'))),
        h('div', { class: 'prep-foot' },
          h('div', {}, `所持金 ${U.yen(me.money)}`, total ? h('span', { class: 'muted' }, `　→ この準備で −${U.yen(total)}`) : null),
          h('button', { class: 'big-btn', onclick: () => {
            if (limSel) me.limited = limSel;
            if (sabSel) CK.Sim.planSabotage(me, sabSel);
            me.trap = null;
            if (trapSel) { if (trapSel.type === 'generic') me.money -= CK.Sim.trapCost(me); me.trap = trapSel; }
            onDone();
          } }, '営業開始 ▶'))));
    }
    render();
  };

  // ---- 月末 ----
  UI.screenSettle = function (onDone) {
    const S = CK.S, me = S.stores[0], rv = S.stores[1];
    const mp = me.monthProfits[me.monthProfits.length - 1], rp = rv.monthProfits[rv.monthProfits.length - 1];
    const win = mp >= rp;
    const final = S.monthIdx >= S.monthsTotal - 1;
    UI.overlay(h('div', { class: 'screen settle' },
      h('h2', {}, `🧮 ${S.calMonth}月の決算`),
      h('div', { class: 'big-num ' + (mp >= 0 ? 'plus' : 'minus') }, U.yen(mp)),
      h('div', { class: 'muted' }, '今月の利益（売上 − 原価 − 人件費 − 家賃 − 使ったお金）'),
      h('div', { class: 'verdict ' + (win ? 'win' : 'lose') }, win ? '今月はあなたの勝ち！🎉' : '今月はライバルの勝ち…😣'),
      h('div', {}, `月ごとの勝敗：${S.monthWins}勝 ${S.monthIdx + 1 - S.monthWins}敗`),
      h('div', { class: 'muted small' }, `今月の来店 ${me.monthVisitors}人／さばききれなかった客 ${me.monthLost}人`),
      h('div', { class: 'muted small' }, 'ライバルの金額は最終結果まで伏せられています'),
      h('button', { class: 'big-btn', onclick: onDone }, final ? '最終結果へ ▶' : '月末の強化へ ▶')));
  };

  UI.screenCards = function (onDone) {
    const me = CK.S.stores[0];
    me._d = CK.derive(me);
    const offers = CK.Game.cardOffers(me);
    const rname = { normal: 'ノーマル', rare: 'レア', legend: 'レジェンド', peaky: 'ピーキー' };
    let picked = null;
    const take = (c, idx) => {
      const old = idx != null ? CK.byId.card[me.cardList[idx]] : null;
      CK.Game.takeCard(me, c.id, idx);
      UI.toast(old ? `${old.name} → ${c.icon} ${c.name} に入れ替えた！` : `${c.icon} ${c.name}を手に入れた！`, 'good');
      onDone();
    };
    const cardBody = (c) => [
      h('div', { class: 'cc-r' }, rname[c.rarity]),
      h('div', { class: 'cc-icon' }, c.icon),
      h('div', { class: 'cc-name' }, c.name),
      h('div', { class: 'cc-desc' }, c.desc),
      c.debuff ? h('div', { class: 'cc-debuff' }, '⚠ ' + c.debuff) : null,
      me.cards[c.id] ? h('div', { class: 'small muted' }, `所持 ×${me.cards[c.id]}`) : null,
    ];
    function render() {
      const max = CK.cardSlots(me);
      const full = me.cardList.length >= max;
      UI.overlay(h('div', { class: 'screen' },
        h('h2', {}, '🃏 強化カードを1枚選ぼう（毎週・無料）'),
        h('div', { class: 'muted' }, `持てるのは ${max} 枚まで（いま ${me.cardList.length} 枚）。` + (full ? '枠がいっぱいなので、もらうなら1枚と入れ替え。' : '')),
        h('div', { class: 'cgrid' }, offers.map((c) => h('div', { class: 'ccard r-' + c.rarity + (picked === c ? ' picked' : ''), onclick: () => { if (!full) take(c); else { picked = c; render(); } } }, cardBody(c)))),
        picked ? h('div', { class: 'swapbox' },
          h('b', {}, `「${picked.name}」と入れ替えるカードを選んでね`),
          h('div', { class: 'held' }, me.cardList.map((id, i) => { const c = CK.byId.card[id]; return h('div', { class: 'heldcard r-' + c.rarity, style: 'cursor:pointer', onclick: () => take(picked, i) }, h('div', { class: 'hc-icon' }, c.icon), h('b', {}, c.name), h('div', {}, c.desc), c.debuff ? h('div', { class: 'cc-debuff' }, '⚠ ' + c.debuff) : null, h('div', { class: 'small-btn' }, 'これを捨てる')); })),
          h('button', { class: 'small-btn danger', onclick: () => { picked = null; render(); } }, 'やっぱりやめる')) : null,
        !picked ? h('div', {}, h('h3', {}, '持っているカード'),
          h('div', { class: 'held' }, me.cardList.length ? me.cardList.map((id) => { const c = CK.byId.card[id]; return h('div', { class: 'heldcard r-' + c.rarity }, h('div', { class: 'hc-icon' }, c.icon), h('b', {}, c.name), h('div', {}, c.desc), c.debuff ? h('div', { class: 'cc-debuff' }, '⚠ ' + c.debuff) : null); }) : h('span', { class: 'muted' }, 'まだない'))) : null,
        h('button', { class: 'big-btn', style: 'background:#b8ad9e;box-shadow:0 5px 0 #8f8577', onclick: () => { UI.toast('今回はカードをもらわなかった', 'info'); onDone(); } }, '今回はもらわない')));
    }
    render();
  };

  UI.screenShop = function (onDone) {
    const S = CK.S, me = S.stores[0];
    function render() {
      UI.overlay(h('div', { class: 'screen' },
        h('h2', {}, '🛒 ショップ'),
        h('div', { class: 'money-line' }, '所持金 ', h('b', {}, U.yen(me.money))),
        h('h3', {}, '🏗️ 設備強化（買うたびに値上がり）'),
        h('div', { class: 'shopgrid' }, CK.DATA.facilities.map((f) => {
          const can = CK.Game.facCanBuy(me, f), price = CK.Game.facPrice(me, f);
          return h('div', { class: 'shopcard' },
            h('div', { class: 'sh-icon' }, f.icon),
            h('div', { class: 'sh-name' }, f.name + (me.facilities[f.id] ? `（Lv${me.facilities[f.id]}）` : '')),
            h('div', { class: 'small' }, f.desc),
            h('button', { class: 'small-btn', disabled: !can || me.money < price, onclick: () => { CK.Game.buyFac(me, f.id); render(); } }, can ? U.yen(price) : '上限'));
        })),
        h('h3', {}, '🛡️ 対策アイテム（今月の入荷）'),
        h('div', { class: 'muted small' }, '妨害や突発イベントが来たときに使える。得意分野には強く、サブの対象にも少し効く。物理・SNS・業務の妨害に効くものは「罠」としても置ける'),
        h('div', { class: 'shopgrid' }, S.shopItems.map((it) => h('div', { class: 'shopcard' },
          h('div', { class: 'sh-icon' }, it.icon),
          h('div', { class: 'sh-name' }, `${it.name}（${it.uses}回分）`),
          h('div', { class: 'small' }, it.desc),
          me.items[it.id] ? h('div', { class: 'small muted' }, `所持：残り${me.items[it.id]}回`) : null,
          h('button', { class: 'small-btn', disabled: me.money < it.price, onclick: () => { CK.Game.buyItem(me, it.id); render(); } }, U.yen(it.price))))),
        h('button', { class: 'big-btn', onclick: onDone }, '次へ ▶')));
    }
    render();
  };

  // ---- 結果発表 ----
  UI.screenResult = function () {
    const S = CK.S, me = S.stores[0], rv = S.stores[1];
    const mt = me.money - CFG.startMoney, rt = rv.money - CFG.startMoney;
    const win = mt >= rt;
    const chart = h('canvas', { width: 720, height: 240, class: 'chart' });
    const best = Object.entries(me.stats.sold).sort((a, b) => b[1] - a[1])[0];
    const P = CK.DATA.personalities[rv.personality];
    UI.overlay(h('div', { class: 'screen result' },
      h('div', { class: 'res-big ' + (win ? 'win' : 'lose') }, win ? 'WIN!' : 'LOSE…'),
      h('div', { class: 'res-sub' }, win ? '激戦区を制した！' : 'ライバルに一歩およばず…'),
      h('div', { class: 'res-vs' },
        h('div', { class: 'vs-box me' }, h('div', {}, '🏪 ' + me.name), h('div', { class: 'vs-num' }, U.yen(mt))),
        h('div', { class: 'vs' }, 'VS'),
        h('div', { class: 'vs-box rv' }, h('div', {}, '🏬 ' + rv.name), h('div', { class: 'vs-num' }, U.yen(rt)))),
      h('div', { class: 'muted small' }, '総利益 ＝ 最終の所持金 − 初期資金'),
      chart,
      h('div', { class: 'stats' },
        [['妨害の成功', me.stats.sabSuccess + '回'], ['防いだ妨害', me.stats.defended + '回'], ['スキャンダル', me.stats.scandals + '回'], ['バズった回数', me.stats.buzz + '回'],
          ['一番売れた商品', best ? `${CK.byId.product[best[0]].icon} ${CK.byId.product[best[0]].name}（${best[1]}個）` : '—'], ['来店した客', me.stats.visitors + '人'], ['月ごとの勝敗', `${S.monthWins}勝 ${S.monthsTotal - S.monthWins}敗`]]
          .map(([k, v]) => h('div', { class: 'stat' }, h('span', {}, k), h('b', {}, v)))),
      h('div', { class: 'reveal' }, `相手の性格は【${P.name}】でした：${P.desc}`),
      h('button', { class: 'big-btn', onclick: () => { CK.S = null; CK.Render.reset(); UI.clearTimeline(); UI.screenTitle(); } }, 'もう一度遊ぶ ▶')));
    CK.Render.drawChart(chart, me.monthProfits, rv.monthProfits, [me.name, rv.name]);
  };
})();

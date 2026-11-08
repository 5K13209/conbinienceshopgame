(function () {
  'use strict';
  const CK = window.CK;
  const R = (CK.Render = {});
  const W = 880, H = 500;
  const EMO = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  const FONT = '"M PLUS Rounded 1c",sans-serif';
  let cv, ctx;
  R.sprites = []; R.popups = []; R.revAcc = 0; R.revTimer = 0; R.time = 0; R.passTimer = 0;
  R.init = () => { cv = document.getElementById('cv'); ctx = cv.getContext('2d'); };
  R.reset = () => { R.sprites = []; R.popups = []; R.revAcc = 0; };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // ---- レイアウト（店内） ----
  const DOOR_X = 440;
  const COUNTER = { x: 610, y: 280, w: 240 };
  const LIMITED = { x: 150, y: 382 };
  const SHELF_Y = 135;
  const shelves = (n) => {
    const gap = 12, w = Math.min(150, (840 - gap * (n - 1)) / n);
    return Array.from({ length: n }, (_, i) => ({ x: 20 + i * (w + gap), y: SHELF_Y, w }));
  };
  const COUNTER_STAFF = [[665, 302], [735, 302], [805, 302]];
  const FLOOR_STAFF = [[310, 292], [130, 296], [480, 296], [300, 440], [560, 430]];

  const LOOK = {
    young: () => ({ shirt: pick(['#ff9f43', '#ff6b81', '#feca57', '#48dbfb', '#a29bfe']), pants: '#34495e', hair: pick(['#2d1e14', '#6b4423', '#c98f45', '#1d1d1d']), style: pick(['short', 'long', 'bob', 'cap']), cap: pick(['#e74c3c', '#2d98da', '#20bf6b']) }),
    mid: () => ({ shirt: '#2f4b7c', pants: '#22314f', hair: pick(['#1d1d1d', '#3b2a20', '#555']), style: pick(['short', 'short', 'bald']), tie: true }),
    old: () => ({ shirt: pick(['#4caf7a', '#8bc34a', '#a1887f']), pants: '#6d5d4b', hair: '#e8e8e8', style: pick(['bun', 'bald', 'short']) }),
  };

  // ---- 客のスプライト ----
  R.onCustomer = function (stIdx, seg, pref, bought, rev, lost) {
    const S = CK.S;
    if (stIdx === 0 && rev) R.revAcc += rev;
    if (stIdx !== S.viewIdx) return;
    if (R.sprites.length >= CK.CFG.maxSprites) return;
    if (Math.random() > 0.22 / Math.max(1, S.speed)) return;
    R.sprites.push(stIdx === 0 ? makeInside(seg, pref, bought, lost) : makeOutside(seg, lost));
  };

  function makeInside(seg, pref, bought, lost) {
    const st = CK.S.stores[0];
    const n = Math.max(CK.CFG.stdSlots, st.products.length);
    const sh = shelves(n);
    const sx = DOOR_X + rnd(-25, 25);
    const path = [];
    if (lost) {
      path.push({ x: sx, y: 445, wait: 0.6, emote: '💦' });
      path.push({ x: sx, y: 540 });
    } else {
      let tgt;
      if (st.limited && Math.random() < 0.3) tgt = { x: LIMITED.x + rnd(-50, 50), y: LIMITED.y + 48 };
      else { const s = sh[Math.floor(Math.random() * Math.min(st.products.length || 1, sh.length))]; tgt = { x: s.x + rnd(25, s.w - 25), y: s.y + 125 }; }
      tgt.wait = rnd(0.7, 1.4);
      if (pref !== 'normal' && Math.random() < 0.6) tgt.emote = CK.DATA.prefInfo[pref].icon;
      path.push({ x: sx, y: 440 });
      path.push(tgt);
      if (bought) path.push({ x: COUNTER.x + rnd(40, COUNTER.w - 40), y: COUNTER.y + 108, wait: 0.6, emote: Math.random() < 0.35 ? '💴' : null });
      else path.push({ x: tgt.x + rnd(-30, 30), y: tgt.y + 10, emote: Math.random() < 0.4 ? '🤔' : null });
      path.push({ x: sx, y: 440 });
      path.push({ x: sx, y: 540 });
    }
    return { x: sx, y: 530, path, look: LOOK[seg](), wait: 0, emote: null, emoteT: 0, walk: Math.random() * 10 };
  }

  function makeOutside(seg, lost) {
    const fromLeft = Math.random() < 0.5;
    const y = rnd(445, 480);
    const x0 = fromLeft ? -20 : W + 20;
    const path = lost
      ? [{ x: DOOR_X + (fromLeft ? -70 : 70), y, wait: 0.6, emote: '💦' }, { x: x0, y }]
      : [{ x: DOOR_X + rnd(-20, 20), y }, { x: DOOR_X, y: 405, vanish: true }];
    return { x: x0, y, path, look: LOOK[seg](), wait: 0, emote: null, emoteT: 0, walk: 0 };
  }

  function makePasser() {
    const fromLeft = Math.random() < 0.5;
    const y = rnd(455, 492);
    const seg = pick(CK.SEGS);
    return { x: fromLeft ? -20 : W + 20, y, path: [{ x: fromLeft ? W + 30 : -30, y }], look: LOOK[seg](), wait: 0, emote: null, emoteT: 0, walk: 0 };
  }

  function updateSprites(sdt) {
    const speed = 120;
    for (const s of R.sprites) {
      s.emoteT -= sdt;
      if (s.wait > 0) { s.wait -= sdt; continue; }
      const t = s.path[0];
      if (!t) { s.dead = true; continue; }
      const dx = t.x - s.x, dy = t.y - s.y;
      const dist = Math.hypot(dx, dy);
      const step = speed * sdt;
      if (dist <= step) {
        s.x = t.x; s.y = t.y; s.path.shift();
        if (t.wait) s.wait = t.wait;
        if (t.emote) { s.emote = t.emote; s.emoteT = 1.3; }
        if (t.vanish) s.dead = true;
      } else {
        s.x += (dx / dist) * step; s.y += (dy / dist) * step; s.walk += sdt * 12;
      }
    }
    R.sprites = R.sprites.filter((s) => !s.dead);
  }

  // ---- 基本図形 ----
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function emoji(ch, x, y, size) { ctx.font = `${size}px ${EMO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, x, y); }
  // 黒っぽいフチ付きの絵文字（一度描いたらキャッシュ）
  const emojiCache = {};
  function emojiO(ch, x, y, size) {
    const key = ch + '|' + size;
    let c = emojiCache[key];
    if (!c) {
      c = document.createElement('canvas');
      c.width = c.height = Math.ceil(size * 1.5) + 8;
      const g = c.getContext('2d');
      g.font = `${size}px ${EMO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.filter = 'drop-shadow(1.5px 0 0 #2a2430) drop-shadow(-1.5px 0 0 #2a2430) drop-shadow(0 1.5px 0 #2a2430) drop-shadow(0 -1.5px 0 #2a2430)';
      g.fillText(ch, c.width / 2, c.height / 2);
      emojiCache[key] = c;
    }
    ctx.drawImage(c, Math.round(x - c.width / 2), Math.round(y - c.height / 2));
  }
  function label(text, x, y, size, color, weight) { ctx.font = `${weight || 'bold'} ${size}px ${FONT}`; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y); }

  // ---- 2頭身キャラ ----
  // ---- 2頭身キャラ（レトロな熱血系ドット絵風・オリジナル） ----
  // 12×20マスのドットを組み立てて、黒フチを付けた画像をキャッシュして使う
  const PX = 3, GW = 12, GH = 20;
  const SKIN = '#ffcf9e', SKIN_D = '#d9925f', OUT = '#16141c', WHITE = '#ffffff';
  const spriteCache = {};

  function buildSprite(L, frame) {
    const g = Array.from({ length: GH }, () => Array(GW).fill(null));
    const set = (c, r, col) => { if (r >= 0 && r < GH && c >= 0 && c < GW) g[r][c] = col; };
    const rect = (c0, r0, c1, r1, col) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(c, r, col); };
    // 頭（大きめ・角ばったアゴ）
    rect(1, 3, 10, 10, SKIN);
    set(1, 3, null); set(10, 3, null); set(1, 10, null); set(10, 10, null);
    // 髪型
    const H = L.hair;
    switch (L.style) {
      case 'long': rect(1, 2, 10, 4, H); rect(0, 3, 1, 11, H); rect(10, 3, 11, 11, H); set(1, 2, null); set(10, 2, null); break;
      case 'bob': rect(1, 2, 10, 4, H); rect(0, 3, 1, 8, H); rect(10, 3, 11, 8, H); set(1, 2, null); set(10, 2, null); break;
      case 'bun': rect(1, 2, 10, 4, H); rect(4, 0, 7, 1, H); set(1, 5, H); set(10, 5, H); break;
      case 'bald': rect(1, 5, 1, 7, H); rect(10, 5, 10, 7, H); break;
      case 'cap': { const C = L.cap || '#e74c3c'; rect(1, 4, 10, 4, H); rect(2, 1, 9, 1, C); rect(1, 2, 10, 3, C); rect(7, 4, 11, 4, C); break; }
      case 'guardcap': rect(1, 4, 10, 4, H); rect(2, 1, 9, 1, '#1e3799'); rect(1, 2, 10, 3, '#1e3799'); rect(0, 4, 11, 4, '#142a6b'); set(5, 2, '#f6b93b'); set(6, 2, '#f6b93b'); break;
      case 'pomp': rect(1, 2, 10, 4, H); rect(4, 0, 11, 1, H); rect(9, 1, 11, 3, H); break;
      case 'hat': rect(1, 4, 10, 4, H); rect(2, 0, 9, 3, '#8d6e63'); rect(0, 4, 11, 4, '#6d4c41'); rect(2, 2, 9, 2, '#4e342e'); break;
      default: rect(1, 2, 10, 4, H); set(2, 1, H); set(4, 1, H); set(6, 1, H); set(8, 1, H); set(1, 5, H); set(10, 5, H);
    }
    // 太い眉と目（キリッと）
    const brow = L.hair === '#e8e8e8' ? '#9a9a9a' : OUT;
    rect(2, 5, 4, 5, brow); rect(7, 5, 9, 5, brow);
    rect(3, 6, 3, 7, WHITE); rect(4, 6, 4, 7, OUT); rect(7, 6, 7, 7, OUT); rect(8, 6, 8, 7, WHITE);
    if (L.glasses) { set(2, 6, OUT); set(5, 6, OUT); set(6, 6, OUT); set(9, 6, OUT); }
    rect(5, 9, 6, 9, SKIN_D);
    // 体
    rect(2, 11, 9, 15, L.shirt);
    if (L.stripe) rect(2, 13, 9, 13, L.stripe);
    if (L.tie) rect(5, 11, 6, 14, '#c0392b');
    // 腕（歩くと振る）
    const la = frame === 2 ? 1 : 0, ra = frame === 1 ? 1 : 0;
    rect(1, 11 + la, 1, 13 + la, L.shirt); set(1, 14 + la, SKIN);
    rect(10, 11 + ra, 10, 13 + ra, L.shirt); set(10, 14 + ra, SKIN);
    if (L.laptop) { rect(2, 12, 9, 14, '#7f8c8d'); rect(3, 12, 8, 13, '#bdc3c7'); }
    // 足と靴
    const P = L.pants, SH = '#3b2a20';
    if (frame === 1) { rect(3, 16, 4, 17, P); rect(2, 18, 4, 18, SH); rect(7, 16, 8, 18, P); rect(7, 19, 9, 19, SH); }
    else if (frame === 2) { rect(3, 16, 4, 18, P); rect(2, 19, 4, 19, SH); rect(7, 16, 8, 17, P); rect(7, 18, 9, 18, SH); }
    else { rect(3, 16, 4, 18, P); rect(7, 16, 8, 18, P); rect(2, 19, 4, 19, SH); rect(7, 19, 9, 19, SH); }
    return g;
  }

  function spriteFor(L, frame) {
    const key = [L.shirt, L.pants, L.hair, L.style, L.cap, L.stripe, L.tie, L.glasses, L.laptop, frame].join('|');
    if (spriteCache[key]) return spriteCache[key];
    const g = buildSprite(L, frame);
    const c = document.createElement('canvas');
    c.width = (GW + 2) * PX; c.height = (GH + 2) * PX;
    const x = c.getContext('2d');
    x.fillStyle = OUT;
    for (let r = 0; r < GH; r++) for (let cc = 0; cc < GW; cc++) if (g[r][cc]) {
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) x.fillRect((cc + 1 + dx) * PX, (r + 1 + dy) * PX, PX, PX);
    }
    for (let r = 0; r < GH; r++) for (let cc = 0; cc < GW; cc++) if (g[r][cc]) { x.fillStyle = g[r][cc]; x.fillRect((cc + 1) * PX, (r + 1) * PX, PX, PX); }
    spriteCache[key] = c;
    return c;
  }

  function drawChibi(x, y, L, walk, sc) {
    sc = sc || 1;
    const s = Math.sin(walk);
    const frame = !walk ? 0 : s > 0.35 ? 1 : s < -0.35 ? 2 : 0;
    const img = spriteFor(L, frame);
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(x, y, 14 * sc, 4 * sc, 0, 0, Math.PI * 2); ctx.fill();
    const w = img.width * sc, hh = img.height * sc;
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(x - w / 2), Math.round(y - hh + PX * sc), w, hh);
    ctx.imageSmoothingEnabled = prev;
  }

  function staffLook(sf) {
    const L = { shirt: '#5aa9e6', stripe: '#fff', pants: '#2c3e50', hair: sf.look.hair, style: sf.look.style };
    if (sf.job === 'yankee') { L.style = 'pomp'; L.hair = '#f1c40f'; L.shirt = '#2d3436'; L.stripe = null; }
    if (sf.job === 'guard') { L.style = 'guardcap'; L.shirt = '#34495e'; L.stripe = null; }
    if (sf.job === 'hacker') { L.laptop = true; L.shirt = '#636e72'; L.stripe = null; }
    if (sf.job === 'consultant') { L.glasses = true; L.tie = true; }
    if (sf.job === 'detective') { L.style = 'hat'; L.shirt = '#a1887f'; L.stripe = null; }
    if (sf.job === 'pr') { L.tie = true; }
    if (sf.job === 'exmanager') { L.hair = '#bdc3c7'; }
    return L;
  }

  function drawStaff(sf, x, y) {
    const bob = Math.sin(R.time * 2 + sf.uid) * 1.2;
    drawChibi(x, y + bob * 0.3, staffLook(sf), 0, 1);
    emoji(CK.byId.job[sf.job].icon, x + 20, y - 66, 13);
  }

  function drawBubble(s) {
    if (!s.emote || s.emoteT <= 0) return;
    const x = s.x, y = s.y - 78;
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    rr(x - 15, y - 14, 30, 26, 10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 4, y + 12); ctx.lineTo(x + 2, y + 18); ctx.lineTo(x + 5, y + 12); ctx.fill();
    emoji(s.emote, x, y, 16);
  }

  // ---- 窓の外 ----
  function skyColor(t) {
    if (t < 0.12) return ['#ffb88c', '#ffe3b3'];
    if (t < 0.6) return ['#7ec8ff', '#d4efff'];
    if (t < 0.72) return ['#ff9a76', '#ffd3a5'];
    return ['#1b2350', '#3b4a7a'];
  }
  function drawWindow(x, y, w, h, S, t) {
    ctx.save();
    rr(x, y, w, h, 6); ctx.clip();
    const [c1, c2] = skyColor(t);
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const night = t >= 0.72;
    if (night) { ctx.fillStyle = '#fff'; for (let i = 0; i < 8; i++) ctx.fillRect(x + ((i * 53 + 17) % w), y + ((i * 29) % (h - 30)) + 4, 2, 2); }
    else if (S.season === 'summer') { ctx.fillStyle = '#ffd32a'; ctx.beginPath(); ctx.arc(x + w - 30, y + 22, 13, 0, Math.PI * 2); ctx.fill(); }
    // 地面と木
    const ground = { spring: '#a8e6a1', summer: '#7bd389', autumn: '#e3c48f', winter: '#f4f7fb' }[S.season];
    ctx.fillStyle = night ? '#2c3a5a' : ground; ctx.fillRect(x, y + h - 18, w, 18);
    const tree = { spring: '#ffb7d5', summer: '#3fbf5f', autumn: '#ff8c42', winter: '#dfe9f5' }[S.season];
    for (let i = 0; i < 3; i++) {
      const tx = x + 30 + i * (w / 3);
      ctx.fillStyle = '#8d6e63'; ctx.fillRect(tx - 3, y + h - 34, 6, 18);
      ctx.fillStyle = night ? '#3d4b6e' : tree; ctx.beginPath(); ctx.arc(tx, y + h - 40, 17, 0, Math.PI * 2); ctx.fill();
    }
    // 季節のパーティクル
    const pcol = { spring: '#ffc4dd', summer: null, autumn: '#ff9f43', winter: '#ffffff' }[S.season];
    if (pcol) {
      ctx.fillStyle = pcol;
      for (let i = 0; i < 10; i++) {
        const px = x + ((i * 47 + R.time * (15 + i * 3)) % w);
        const py = y + ((i * 31 + R.time * (20 + i * 2)) % h);
        ctx.beginPath(); ctx.arc(px, py, S.season === 'winter' ? 2.2 : 2.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; rr(x, y, w, h, 6); ctx.stroke();
    ctx.strokeStyle = '#d9c7a7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
  }

  // ---- 店内の家具 ----
  function drawShelf(s, p) {
    const { x, y, w } = s;
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(x + 6, y + 90, w, 10);
    ctx.fillStyle = '#eef2f7'; ctx.fillRect(x, y, w, 28);
    ctx.fillStyle = '#b8c7d9'; ctx.fillRect(x, y + 28, w, 62);
    ctx.fillStyle = '#9fb1c7'; ctx.fillRect(x, y + 58, w, 3); ctx.fillRect(x, y + 88, w, 2);
    if (p) {
      for (let row = 0; row < 2; row++) for (let i = 0; i < 4; i++) emojiO(p.icon, x + 22 + i * ((w - 44) / 3), y + 44 + row * 29, 20);
      ctx.fillStyle = '#fff'; rr(x + 8, y + 4, w - 16, 20, 6); ctx.fill();
      label(p.name.length > 9 ? p.name.slice(0, 9) + '…' : p.name, x + w / 2, y + 14, 12, '#333');
    } else {
      label('（空き棚）', x + w / 2, y + 58, 12, '#7f8c9d', 'normal');
    }
  }

  function drawLimited(p) {
    const { x, y } = LIMITED;
    ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 34, 78, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a93c'; ctx.fillRect(x - 74, y, 148, 28);
    ctx.beginPath(); ctx.ellipse(x, y + 28, 74, 18, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(x, y, 74, 22, 0, 0, Math.PI * 2); ctx.fill();
    if (p) {
      emojiO(p.icon, x - 30, y - 4, 26); emojiO(p.icon, x + 30, y - 4, 26); emojiO(p.icon, x, y - 10, 30);
      ctx.fillStyle = '#e74c3c'; rr(x - 32, y + 12, 64, 18, 8); ctx.fill();
      label('期間限定', x, y + 21, 11, '#fff');
    } else label('限定品なし', x, y, 12, '#9a7b2f', 'normal');
  }

  function drawCounter(st) {
    const { x, y, w } = COUNTER;
    ctx.fillStyle = '#f3e6cb'; ctx.fillRect(x, y, w, 30);
    ctx.fillStyle = '#d4b483'; ctx.fillRect(x, y + 30, w, 52);
    ctx.fillStyle = '#c4a26f'; ctx.fillRect(x, y + 30, w, 4);
    const regs = 1 + (st.facilities.register || 0);
    for (let i = 0; i < Math.min(regs, 4); i++) {
      const rx = x + 20 + i * ((w - 60) / Math.max(1, Math.min(regs, 4) - 1 || 1));
      ctx.fillStyle = '#4b5563'; rr(rx, y + 4, 34, 20, 4); ctx.fill();
      ctx.fillStyle = '#7bed9f'; ctx.fillRect(rx + 5, y + 7, 24, 7);
    }
    label('レジ', x + w / 2, y + 58, 14, '#7a5a2b');
  }

  function activeTags(st) {
    const S = CK.S, set = new Set();
    for (const e of st.effects) if (e.tag && e.until > S.abs) set.add(e.tag);
    if (S.abs - st.lastScandalAbs < 7) set.add('flame');
    return set;
  }

  function drawEntrance(st, tags) {
    ctx.fillStyle = '#b8c0c8'; ctx.fillRect(0, 468, W, 32);
    ctx.fillStyle = '#9aa4ae'; for (let x = 0; x < W; x += 40) ctx.fillRect(x, 468, 2, 32);
    ctx.fillStyle = '#566270'; ctx.fillRect(DOOR_X - 66, 462, 132, 8);
    ctx.fillStyle = 'rgba(207,232,255,.6)'; ctx.fillRect(DOOR_X - 62, 470, 60, 30); ctx.fillRect(DOOR_X + 2, 470, 60, 30);
    drawEffectsAt(tags, 498);
  }

  function drawEffectsAt(tags, baseY) {
    if (tags.has('dirty')) { emojiO('🗑️', DOOR_X - 110, baseY - 14, 24); emojiO('🥫', DOOR_X - 85, baseY - 6, 16); emojiO('🍌', DOOR_X + 95, baseY - 6, 16); }
    if (tags.has('yankee')) {
      const L = { shirt: '#2d3436', pants: '#2d3436', hair: '#f1c40f', style: 'pomp' };
      drawChibi(DOOR_X - 150, baseY + 4, L, 0, 0.9); drawChibi(DOOR_X + 150, baseY + 4, Object.assign({}, L, { hair: '#e17055' }), 0, 0.9);
      emoji('💢', DOOR_X - 135, baseY - 70, 16);
    }
    if (tags.has('streamer')) { drawChibi(DOOR_X + 200, baseY + 4, { shirt: '#fd79a8', pants: '#2d3436', hair: '#6c5ce7', style: 'cap', cap: '#000' }, 0, 0.9); emoji('📱', DOOR_X + 222, baseY - 40, 18); emoji('🔴', DOOR_X + 222, baseY - 64, 12); }
    if (tags.has('car')) emojiO('🚗', DOOR_X + 105, baseY - 14, 40);
    if (tags.has('phone')) emoji('☎️', COUNTER.x + COUNTER.w - 20, COUNTER.y - 30, 22);
  }

  function tint(t) {
    if (t >= 0.72) { ctx.fillStyle = 'rgba(25,35,90,0.16)'; ctx.fillRect(0, 0, W, H); }
    else if (t < 0.12) { ctx.fillStyle = 'rgba(255,170,80,0.07)'; ctx.fillRect(0, 0, W, H); }
    else if (t >= 0.6) { ctx.fillStyle = 'rgba(255,120,60,0.06)'; ctx.fillRect(0, 0, W, H); }
  }

  function drawPopups() {
    for (const p of R.popups) {
      ctx.globalAlpha = Math.min(1, p.t);
      ctx.font = `800 18px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = '#e67e22'; ctx.fillText(p.text, p.x, p.y);
      ctx.globalAlpha = 1;
    }
  }

  function drawStatusBadges(tags) {
    const list = [];
    if (tags.has('buzz')) list.push('✨ バズり中');
    if (tags.has('tv')) list.push('📺 テレビ効果');
    if (tags.has('campaign')) list.push('📣 キャンペーン中');
    if (tags.has('flame')) list.push('🔥 炎上中');
    if (tags.has('fake')) list.push('🎭 なりすまし被害');
    if (tags.has('rumor')) list.push('🗯️ 変なうわさ');
    let x = 12;
    for (const s of list) {
      ctx.font = `bold 13px ${FONT}`;
      const w = ctx.measureText(s).width + 18;
      ctx.fillStyle = s.includes('炎上') || s.includes('被害') || s.includes('うわさ') ? 'rgba(231,76,60,.9)' : 'rgba(46,174,109,.9)';
      rr(x, 10, w, 24, 12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, x + 9, 22);
      x += w + 6;
    }
  }

  function drawInside(S) {
    const st = S.stores[0];
    const t = S.weekT - Math.floor(S.weekT);
    // 壁
    ctx.fillStyle = '#f7efe2'; ctx.fillRect(0, 0, W, 120);
    drawWindow(28, 16, 240, 84, S, t); drawWindow(292, 16, 240, 84, S, t);
    // ポスター（今週のトレンド）
    ctx.fillStyle = '#fff'; rr(560, 18, 150, 82, 8); ctx.fill();
    ctx.strokeStyle = '#ff7a59'; ctx.lineWidth = 3; rr(560, 18, 150, 82, 8); ctx.stroke();
    label('今週のおすすめ', 635, 36, 12, '#ff7a59');
    label(S.weekTrend ? S.weekTrend.name : '', 635, 64, 15, '#333');
    // 時計
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(780, 58, 30, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9c7a7'; ctx.lineWidth = 4; ctx.stroke();
    const ang = t * Math.PI * 4 - Math.PI / 2;
    ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(780, 58); ctx.lineTo(780 + Math.cos(ang) * 18, 58 + Math.sin(ang) * 18); ctx.stroke();
    ctx.lineWidth = 2; const a2 = R.time * 2; ctx.beginPath(); ctx.moveTo(780, 58); ctx.lineTo(780 + Math.cos(a2) * 24, 58 + Math.sin(a2) * 24); ctx.stroke();
    ctx.fillStyle = '#d9c7a7'; ctx.fillRect(0, 112, W, 8);
    // 床
    for (let y = 120; y < 468; y += 35) for (let x = 0; x < W; x += 40) { ctx.fillStyle = ((x / 40 + (y - 120) / 35) % 2 === 0) ? '#f4f0e8' : '#ebe5d9'; ctx.fillRect(x, y, 40, 35); }
    // 棚
    const n = Math.max(CK.CFG.stdSlots, st.products.length);
    shelves(n).forEach((s, i) => drawShelf(s, st.products[i] ? CK.byId.product[st.products[i]] : null));
    drawLimited(st.limited ? CK.byId.product[st.limited] : null);
    // バイト（レジの後ろ）
    const counterStaff = [], floorStaff = [];
    st.staff.forEach((sf, i) => { if (i < 3) counterStaff.push({ sf, p: COUNTER_STAFF[i] }); else floorStaff.push({ sf, p: FLOOR_STAFF[(i - 3) % FLOOR_STAFF.length] }); });
    if (!st.staff.length) counterStaff.push({ sf: { uid: 0, job: 'basic', look: { hair: '#1d1d1d', style: 'short' } }, p: COUNTER_STAFF[0] });
    counterStaff.forEach((x) => drawStaff(x.sf, x.p[0], x.p[1]));
    drawCounter(st);
    // 手前のもの（y順）
    const ds = R.sprites.map((s) => ({ y: s.y, fn: () => { drawChibi(s.x, s.y, s.look, s.walk); } }))
      .concat(floorStaff.map((x) => ({ y: x.p[1], fn: () => drawStaff(x.sf, x.p[0], x.p[1]) })));
    ds.sort((a, b) => a.y - b.y).forEach((d) => d.fn());
    R.sprites.forEach(drawBubble);
    const tags = activeTags(st);
    drawEntrance(st, tags);
    drawPopups();
    tint(t);
    drawStatusBadges(tags);
  }

  function drawOutside(S) {
    const st = S.stores[1];
    const t = S.weekT - Math.floor(S.weekT);
    const [c1, c2] = skyColor(t);
    const g = ctx.createLinearGradient(0, 0, 0, 420); g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 430);
    const night = t >= 0.72;
    // 遠くのビル
    ctx.fillStyle = night ? '#2a3459' : '#c9d6e3';
    [[0, 160, 120], [110, 120, 90], [690, 140, 110], [790, 100, 100]].forEach(([x, y, w]) => ctx.fillRect(x, y, w, 430 - y));
    // 店舗
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(214, 100, 480, 310);
    ctx.fillStyle = '#fbfbfb'; ctx.fillRect(200, 90, 480, 320);
    ctx.fillStyle = '#e74c3c'; ctx.fillRect(200, 90, 480, 56);
    ctx.fillStyle = '#f39c12'; ctx.fillRect(200, 146, 480, 8);
    ctx.fillStyle = '#27ae60'; ctx.fillRect(200, 154, 480, 6);
    label(st.name, 440, 118, 28, '#fff', '800');
    // 窓
    const win = night ? '#ffe9a8' : '#cfe8ff';
    ctx.fillStyle = win; ctx.fillRect(220, 180, 170, 190); ctx.fillRect(490, 180, 170, 190);
    ctx.fillStyle = night ? 'rgba(160,120,60,.5)' : 'rgba(90,120,150,.35)';
    for (let i = 0; i < 3; i++) { ctx.fillRect(230, 220 + i * 50, 150, 8); ctx.fillRect(500, 220 + i * 50, 150, 8); }
    // ドア
    ctx.fillStyle = '#566270'; ctx.fillRect(398, 196, 84, 214);
    ctx.fillStyle = night ? '#fff2c4' : '#dff0ff'; ctx.fillRect(404, 202, 36, 204); ctx.fillRect(442, 202, 34, 204);
    // 歩道
    ctx.fillStyle = '#d2ccc1'; ctx.fillRect(0, 410, W, 90);
    ctx.fillStyle = '#bfb8ab'; for (let x = 0; x < W; x += 44) ctx.fillRect(x, 410, 2, 90);
    ctx.fillStyle = '#9e9789'; ctx.fillRect(0, 410, W, 4);
    // 人
    R.sprites.slice().sort((a, b) => a.y - b.y).forEach((s) => drawChibi(s.x, s.y, s.look, s.walk));
    R.sprites.forEach(drawBubble);
    const tags = activeTags(st);
    drawEffectsAt(tags, 470);
    if (tags.has('flame')) { for (let i = 0; i < 5; i++) emoji('🔥', 230 + i * 105, 84 + Math.sin(R.time * 6 + i) * 4, 30); }
    tint(t);
    drawStatusBadges(tags);
    label('※店の中は見えない', W - 90, H - 14, 12, 'rgba(60,60,60,.6)', 'normal');
  }

  function drawIdle() {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffe3b3'); g.addColorStop(1, '#fff7ec');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    emoji('🏪', W / 2 - 120, H / 2, 90); emoji('⚡', W / 2, H / 2, 60); emoji('🏬', W / 2 + 120, H / 2, 90);
  }

  R.draw = function (rdt, running) {
    const S = CK.S;
    R.time += rdt;
    const sdt = running ? rdt * S.speed : 0;
    updateSprites(sdt);
    if (!S || !S.stores || !S.monthTrend) { drawIdle(); return; }
    if (running) {
      R.revTimer -= rdt;
      if (R.revTimer <= 0) {
        R.revTimer = 0.7;
        if (R.revAcc > 0 && S.viewIdx === 0) R.popups.push({ x: COUNTER.x + rnd(50, COUNTER.w - 50), y: COUNTER.y - 20, text: '+¥' + Math.round(R.revAcc).toLocaleString(), t: 1.4 });
        R.revAcc = 0;
      }
      if (S.viewIdx === 1) {
        R.passTimer -= sdt;
        if (R.passTimer <= 0 && R.sprites.length < CK.CFG.maxSprites) { R.passTimer = rnd(0.6, 1.6); R.sprites.push(makePasser()); }
      }
    }
    for (const p of R.popups) { p.t -= rdt; p.y -= 26 * rdt; }
    R.popups = R.popups.filter((p) => p.t > 0);
    if (S.viewIdx === 0) drawInside(S); else drawOutside(S);
  };

  // 結果画面のグラフ
  R.drawChart = function (canvas, a, b, names) {
    const c = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height, pad = 80;
    c.clearRect(0, 0, w, h);
    const all = a.concat(b, [0]);
    const max = Math.max(...all), min = Math.min(...all);
    const span = max - min || 1;
    const X = (i) => pad + (i * (w - pad * 2)) / Math.max(1, a.length - 1);
    const Y = (v) => h - pad + 10 - ((v - min) / span) * (h - pad * 1.6);
    c.strokeStyle = '#ddd'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(pad, Y(0)); c.lineTo(w - pad, Y(0)); c.stroke();
    c.font = `12px ${FONT}`; c.fillStyle = '#888'; c.textAlign = 'right';
    c.fillText(CK.U.yen(max), pad - 4, Y(max) + 4); c.fillText(CK.U.yen(min), pad - 4, Y(min) + 4);
    c.textAlign = 'center';
    a.forEach((_, i) => c.fillText(`${i + 1}ヶ月`, X(i), h - 8));
    const line = (arr, col) => {
      c.strokeStyle = col; c.lineWidth = 3; c.beginPath();
      arr.forEach((v, i) => (i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v)))); c.stroke();
      c.fillStyle = col; arr.forEach((v, i) => { c.beginPath(); c.arc(X(i), Y(v), 4, 0, Math.PI * 2); c.fill(); });
    };
    line(b, '#e74c3c'); line(a, '#2e86de');
    c.textAlign = 'left'; c.font = `bold 13px ${FONT}`;
    c.fillStyle = '#2e86de'; c.fillText('● ' + names[0], pad, 18);
    c.fillStyle = '#e74c3c'; c.fillText('● ' + names[1], pad + 200, 18);
  };
})();

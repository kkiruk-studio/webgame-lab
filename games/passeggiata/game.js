/* Passeggiata — game.js
   상태·씬(강아지 선택/옷장/산책/결산/상점/엔딩 도감/엔딩)·입력·렌더 루프.
   저장은 PG.repo 로만. 렌더는 저해상도 캔버스 → 정수 배율로 화면 캔버스에 블릿. */
(function () {
  'use strict';
  const PG = window.PG, S = PG.SPR;
  const $ = (id) => document.getElementById(id);
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PORTRAIT = matchMedia('(orientation: portrait)');
  const ITEM = {}, NB = {}, BREED = {}, END = {}, FRAG = {};
  PG.ITEMS.forEach((i) => (ITEM[i.id] = i));
  PG.NEIGHBORS.forEach((n) => (NB[n.id] = n));
  PG.BREEDS.forEach((b) => (BREED[b.id] = b));
  PG.ENDINGS.forEach((e) => (END[e.id] = e));
  PG.FRAGMENTS.forEach((f) => (FRAG[f.id] = f));
  const DEBUG = (PG.debug = { timeScale: 1, autoTap: false });

  /* ---------------- 캔버스 ---------------- */
  const cv = $('game'), cx = cv.getContext('2d');
  const lo = S.mk(320, 180), lx = lo.getContext('2d');
  let LW = 320, LH = 180, SC = 1, OX = 0, OY = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr);
    cv.width = W; cv.height = H;
    SC = Math.max(1, Math.floor(H / 172));
    LW = Math.ceil(W / SC); LH = Math.ceil(H / SC);
    lo.width = LW; lo.height = LH;
    lx.imageSmoothingEnabled = false;
    OX = -Math.floor((LW * SC - W) / 2); OY = -Math.floor((LH * SC - H) / 2);
  }
  const lay = (H) => ({ yB: H - 42, yF: H - 13 });

  /* ---------------- 유틸 ---------------- */
  const rng = S.rng;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function josa(word, pair) {
    const ch = word.charCodeAt(word.length - 1);
    const has = ch >= 0xac00 && ch <= 0xd7a3 && (ch - 0xac00) % 28 > 0;
    const p = pair.split('/');
    return word + (has ? p[0] : p[1]);
  }
  function fillDog(t) {
    const n = st.dog.name;
    return t.replace('{dog}가', josa(n, '이/가')).replace(/\{dog\}/g, n);
  }
  let toastTimer = 0;
  function toast(msg, ms) {
    const el = $('toast');
    el.textContent = msg; el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), ms || 2400);
  }
  function starsHTML(n) { return '★'.repeat(n) + '<span class="off">' + '★'.repeat(5 - n) + '</span>'; }
  function heartsHTML(n) { const k = Math.min(n, 5); return '♥'.repeat(k) + '<span class="off">' + '♥'.repeat(5 - k) + '</span>'; }

  /* ---------------- 상태 ---------------- */
  let st = null;
  const save = () => PG.repo.save(st);
  Object.defineProperty(DEBUG, 'st', { get: () => st });
  DEBUG.dayInfo = (d) => dayInfo(d);

  function dayInfo(day) {
    const r = rng(day * 7349 + 11);
    const w = r();
    let weather = w < 0.5 ? 'sunny' : w < 0.78 ? 'cloudy' : 'rain';
    const ids = ['marta', 'enzo', 'sofia'];
    let featured = ids[Math.floor(r() * 3)];
    if (day === 1) { weather = 'sunny'; featured = 'marta'; }
    const others = ids.filter((i) => i !== featured);
    const second = others[Math.floor(r() * 2)];
    return { day, weather, featured, neighbors: r() < 0.5 ? [featured, second] : [second, featured], seed: day * 131 + 7 };
  }
  function eqItems(eq) { return PG.ALL_SLOTS.map((s) => eq[s]).filter(Boolean).map((id) => ITEM[id]); }
  function isFav(nid, eq) {
    const lk = NB[nid].likes;
    if (lk.type === 'color') return eqItems(eq).some((i) => i.color === lk.value);
    if (lk.type === 'slot') return !!eq[lk.value];
    if (lk.type === 'dog') return !!eq.dog;
    return false;
  }
  function outfitScore(eq, di) {
    let style = 0, weather = 0;
    eqItems(eq).forEach((i) => { style += i.style; weather += (i.weather && i.weather[di.weather]) || 0; });
    const fav = isFav(di.featured, eq) ? 3 : 0;
    const total = style + weather + fav;
    return { style, weather, fav, total, stars: clamp(1 + Math.floor((total - 3) / 3), 1, 5) };
  }

  /* ---------------- 월드 그리기 ---------------- */
  const SKY = {
    sunny: ['#9fc9e0', '#b4d5e4', '#cfe1e3', '#e6e7d8', '#f1e3c4'],
    cloudy: ['#aab4bc', '#b9c1c6', '#c8ccca', '#d6d5cc', '#e1dccd'],
    rain: ['#87929c', '#949ea6', '#a3aaae', '#b2b5b3', '#c1c0b8'],
    dusk: ['#5f6a86', '#7e7f92', '#a8918c', '#d1a585', '#e8be8a'],
  };
  function drawSky(ctx, W, H, weather) {
    const L = lay(H), cols = SKY[weather] || SKY.sunny, n = cols.length, bh = Math.ceil(L.yB / n);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = cols[i]; ctx.fillRect(0, i * bh, W, bh + 1);
      if (i > 0) { ctx.fillStyle = cols[i - 1]; for (let x = (i & 1); x < W; x += 2) ctx.fillRect(x, i * bh, 1, 1); }
    }
  }
  function drawClouds(ctx, W, H, camX, t, weather) {
    const cl = S.prop('cloud');
    const k = weather === 'sunny' ? 4 : 7;
    ctx.globalAlpha = weather === 'sunny' ? 1 : 0.85;
    for (let i = 0; i < k; i++) {
      const base = i * 97 + 20, y = 6 + ((i * 17) % 34);
      const drift = REDUCED ? 0 : t * (1.5 + (i % 3) * 0.4);
      const span = W + 80;
      const x = ((((base - camX * 0.06 - drift) % span) + span) % span) - 40;
      ctx.drawImage(cl, Math.round(x), y);
    }
    ctx.globalAlpha = 1;
  }
  function drawBuildings(ctx, W, H, camX, alley, segs) {
    if (!segs) return drawFacades(ctx, W, H, camX, alley);
    const L = lay(H);
    segs.forEach((s) => {
      const a = Math.max(0, s.x0 - camX), b = Math.min(W, s.x1 - camX);
      if (b <= a) return;
      ctx.save(); ctx.beginPath(); ctx.rect(a, 0, b - a, L.yB + 1); ctx.clip();
      const t = s.type || 'home';
      if (t === 'park') drawPark(ctx, W, H, camX); else drawFacades(ctx, W, H, camX, t === 'alley');
      ctx.restore();
    });
  }
  /* 공원길 배경: 나무 줄 + 산울타리 + 철제 울타리 */
  function drawPark(ctx, W, H, camX) {
    const L = lay(H), pf = REDUCED ? 0.8 : 0.45, bx = Math.floor(camX * pf), tree = S.prop('tree');
    ctx.fillStyle = '#a9bd7a'; ctx.fillRect(0, L.yB - 26, W, 26);
    const k0 = Math.floor(bx / 26) - 2, k1 = Math.floor((bx + W) / 26) + 2;
    for (let k = k0; k <= k1; k++) {
      const r = rng(k * 53 + 7), x = k * 26 - bx + Math.floor(r() * 10), y = L.yB - tree.height + 6 - Math.floor(r() * 12);
      ctx.drawImage(tree, x - 15, y);
    }
    const hx = ((bx % 6) + 6) % 6;
    ctx.fillStyle = '#566e2e'; ctx.fillRect(0, L.yB - 10, W, 10);
    ctx.fillStyle = '#6f8a3e'; for (let x = -hx - 6; x < W; x += 6) ctx.fillRect(x, L.yB - 12, 5, 3);
    const fx = Math.floor(camX * 0.8), fo = ((fx % 4) + 4) % 4;
    ctx.fillStyle = '#2f3333';
    ctx.fillRect(0, L.yB - 15, W, 1); ctx.fillRect(0, L.yB - 3, W, 1);
    for (let x = -fo; x < W; x += 4) ctx.fillRect(x, L.yB - 17, 1, 17);
  }
  function drawFacades(ctx, W, H, camX, alley) {
    const L = lay(H), pf = REDUCED ? 0.8 : 0.45, bx = Math.floor(camX * pf), BW = S.BW;
    const i0 = Math.floor(bx / BW) - 1, i1 = Math.floor((bx + W) / BW) + 1;
    for (let i = i0; i <= i1; i++) {
      const b = S.building(i, alley);
      ctx.drawImage(b, i * BW - bx, L.yB - b.height);
    }
  }
  const SWCACHE = {};
  function sidewalkTile(H) {
    if (SWCACHE[H]) return SWCACHE[H];
    const L = lay(H), h = H - L.yB, c = S.mk(32, h), x = c.getContext('2d'), r = rng(9);
    x.fillStyle = '#d9c7a3'; x.fillRect(0, 0, 32, h);
    x.fillStyle = '#b9a582'; x.fillRect(0, 0, 32, 2);
    x.fillStyle = '#c9b690';
    for (let i = 0; i < 40; i++) x.fillRect(Math.floor(r() * 32), 2 + Math.floor(r() * (h - 10)), 1, 1);
    x.fillStyle = '#c4b08a'; x.fillRect(0, 2, 1, L.yF - L.yB + 4); x.fillRect(16, 2, 1, L.yF - L.yB + 4);
    x.fillRect(0, Math.floor((L.yF - L.yB) / 2), 32, 1);
    const cy = L.yF - L.yB + 6;
    x.fillStyle = '#c2b391'; x.fillRect(0, cy, 32, 2);
    x.fillStyle = '#a89878'; x.fillRect(0, cy + 2, 32, 1);
    x.fillStyle = '#6d6a66'; x.fillRect(0, cy + 3, 32, h - cy - 3);
    x.fillStyle = '#7b7873'; for (let i = 0; i < 6; i++) x.fillRect(Math.floor(r() * 32), cy + 4 + Math.floor(r() * Math.max(1, h - cy - 5)), 1, 1);
    SWCACHE[H] = c;
    return c;
  }
  function drawSidewalk(ctx, W, H, camX) {
    const L = lay(H), t = sidewalkTile(H), off = -(((camX % 32) + 32) % 32);
    for (let x = off; x < W; x += 32) ctx.drawImage(t, x, L.yB);
  }
  function drawDeco(ctx, W, H, camX, seed, avoid) {
    const L = lay(H), k0 = Math.floor((camX - 40) / 64), k1 = Math.floor((camX + W + 40) / 64);
    const tree = S.prop('tree'), lamp = S.prop('lamp');
    for (let k = k0; k <= k1; k++) {
      const r = rng(k * 31 + seed * 7 + 3), v = r(), x = k * 64 + Math.floor(r() * 24);
      if (avoid.some((a) => Math.abs(a - x) < 38)) continue;
      const sx = x - camX;
      if (v < 0.42) ctx.drawImage(tree, sx - 15, L.yB + 9 - tree.height);
      else if (v < 0.72) ctx.drawImage(lamp, sx - 4, L.yB + 8 - lamp.height);
    }
  }
  function drawBase(ctx, W, H, camX, weather, o) {
    o = o || {};
    drawSky(ctx, W, H, o.sky || weather);
    drawClouds(ctx, W, H, camX, o.t || 0, weather);
    drawBuildings(ctx, W, H, camX, o.alley, o.segs);
    drawSidewalk(ctx, W, H, camX);
    const evs = o.events || [];
    const avoid = evs.map((e) => e.x).concat(o.door ? [o.door] : [], o.avoid || []);
    drawDeco(ctx, W, H, camX, o.seed || 1, avoid);
    const L = lay(H);
    if (o.door) { const d = S.prop('door'); ctx.drawImage(d, Math.round(o.door - camX) - 13, L.yB + 8 - d.height); }
    evs.forEach((e) => {
      const sx = Math.round(e.x - camX);
      if (sx < -60 || sx > W + 60) return;
      if (e.type === 'sniff') {
        const p = S.prop(e.prop);
        const base = e.prop === 'lamp' ? L.yF - 1 : L.yF - 3;
        ctx.drawImage(p, sx - (p.width >> 1), base - p.height + 1);
      } else if (e.type === 'nbr' && NB[e.id].prop) {
        const p = S.prop(NB[e.id].prop);
        ctx.drawImage(p, sx + 4, L.yB + 13 - p.height);
      }
    });
  }
  function drawNeighbor(ctx, H, id, sx, f) {
    const L = lay(H), n = S.nbr(id, f);
    ctx.drawImage(n, sx - (n.width >> 1), L.yF - 4 - n.height + 1);
    return { top: L.yF - 4 - n.height + 1 };
  }
  function drawGent(ctx, H, eq, sx, frame, o) {
    o = o || {};
    const L = lay(H), X = sx - 12, Y = L.yF - 50 + (o.dy || 0);
    const rainUmb = o.weather === 'rain' && eq.acc === 'acc_umbrella' && frame !== 6 && frame !== 7;
    const g = S.gent(eq, frame, { noAcc: rainUmb || o.noAcc, noHat: o.noHat });
    ctx.drawImage(g.c, X - g.ox, Y - g.oy);
    if (rainUmb) {
      const h = g.hand;
      ctx.fillStyle = '#2b211c'; ctx.fillRect(X + h[0] + 2, Y + 1, 1, h[1]);
      ctx.drawImage(S.prop('umbrella'), X + h[0] - 8, Y - 6);
    }
    return { X, Y, hand: [X + g.hand[0], Y + g.hand[1]] };
  }
  function drawDog(ctx, H, breed, sx, frame, item, flip) {
    const L = lay(H), d = S.dog(breed, frame, item);
    const x0 = sx - (d.w >> 1), y0 = L.yF - (d.h - 1);
    ctx.drawImage(flip ? flipCache(d) : d.c, x0 - 1, y0 - 1);
    const nx = flip ? x0 + (d.w - 1 - d.neck[0]) : x0 + d.neck[0];
    return { neck: [nx, y0 + d.neck[1]], top: y0 - 1 };
  }
  const FLIP = new Map();
  function flipCache(d) { let f = FLIP.get(d); if (!f) { f = S.flipH(d.c); FLIP.set(d, f); } return f; }
  function drawLeash(ctx, a, b, taut) {
    const sag = taut ? 0 : Math.min(7, Math.abs(b[0] - a[0]) * 0.25);
    const n = Math.max(8, Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]));
    ctx.fillStyle = '#3a2a20';
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + sag;
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const x = u * u * a[0] + 2 * u * t * mx + t * t * b[0];
      const y = u * u * a[1] + 2 * u * t * my + t * t * b[1];
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }
  function drawBubble(ctx, cxp, top, kind) {
    const b = S.prop('bubble');
    const x = Math.round(cxp - 4), y = top - b.height - 1;
    ctx.drawImage(b, x, y);
    if (kind === 'dots') ctx.drawImage(S.prop('dots'), x + 5, y + 4);
    else if (kind === 'h1') ctx.drawImage(S.prop('sheart'), x + 5, y + 3);
    else if (kind === 'h2') { ctx.drawImage(S.prop('sheart'), x + 2, y + 3); ctx.drawImage(S.prop('sheart'), x + 8, y + 3); }
    else if (kind === 'awk') { ctx.drawImage(S.prop('dots'), x + 2, y + 4); ctx.fillStyle = '#5f8fc4'; ctx.fillRect(x + 9, y + 1, 1, 1); ctx.fillRect(x + 8, y + 2, 3, 2); }
    else if (kind === 'bang') { ctx.fillStyle = '#c8452f'; ctx.fillRect(x + 6, y + 1, 1, 3); ctx.fillRect(x + 6, y + 5, 1, 1); }
  }
  function drawRoom(ctx, W, H, weather) {
    ctx.fillStyle = '#eadcbf'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e1cfab'; for (let x = 0; x < W; x += 8) ctx.fillRect(x, 0, 2, H);
    const fy = H - 20;
    ctx.fillStyle = '#8a5a36'; ctx.fillRect(0, fy - 30, W, 30);
    ctx.fillStyle = '#6b4227'; ctx.fillRect(0, fy - 31, W, 2);
    ctx.fillStyle = '#966540'; for (let x = 6; x < W; x += 40) ctx.fillRect(x, fy - 25, 32, 20);
    ctx.fillStyle = '#9a6a3e'; ctx.fillRect(0, fy, W, 20);
    ctx.fillStyle = '#7d5330'; for (let y = fy; y < H; y += 5) ctx.fillRect(0, y, W, 1);
    for (let y = fy, k = 0; y < H; y += 5, k++) for (let x = (k % 2) * 18; x < W; x += 36) ctx.fillRect(x, y, 1, 5);
    // 창
    const wx = Math.floor(W * 0.31), wy = 26;
    ctx.fillStyle = '#5f7a45'; ctx.fillRect(wx - 9, wy, 8, 52); ctx.fillRect(wx + 37, wy, 8, 52);
    ctx.fillStyle = '#4a6136'; for (let y = wy + 1; y < wy + 52; y += 3) { ctx.fillRect(wx - 9, y, 8, 1); ctx.fillRect(wx + 37, y, 8, 1); }
    ctx.fillStyle = '#f3ead6'; ctx.fillRect(wx - 1, wy - 1, 38, 54);
    const sky = (SKY[weather] || SKY.sunny);
    ctx.fillStyle = sky[1]; ctx.fillRect(wx + 2, wy + 2, 32, 24);
    ctx.fillStyle = sky[3]; ctx.fillRect(wx + 2, wy + 26, 32, 24);
    ctx.fillStyle = '#c96f45'; ctx.fillRect(wx + 2, wy + 36, 14, 14); ctx.fillStyle = '#d9a441'; ctx.fillRect(wx + 18, wy + 30, 16, 20);
    if (weather === 'rain') { ctx.fillStyle = '#e8eef2'; for (let i = 0; i < 14; i++) ctx.fillRect(wx + 3 + ((i * 7) % 30), wy + 3 + ((i * 11) % 44), 1, 3); }
    ctx.fillStyle = '#f3ead6'; ctx.fillRect(wx + 17, wy, 2, 52); ctx.fillRect(wx, wy + 25, 36, 2);
    ctx.fillStyle = '#d3c3a0'; ctx.fillRect(wx - 3, wy + 52, 42, 3);
    // 옷장(armadio)
    const ax = Math.max(4, Math.floor(W * 0.02)), ah = 108;
    ctx.fillStyle = '#5e3e25'; ctx.fillRect(ax, fy - ah, 46, ah);
    ctx.fillStyle = '#74502c'; ctx.fillRect(ax + 2, fy - ah + 8, 20, ah - 12); ctx.fillRect(ax + 24, fy - ah + 8, 20, ah - 12);
    ctx.fillStyle = '#86603a'; ctx.fillRect(ax + 5, fy - ah + 12, 14, 40); ctx.fillRect(ax + 27, fy - ah + 12, 14, 40);
    ctx.fillRect(ax + 5, fy - ah + 58, 14, 36); ctx.fillRect(ax + 27, fy - ah + 58, 14, 36);
    ctx.fillStyle = '#4a3020'; ctx.fillRect(ax - 2, fy - ah - 3, 50, 5);
    ctx.fillStyle = '#d9b45a'; ctx.fillRect(ax + 20, fy - ah / 2, 1, 4); ctx.fillRect(ax + 25, fy - ah / 2, 1, 4);
    // 러그
    ctx.fillStyle = '#8c3b2a'; ctx.fillRect(Math.floor(W * 0.11), H - 16, Math.floor(W * 0.27), 6);
    ctx.fillStyle = '#d9a441'; ctx.fillRect(Math.floor(W * 0.11) + 2, H - 14, Math.floor(W * 0.27) - 4, 1);
  }

  /* ---------------- 오늘의 한 컷 ---------------- */
  function cropShot(src, gxS) {
    const w = Math.min(256, src.width), h = Math.min(144, src.height);
    const x0 = clamp(gxS - 80, 0, src.width - w), y0 = Math.max(0, src.height - h - 4);
    const c = S.mk(w, h);
    c.getContext('2d').drawImage(src, -x0, -y0);
    return c;
  }
  function loadImg(url) { return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = url; }); }
  async function makeCard(shotURL, lw) {
    const img = await loadImg(shotURL);
    const K = 3, bw = 7, bb = 20;
    const iw = img ? img.width : 256, ih = img ? img.height : 144;
    const c = S.mk((iw + bw * 2) * K, (ih + bw + bb) * K), x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.fillStyle = '#f4ead5'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#2b211c'; x.fillRect(0, 0, c.width, K); x.fillRect(0, c.height - K, c.width, K); x.fillRect(0, 0, K, c.height); x.fillRect(c.width - K, 0, K, c.height);
    x.fillStyle = '#cdbb97'; x.fillRect((bw - 2) * K, (bw - 2) * K, (iw + 4) * K, (ih + 4) * K);
    x.fillStyle = '#2b211c'; x.fillRect((bw - 1) * K, (bw - 1) * K, (iw + 2) * K, (ih + 2) * K);
    if (img) x.drawImage(img, bw * K, bw * K, iw * K, ih * K);
    const ty = (ih + bw + bb / 2 + 1) * K;
    x.fillStyle = '#2b211c';
    x.font = '700 ' + 9 * K / 1.5 * 1.1 + 'px -apple-system,"Apple SD Gothic Neo",sans-serif';
    x.textBaseline = 'middle';
    x.fillText('Day ' + lw.day + ' · ' + PG.WEATHER[lw.weather].label + ' · ' + st.dog.name + '와 산책', bw * K, ty);
    x.font = 'italic 700 ' + 9 * K / 1.5 * 1.1 + 'px Georgia,serif';
    x.textAlign = 'right'; x.fillStyle = '#94451f';
    x.fillText('Passeggiata', c.width - bw * K, ty);
    return c;
  }

  /* ---------------- 엔딩 컷 ---------------- */
  function endingArt(id, sil) {
    const W = 256, H = 144, c = S.mk(W, H), bg = c.getContext('2d'), L = lay(H);
    const ac = S.mk(W, H), x = ac.getContext('2d');
    const eq = st.equipped, breed = st.dog.breed;
    if (id === 'clock') {
      drawBase(bg, W, H, 40, 'sunny', { seed: 3, avoid: [110, 150, 185, 215] });
      [['marta', 150], ['enzo', 182], ['sofia', 212]].forEach((p) => {
        const r = drawNeighbor(x, H, p[0], p[1], 0);
        x.drawImage(S.prop('sheart'), p[1] - 2, r.top - 7);
      });
      const g = drawGent(x, H, eq, 70, eq.hat ? 7 : 4);
      const d = drawDog(x, H, breed, 108, 'w0', eq.dog);
      drawLeash(x, [g.hand[0] + 1, g.hand[1] + 1], d.neck);
    } else if (id === 'blue') {
      drawBase(bg, W, H, 300, 'sunny', { seed: 5, avoid: [150, 175], events: [{ type: 'nbr', id: 'marta', x: 452 }] });
      drawNeighbor(x, H, 'marta', 152, 0);
      const bq = S.prop('bouquet');
      x.drawImage(bq, 136, L.yF - 34);
      const g = drawGent(x, H, eq, 108, eq.hat ? 7 : 4);
      const d = drawDog(x, H, breed, 70, 'w0', eq.dog);
      drawLeash(x, [g.hand[0] + 1, g.hand[1] + 1], d.neck);
    } else {
      drawBase(bg, W, H, 900, 'cloudy', { sky: 'dusk', alley: true, seed: 8, avoid: [110, 150] });
      const lamp = S.prop('lamp');
      bg.drawImage(lamp, 70, L.yB + 8 - lamp.height);
      const X = 120 - 12, Y = L.yF - 50;
      x.drawImage(S.prop('bench'), X + 6 - 1, Y + 27 - 1);
      const g = drawGent(x, H, eq, 120, 6, { noHat: true });
      if (eq.hat) { const h = S.hatAlone(eq.hat); if (h) x.drawImage(h, X + 5 - 1, Y + 32 - 1); }
      const d = drawDog(x, H, breed, 150, 'w0', eq.dog, true);
      drawLeash(x, [g.hand[0] + 1, g.hand[1] + 1], d.neck);
      bg.fillStyle = 'rgba(241,217,138,0.10)'; bg.fillRect(0, 0, W, H);
    }
    if (sil) { bg.fillStyle = 'rgba(233,220,192,0.72)'; bg.fillRect(0, 0, W, H); bg.drawImage(S.silhouette(ac, '#4a3a2e'), 0, 0); }
    else bg.drawImage(ac, 0, 0);
    return c;
  }

  /* ---------------- 씬 관리 ---------------- */
  const scenes = {};
  let scene = null, sceneName = '';
  function go(name, arg) {
    if (scene && scene.exit) scene.exit();
    sceneName = name; scene = scenes[name];
    document.body.dataset.scene = name;
    clearTimeout(toastTimer); $('toast').classList.remove('on');
    document.querySelectorAll('.ui').forEach((el) => (el.hidden = el.dataset.scene !== name));
    $('hud').hidden = !['wardrobe', 'walk', 'result', 'shop', 'endings'].includes(name);
    $('bookBtn').hidden = name === 'walk' || name === 'endings';
    $('timewrap').hidden = name !== 'walk';
    $('moodChip').hidden = name !== 'walk';
    $('gearMenu').hidden = true;
    if (scene.enter) scene.enter(arg || {});
    updateHUD();
  }
  DEBUG.go = (n, a) => go(n, a);
  DEBUG.scene = () => sceneName;
  function updateHUD() {
    if (!st) return;
    const d = sceneName === 'result' && st.lastWalk ? st.lastWalk.day : st.day;
    $('hudDay').textContent = 'Day ' + d;
    $('hudCoins').textContent = st.coins;
  }

  /* ---------- 1. 강아지 선택 ---------- */
  scenes.dog = {
    enter() {
      this.sel = 'dachshund'; this.t = 0;
      const box = $('dogCards'); box.innerHTML = '';
      this.cvs = {};
      PG.BREEDS.forEach((b) => {
        const el = document.createElement('button');
        el.className = 'dogcard'; el.dataset.id = b.id;
        const c = document.createElement('canvas'); c.className = 'px'; c.width = 26; c.height = 20;
        c.style.width = '104px'; c.style.height = '80px'; c.style.margin = '0 auto';
        el.appendChild(c);
        el.insertAdjacentHTML('beforeend', '<b>' + b.name + '</b><span>' + b.desc + ' · ' + b.defaultName + '</span>');
        el.addEventListener('click', () => this.pick(b.id));
        box.appendChild(el); this.cvs[b.id] = c;
      });
      this.pick('dachshund');
    },
    pick(id) {
      this.sel = id;
      document.querySelectorAll('.dogcard').forEach((e) => e.classList.toggle('on', e.dataset.id === id));
      $('dogName').placeholder = BREED[id].defaultName;
    },
    update(dt) { this.t += dt; },
    render(ctx) {
      const camX = Math.floor(this.t * 14);
      drawBase(ctx, LW, LH, camX, 'sunny', { t: this.t, seed: 2 });
      const gx = Math.round(LW * 0.18);
      const f = Math.floor(this.t / 0.16) % 4;
      const g = drawGent(ctx, LH, { shirt: 'shirt_white', pants: 'pants_grey', shoes: 'shoes_brown', hat: 'hat_borsalino' }, gx, f);
      const d = drawDog(ctx, LH, this.sel, gx + 30, 'w' + (Math.floor(this.t / 0.12) % 4));
      drawLeash(ctx, [g.hand[0] + 1, g.hand[1] + 1], d.neck);
      ctx.fillStyle = 'rgba(43,33,28,0.35)'; ctx.fillRect(0, 0, LW, LH);
      PG.BREEDS.forEach((b) => {
        const c = this.cvs[b.id], x = c.getContext('2d');
        x.clearRect(0, 0, c.width, c.height);
        const fr = b.id === this.sel ? 'w' + (Math.floor(this.t / 0.12) % 4) : 'w0';
        const dd = S.dog(b.id, fr);
        x.drawImage(dd.c, (c.width - dd.c.width) >> 1, c.height - dd.c.height);
      });
    },
  };
  $('dogStart').addEventListener('click', async () => {
    const sel = scenes.dog.sel;
    const name = ($('dogName').value || '').trim() || BREED[sel].defaultName;
    st = PG.newSave(sel, name);
    await save();
    go('wardrobe');
  });

  /* ---------- 2. 옷장 ---------- */
  const TABS = PG.ALL_SLOTS;
  scenes.wardrobe = {
    tab: 'hat',
    enter() { this.t = 0; this.di = dayInfo(st.day); this.build(); },
    build() {
      const di = this.di, sc = outfitScore(st.equipped, di);
      $('wIcon').src = S.iconURL(di.weather === 'sunny' ? 'sun' : di.weather === 'cloudy' ? 'cloudi' : 'rain');
      $('wWeather').textContent = 'Day ' + st.day + ' · ' + PG.WEATHER[di.weather].label;
      $('wStars').innerHTML = starsHTML(sc.stars);
      const wtip = di.weather === 'rain' ? ' 비 오는 날엔 우산·코트가 좋아요.' : di.weather === 'cloudy' ? ' 흐린 날엔 코트가 어울려요.' : '';
      $('wHint').textContent = '오늘의 힌트 · ' + fillDog(NB[di.featured].hint) + wtip;
      const tabs = $('wTabs'); tabs.innerHTML = '';
      TABS.forEach((s) => {
        const b = document.createElement('button');
        b.className = 'tab' + (s === this.tab ? ' on' : ''); b.textContent = PG.SLOT_LABEL[s];
        b.addEventListener('click', () => { this.tab = s; this.build(); });
        tabs.appendChild(b);
      });
      const grid = $('wGrid'); grid.innerHTML = '';
      const slot = this.tab;
      if (!PG.REQUIRED_SLOTS.includes(slot)) {
        const n = document.createElement('button');
        n.className = 'cell none' + (!st.equipped[slot] ? ' on' : ''); n.textContent = '없음';
        n.addEventListener('click', () => { delete st.equipped[slot]; save(); this.build(); });
        grid.appendChild(n);
      }
      const owned = st.owned.filter((id) => ITEM[id] && ITEM[id].slot === slot);
      owned.forEach((id) => {
        const it = ITEM[id], on = st.equipped[slot] === id;
        const b = document.createElement('button');
        b.className = 'cell' + (on ? ' on' : '');
        b.innerHTML = '<img src="' + iconFor(id) + '" alt="">' + it.name + (on ? '<span class="tag">착용</span>' : '');
        b.addEventListener('click', () => { st.equipped[slot] = id; save(); this.build(); $('wDesc').textContent = it.desc || ''; });
        grid.appendChild(b);
      });
      if (!owned.length) {
        const p = document.createElement('div');
        p.className = 'cell none'; p.style.gridColumn = 'span 2'; p.textContent = '상점에서 살 수 있어요';
        grid.appendChild(p);
      }
      $('wDesc').textContent = '코디 점수 ' + sc.total + ' (스타일 ' + sc.style + ' · 날씨 ' + sc.weather + ' · 취향 ' + sc.fav + ')';
    },
    update(dt) { this.t += dt; },
    render(ctx) {
      drawRoom(ctx, LW, LH, this.di.weather);
      const big = this.big || (this.big = S.mk(80, 64)), bx = big.getContext("2d");
      bx.clearRect(0, 0, 80, 64);
      const tmpH = 64, f = Math.floor(this.t / 0.9) % 2 ? 5 : 4;
      drawGent(bx, tmpH, st.equipped, 20, f);
      const dogF = Math.floor(this.t / 1.6) % 4 === 3 ? 'w2' : 'w0';
      drawDog(bx, tmpH, st.dog.breed, 50, dogF, st.equipped.dog);
      const gx = Math.floor(LW * 0.16) - 40;
      ctx.drawImage(big, gx, LH - 14 - (lay(tmpH).yF) * 2, 160, 128);
    },
  };
  const ICONS = {};
  function iconFor(id) { const k = id + st.dog.breed; return ICONS[k] || (ICONS[k] = S.itemIconURL(id, st.dog.breed)); }
  $('wShop').addEventListener('click', () => go('shop'));
  $('wGo').addEventListener('click', () => go('walk'));
  $('gearBtn').addEventListener('click', () => { $('gearMenu').hidden = !$('gearMenu').hidden; });
  $('tCoins').addEventListener('click', async () => { st.coins += 200; await save(); updateHUD(); toast('테스트: 코인 +200'); });
  $('tBoost').addEventListener('click', async () => {
    Object.keys(st.affinity).forEach((k) => (st.affinity[k] += 2));
    st.dogFree += 2; st.blueGreetDays += 1;
    await save(); toast('테스트: 호감 +2 · 발견 +2 · 파란 인사 +1');
  });
  $('tReset').addEventListener('click', async () => {
    if (!confirm('진행을 모두 초기화할까요?')) return;
    await PG.repo.reset(); st = null; location.hash = ''; go('dog');
  });

  /* ---------- 3. 산책 ---------- */
  const SPEED = 26, DUR = 72, LEN = SPEED * DUR;
  const SEG_X = [0, 560, 1120];                 // 세그먼트 시작 gx (0=집앞, 1·2=갈림길에서 고름)
  const ROUTE = { home: '집앞', park: '공원길', cafe: '카페 거리', alley: '뒷골목' };
  const GEST = { hat: '모자 인사', bow: '목례', talk: '대화', wave: '손 인사' };
  const NBR_IN = 90, NBR_OUT = 20;              // 인사 프롬프트 구간: gx ∈ [e.x-90, e.x-20]
  const ZONE_A = 58, ZONE_B = 34;               // 스윗존(눈 맞춤): gx ∈ [e.x-58, e.x-34]
  const MOOD_HELD = 2.5, MOOD_FREE = 1.5, MOOD_SNIFF = 12;
  function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function makeWalk() {
    const di = dayInfo(st.day);
    const m = typeof st.dogMood === 'number' ? st.dogMood : 60;
    const w = { di, t: 0, gx: 0, mode: 'walk', mt: 0, anim: 0, dogOff: 30, dogAnim: 0, dogState: 'walk', dogT: 0,
      events: [], hazards: [], coins: [], sparks: [], splash: [], earned: 0, findCoins: 0, aff: { marta: 0, enzo: 0, sofia: 0 }, greets: [],
      dogFreeGain: 0, frags: [], blue: false, featuredFav: false, shot: null, shotScore: -1, wantShot: 0, cur: null,
      door: 0, fade: 0, done: false, rain: [], held: false, holdT: 0, mood: st.day > 1 ? Math.min(100, m + 10) : m,
      dirt: 0, route: ['home'], dogBubble: null, hintT: 0, moodCells: -1, gest: null, greetDur: 2, promptAt: 0,
      segs: [{ x0: 0, x1: SEG_X[1], type: 'home' }, { x0: SEG_X[1], x1: SEG_X[2], type: null }, { x0: SEG_X[2], x1: LEN + 800, type: null }],
      forks: [], nbrPool: [] };
    // 이웃: 집앞=오늘의 주인공, 나머지 둘은 고른 경로(카페·뒷골목)에서 만날 수 있음
    w.nbrPool = [di.featured].concat(shuffle(['marta', 'enzo', 'sofia'].filter((id) => id !== di.featured), rng(di.seed + 313)));
    // 갈림길 제시: 두 갈림길 합쳐 세 타입이 모두 한 번 이상 보이게
    const kinds = shuffle(['park', 'cafe', 'alley'], rng(di.seed + 991)), r2 = rng(di.seed + 557);
    const other = kinds[r2() < 0.5 ? 0 : 1];
    const f2 = r2() < 0.5 ? [kinds[2], other] : [other, kinds[2]];
    w.forks = [{ x: SEG_X[1], si: 1, opts: [kinds[0], kinds[1]], done: false }, { x: SEG_X[2], si: 2, opts: f2, done: false }];
    buildSeg(w, 0, 'home');
    if (di.weather === 'rain') for (let i = 0; i < 80; i++) w.rain.push({ x: Math.random() * 600, y: Math.random() * 200, s: 140 + Math.random() * 60 });
    return w;
  }
  /* 세그먼트 si 의 이벤트·위험물·코인을 경로 타입에 맞춰 생성 */
  function buildSeg(w, si, type) {
    const x0 = w.segs[si].x0, x1 = si < 2 ? w.segs[si].x1 : LEN;
    const r = rng(w.di.seed * 13 + si * 101 + type.charCodeAt(0) * 7);
    const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
    let nN, nS, nH;
    if (type === 'home') { nN = 1; nS = 1; nH = 1; }
    else if (type === 'park') { nN = 0; nS = 2; nH = 1; }
    else if (type === 'cafe') { nN = ri(1, 2); nS = ri(0, 1); nH = 0; }
    else { nN = ri(0, 1); nS = 1; nH = 1; }
    const items = [];
    for (let k = 0; k < nN && w.nbrPool.length; k++) items.push({ k: 'n', id: w.nbrPool.shift() });
    for (let k = 0; k < nS; k++) items.push({ k: 's' });
    for (let k = 0; k < nH; k++) items.push({ k: 'h', h: (type === 'home' && w.di.day === 1) || r() < 0.5 ? 'puddle' : 'pigeon' });
    if (w.di.weather === 'rain' && type !== 'home') items.push({ k: 'h', h: 'puddle' });
    shuffle(items, r);
    if (type === 'home') items.sort((a, b) => (a.k === 'h' ? 0 : 1) - (b.k === 'h' ? 0 : 1)); // 집앞은 위험물부터(연습)
    const start = x0 + (si === 0 ? 150 : 100), span = x1 - 50 - start, n = items.length;
    const sprops = type === 'park' ? ['bush', 'fountain'] : type === 'alley' ? ['lamp', 'bush'] : ['bush', 'lamp', 'fountain'];
    items.forEach((it, i) => {
      const x = Math.round(start + (span * (i + 0.5)) / n + r() * 24 - 12);
      if (it.k === 'n') w.events.push({ type: 'nbr', id: it.id, x, done: false, bubble: 'dots', bt: 0 });
      else if (it.k === 's') w.events.push({ type: 'sniff', prop: sprops[Math.floor(r() * sprops.length)], x, done: false, rich: type === 'alley' });
      else w.hazards.push(makeHazard(it.h, x, r));
    });
    w.events.sort((a, b) => a.x - b.x);
    const mult = type === 'alley' ? 1.6 : 1;
    for (let x = x0 + (si === 0 ? 70 : 30); x < x1 - 10; x += 26 + Math.floor(r() * 22)) {
      if (w.events.some((e) => e.type === 'nbr' && x > e.x - 60 && x < e.x + 20)) continue;
      if (w.hazards.some((h) => Math.abs(h.x - x) < 10)) continue;
      const v = r() < 0.75 ? 1 : r() < 0.7 ? 2 : 3;
      w.coins.push({ x, v: Math.max(1, Math.round(v * mult)), taken: false });
    }
  }
  function makeHazard(kind, x, r) {
    const h = { kind, x, done: false, hit: false, fly: false };
    if (kind === 'pigeon') {
      h.birds = [];
      const n = 2 + (r() < 0.5 ? 1 : 0);
      for (let i = 0; i < n; i++) h.birds.push({ dx: i * 7 - 6 + Math.floor(r() * 3), dy: 0, vx: 0, vy: 0, ph: Math.floor(r() * 6) });
    }
    return h;
  }
  function birdsFly(h, k) { h.fly = true; h.birds.forEach((b, i) => { b.vx = (25 + i * 12) * k; b.vy = -(35 + i * 10) * k; }); }
  function accident(w, h) {
    h.hit = true; w.dirt += 1;
    const bump = 2 + Math.floor(Math.random() * 3); w.findCoins += bump;
    if (h.kind === 'puddle') {
      for (let i = 0; i < 12; i++) w.splash.push({ x: h.x + Math.random() * 10 - 5, y: 0, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 45, life: 0.7 });
      toast('첨벙! 바지에 흙탕물 · 그래도 동전 하나 +' + bump, 1800);
    } else {
      birdsFly(h, 1.8);
      w.dogState = 'chase'; w.dogT = 1.2;
      toast('푸드덕! ' + josa(st.dog.name, '이/가') + ' 비둘기를 쫓아갔다 · 옷이 흐트러졌다 · 동전 하나 +' + bump, 1900);
    }
  }
  function showPrompt(text, sub, kind) {
    $('promptText').textContent = text;
    $('promptSub').textContent = sub || ''; $('promptSub').hidden = !sub;
    $('promptBar').hidden = !kind || kind === 'none';
    $('pbFill').hidden = kind !== 'fill';
    $('pbZone').hidden = $('pbMark').hidden = kind !== 'timing';
    if (kind === 'timing') {
      const span = NBR_IN - NBR_OUT;
      $('pbZone').style.left = ((NBR_IN - ZONE_A) / span) * 100 + '%';
      $('pbZone').style.width = ((ZONE_A - ZONE_B) / span) * 100 + '%';
    }
    setBar(kind, kind === 'fill' ? 100 : 0);
    $('prompt').hidden = false;
  }
  function setBar(kind, pct) { if (kind === 'fill') $('pbFill').style.width = pct + '%'; else if (kind === 'timing') $('pbMark').style.left = pct + '%'; }
  function hidePrompt() { $('prompt').hidden = true; }
  function showNbrPrompt(e) {
    const n = NB[e.id], known = st.gestKnown && st.gestKnown[e.id];
    const lab = (g, pre) => pre + GEST[g] + (known && n.gesture === g ? '★' : '');
    showPrompt(n.name + ' · 눈 맞춤 구간에서',
      lab(st.equipped.hat ? 'hat' : 'wave', '↑') + '  ' + lab('bow', '↓') + '  ' + lab('talk', '⏺길게 '), 'timing');
  }
  function stepWalk(w, dt) {
    if (w.done) return;
    w.t += dt;
    let moving = false;
    const next = w.events.find((e) => !e.done);
    switch (w.mode) {
      case 'walk': {
        w.gx += SPEED * dt; moving = true;
        const fk = w.forks.find((f) => !f.done && w.gx >= f.x);
        if (fk) {
          w.gx = fk.x; w.mode = 'fork'; w.cur = fk; w.mt = 0; moving = false;
          showPrompt('↑ ' + ROUTE[fk.opts[0]] + '   ↓ ' + ROUTE[fk.opts[1]], '갈림길 · 위·아래로 밀어서 고르기', 'fill');
        } else if (next && next.type === 'sniff' && w.gx + w.dogOff >= next.x - 6) {
          if (w.held || w.dogState === 'chase') { next.done = true; next.missed = true; w.dogBubble = { k: 'dots', t: 1.2 }; }
          else { w.mode = 'sniff'; w.cur = next; w.mt = 0; w.dogState = 'sniff'; }
        } else if (next && next.type === 'nbr' && w.gx >= next.x - NBR_IN) {
          w.mode = 'nbrPrompt'; w.cur = next; w.mt = 0; w.promptAt = performance.now(); showNbrPrompt(next);
        }
        break;
      }
      case 'fork':
        w.mt += dt;
        setBar('fill', clamp(100 - (w.mt / 4) * 100, 0, 100));
        if (w.mt >= 4) chooseRoute(w, 0);
        break;
      case 'sniff':
        w.mt += dt; w.dogOff = Math.max(8, w.cur.x - 6 - w.gx);
        if (w.mt >= 1.6) resolveSniff(w);
        break;
      case 'nbrPrompt': {
        w.gx += SPEED * dt; moving = true; w.mt += dt;
        const e = w.cur;
        setBar('timing', clamp(((w.gx - (e.x - NBR_IN)) / (NBR_IN - NBR_OUT)) * 100, 0, 100));
        if (w.gx >= e.x - NBR_OUT) { e.done = true; w.mode = 'walk'; hidePrompt(); }
        break;
      }
      case 'greet':
        w.mt += dt;
        if (w.mt > 0.6 && w.mt - dt <= 0.6) w.wantShot = w.cur.perfect || w.cur.fav ? 3 : 2;
        if (w.mt >= w.greetDur) { w.cur.done = true; w.mode = 'walk'; }
        break;
      case 'home':
        w.mt += dt; w.fade = clamp((w.mt - 0.6) / 0.8, 0, 1);
        if (w.mt >= 1.5) { w.done = true; finishWalk(w); return; }
        break;
    }
    if (w.mode !== 'home' && w.gx >= LEN) { w.mode = 'home'; w.mt = 0; hidePrompt(); moving = false; }
    if (!w.door && w.gx >= LEN - 4.5 * SPEED) w.door = LEN + 22;
    if (w.gx > LEN * 0.3 && w.shotScore < 1 && !w.wantShot && w.mode === 'walk') w.wantShot = 1;
    w.moving = moving;
    if (moving) w.anim += dt;
    // 줄 · 강아지 기분
    if (w.held) w.holdT += dt;
    if (w.mode !== 'home') {
      if (w.held) { if (w.holdT > 1) w.mood -= MOOD_HELD * dt; } else w.mood += MOOD_FREE * dt;
      w.mood = clamp(w.mood, 0, 100);
    }
    // 강아지
    if (w.dogT > 0) { w.dogT -= dt; if (w.dogT <= 0 && w.dogState !== 'sniff') w.dogState = 'walk'; }
    if (w.mode !== 'sniff') {
      let target;
      if (w.dogState === 'chase') target = 80;
      else if (w.mode === 'greet') target = 18;
      else if (w.held) target = 14;
      else target = 34 + (REDUCED ? 0 : Math.sin(w.t * 2.2) * 3);
      const prev = w.dogOff, rate = w.dogState === 'chase' ? 90 : Math.abs(target - w.dogOff) > 24 ? 45 : 22;
      w.dogOff += clamp(target - w.dogOff, -rate * dt, rate * dt);
      w.dogMoving = moving || Math.abs(prev - w.dogOff) > 0.01;
    } else w.dogMoving = false;
    if (w.dogMoving) w.dogAnim += dt * (w.dogState === 'chase' ? 1.8 : 1);
    if (w.dogBubble) { w.dogBubble.t -= dt; if (w.dogBubble.t <= 0) w.dogBubble = null; }
    // 위험물 (강아지가 닿는 순간 판정: 줄을 당기고 있으면 피함)
    const dogX = w.gx + w.dogOff;
    w.hazards.forEach((h) => {
      if (h.birds && h.fly) h.birds.forEach((b) => { b.vy -= 40 * dt; b.dx += b.vx * dt; b.dy += b.vy * dt; });
      if (h.done || dogX < h.x - 4) return;
      h.done = true;
      if (w.held) { if (h.birds) birdsFly(h, 0.8); w.sparks.push({ x: h.x, life: 0.4, v: 0 }); }
      else accident(w, h);
    });
    w.splash.forEach((s) => { s.vy += 170 * dt; s.x += s.vx * dt; s.y = Math.min(0, s.y + s.vy * dt); s.life -= dt; });
    w.splash = w.splash.filter((s) => s.life > 0);
    // 코인
    w.coins.forEach((c) => {
      if (!c.taken && w.gx + 4 >= c.x) { c.taken = true; w.earned += c.v; w.sparks.push({ x: c.x, life: 0.5, v: c.v }); }
    });
    w.sparks.forEach((s) => (s.life -= dt));
    w.sparks = w.sparks.filter((s) => s.life > 0);
    w.events.forEach((e) => { if (e.bt > 0) e.bt -= dt; });
    if (w.rain.length) w.rain.forEach((d) => { d.y += d.s * dt; d.x -= 30 * dt; if (d.y > LH) { d.y = -4; d.x = Math.random() * (LW + 40); } if (d.x < -4) d.x += LW + 20; });
    $('timebar').style.width = clamp((1 - w.gx / LEN) * 100, 0, 100) + '%';
    $('timebar').classList.toggle('low', w.gx > LEN - 10 * SPEED);
    $('hudCoins').textContent = st.coins + w.earned + w.findCoins;
    const cells = Math.ceil(w.mood / 25 - 1e-9);
    if (cells !== w.moodCells) { w.moodCells = cells; document.querySelectorAll('#moodBar i').forEach((el, i) => el.classList.toggle('on', i < cells)); }
    $('moodChip').classList.toggle('low', w.mood < 25);
    if (w.hintT > 0) { w.hintT -= dt; if (w.hintT <= 0 && w.mode === 'walk') hidePrompt(); }
    if (DEBUG.autoTap) {
      w.held = false;
      if (w.mode === 'fork') chooseRoute(w, 0);
      else if (w.mode === 'nbrPrompt' && w.gx >= w.cur.x - ZONE_A) walkGesture(w, NB[w.cur.id].gesture);
    }
  }
  function chooseRoute(w, idx) {
    if (!w || w.mode !== 'fork') return;
    const f = w.cur, type = f.opts[idx] || f.opts[0];
    f.done = true; f.pick = type; w.segs[f.si].type = type; w.route.push(type);
    buildSeg(w, f.si, type);
    w.mode = 'walk'; w.cur = null; hidePrompt();
    toast('→ ' + ROUTE[type], 1400);
  }
  function walkGesture(w, g) {
    if (!w || w.mode !== 'nbrPrompt') return;
    if (g === 'hat' && !st.equipped.hat) g = 'wave';
    const e = w.cur;
    hidePrompt();
    startGreet(w, g, w.gx >= e.x - ZONE_A && w.gx <= e.x - ZONE_B);
  }
  function startGreet(w, g, inZone) {
    const e = w.cur, n = NB[e.id], fav = isFav(e.id, st.equipped);
    const perfect = inZone && g === n.gesture;
    let gain = inZone ? (perfect ? 2 : 1) + (fav ? 1 : 0) : 0;
    let dogFx = null;
    if (w.mood < 25) { gain = Math.max(0, gain - 1); dogFx = 'bark'; }
    else if (w.mood >= 85 && inZone) { gain += e.id === 'sofia' ? 2 : 1; dogFx = 'trick'; }
    w.mode = 'greet'; w.mt = 0; w.gest = g; w.greetDur = g === 'talk' ? 4.5 : 2;
    e.fav = fav; e.perfect = perfect;
    w.aff[e.id] += gain;
    w.greets.push({ id: e.id, fav, gain, gesture: g, perfect });
    if (e.id === 'marta' && eqItems(st.equipped).some((i) => i.color === 'blue')) w.blue = true;
    if (e.id === w.di.featured && fav) w.featuredFav = true;
    e.bubble = !inZone ? 'awk' : gain >= 2 ? 'h2' : gain >= 1 ? 'h1' : 'dots'; e.bt = w.greetDur + 0.6;
    if (dogFx === 'bark') w.dogBubble = { k: 'bang', t: 1.6 };
    else if (dogFx === 'trick') { w.dogState = 'trick'; w.dogT = 1.2; }
    const hearts = gain ? ' ' + '♥'.repeat(gain) : '';
    const dogNote = dogFx === 'bark' ? ' · ' + josa(st.dog.name, '이/가') + ' 짖었다' : dogFx === 'trick' ? ' · ' + josa(st.dog.name, '이/가') + ' 재주를 부렸다' : '';
    if (!inZone) { toast(n.name + ' · 어색… 눈 맞춤 구간을 놓쳤다' + hearts + dogNote, 2400); return; }
    if (perfect && !(st.gestKnown && st.gestKnown[e.id])) {
      st.gestKnown = st.gestKnown || {}; st.gestKnown[e.id] = true;
      toast('완벽한 인사! ' + josa(n.name, '은/는') + ' ' + josa(GEST[g], '을/를') + ' 좋아한다' + hearts + dogNote, 3000);
      return;
    }
    const lines = fav ? n.favLines : n.lines;
    const line = fillDog(lines[Math.floor(Math.random() * lines.length)]);
    toast(n.name + ' · “' + line + '”' + hearts + (perfect ? ' · 완벽한 인사!' : '') + dogNote, 2800);
  }
  function resolveSniff(w) {
    const rich = !!w.cur.rich;
    w.cur.done = true; w.mode = 'walk'; w.dogState = 'walk';
    w.dogFreeGain += 1;
    w.mood = clamp(w.mood + MOOD_SNIFF, 0, 100);
    const total = st.dogFree + w.dogFreeGain;
    const frag = PG.FRAGMENTS.find((f) => f.source === 'dog' && !st.unlockedFragments.includes(f.id) && !w.frags.includes(f.id) && total >= f.cond.min);
    if (frag && Math.random() < (rich ? 0.95 : 0.75)) { w.frags.push(frag.id); toast(frag.text, 3400); }
    else if (Math.random() < (rich ? 0.9 : 0.6)) { const v = (rich ? 6 : 4) + Math.floor(Math.random() * (rich ? 7 : 5)); w.findCoins += v; toast('강아지의 발견: 코인 뭉치 +' + v); }
    else toast(josa(st.dog.name, '이/가') + ' 만족스럽게 킁킁거렸다.');
  }
  function walkTap() {
    const w = scenes.walk.w;
    if (!w || w.done) return;
    if (w.mode === 'walk') w.smile = 0.6;
  }
  function walkSwipe(dir) {
    const w = scenes.walk.w;
    if (!w || w.done) return;
    if (w.mode === 'fork') chooseRoute(w, dir === 'up' ? 0 : 1);
    else if (w.mode === 'nbrPrompt') walkGesture(w, dir === 'up' ? 'hat' : 'bow');
  }
  function setHeld(w, v) { if (!w) return; if (v && !w.held) w.holdT = 0; w.held = v; }
  DEBUG.tap = walkTap;
  DEBUG.swipe = walkSwipe;
  DEBUG.hold = (v) => setHeld(scenes.walk.w, !!v);
  DEBUG.gesture = (g) => walkGesture(scenes.walk.w, g);
  Object.defineProperty(DEBUG, 'w', { get: () => scenes.walk.w });
  const inp = { down: false, id: null, x0: 0, y0: 0, t0: 0, swiped: false, consumed: false };
  scenes.walk = {
    enter() {
      inp.down = false;
      this.w = makeWalk(); hidePrompt();
      if (st.day === 1) { showPrompt('누르고 있으면 줄 당기기 · 떼면 자유롭게', '', 'none'); this.w.hintT = 4; }
      this.render(lx);
    },
    exit() { hidePrompt(); inp.down = false; },
    update(dt) {
      const w = this.w;
      if (inp.down && !inp.swiped && !inp.consumed && w.mode === 'nbrPrompt' && inp.t0 >= w.promptAt && performance.now() - inp.t0 >= 700) {
        inp.consumed = true; setHeld(w, false); walkGesture(w, 'talk');
      }
      let left = dt * (DEBUG.timeScale || 1);
      while (left > 0 && !w.done) { const s = Math.min(left, 1 / 30); stepWalk(w, s); left -= s; }
      if (w.smile) w.smile = Math.max(0, w.smile - dt);
    },
    render(ctx) { if (this.w) drawWalk(ctx, this.w); },
  };
  function drawWalk(ctx, w) {
    const W = LW, H = LH, L = lay(H), gxS = Math.round(W * 0.3), camX = Math.floor(w.gx) - gxS;
    const weather = w.di.weather;
    drawBase(ctx, W, H, camX, weather, { t: w.t, events: w.events, seed: w.di.seed, door: w.door, segs: w.segs,
      avoid: w.forks.map((f) => f.x + 24).concat(w.hazards.map((h) => h.x)) });
    // 갈림길 표지판
    const sign = S.prop('sign');
    w.forks.forEach((f) => {
      const sx = Math.round(f.x + 24 - camX);
      if (sx > -20 && sx < W + 20) ctx.drawImage(sign, sx - (sign.width >> 1), L.yB + 8 - sign.height);
    });
    // 위험물
    w.hazards.forEach((h) => {
      const sx = Math.round(h.x - camX);
      if (sx < -60 || sx > W + 60) return;
      if (h.kind === 'puddle') { const p = S.prop('puddle'); ctx.drawImage(p, sx - (p.width >> 1), L.yF - 2); return; }
      h.birds.forEach((b, i) => {
        const by = Math.round(L.yF - 6 + b.dy);
        if (by < -12) return;
        const fr = h.fly ? (Math.floor(w.t * 10 + i) % 2 ? 'pigeon1' : 'pigeon0') : 'pigeon0';
        const peck = !h.fly && !REDUCED && Math.floor(w.t * 2 + b.ph) % 3 === 0 ? 1 : 0;
        const im = S.prop(fr);
        ctx.drawImage(im, Math.round(sx + b.dx) - (im.width >> 1), by + peck);
      });
    });
    w.events.forEach((e) => {
      if (e.type !== 'nbr') return;
      const sx = Math.round(e.x - camX);
      if (sx < -30 || sx > W + 30) return;
      const r = drawNeighbor(ctx, H, e.id, sx, Math.floor(w.t * 1.4 + e.x) % 2);
      if (e.bt > 0) drawBubble(ctx, sx, r.top, e.bubble);
      else if (!e.done && w.gx > e.x - 130 && w.cur !== e) drawBubble(ctx, sx, r.top, 'dots');
      else if (!e.done && w.cur === e && w.mode !== 'greet') drawBubble(ctx, sx, r.top, 'dots');
    });
    // 냄새 지점: 아직 안 맡은 곳은 냄새 표시(놓아줄지 판단할 수 있게)
    w.events.forEach((e) => {
      if (e.type !== 'sniff') return;
      const active = w.mode === 'sniff' && w.cur === e;
      if (e.done && !active) return;
      const sx = Math.round(e.x - camX);
      if (sx < -10 || sx > W + 10) return;
      ctx.drawImage(S.prop('scent'), sx - 2, L.yF - 30 - (Math.floor(w.t * 3) % 2));
    });
    const bob = REDUCED ? 0 : 1;
    w.coins.forEach((c) => {
      if (c.taken) return;
      const sx = Math.round(c.x - camX);
      if (sx < -6 || sx > W + 6) return;
      const fr = ['coin0', 'coin0', 'coin0', 'coin1', 'coin2', 'coin1'][Math.floor(w.t * 7 + c.x * 0.1) % 6];
      const im = S.prop(fr);
      ctx.drawImage(im, sx - (im.width >> 1), L.yF - 16 - (bob && Math.floor(w.t * 2 + c.x) % 2));
      if (c.v > 1) ctx.drawImage(im, sx - (im.width >> 1) + 3, L.yF - 21);
    });
    // 신사 프레임
    let f, gdy = 0;
    if (w.moving) f = Math.floor(w.anim / 0.16) % 4;
    else if (w.mode === 'greet') {
      const m = w.mt, g = w.gest;
      if (g === 'hat') f = m > 0.3 && m < 1.6 ? 7 : 4;
      else if (g === 'wave') f = m > 0.3 && m < 0.9 ? 7 : 4;
      else if (g === 'bow') { f = 4; if (m > 0.2 && m < 1.4) gdy = 2; }
      else f = Math.floor(m / 0.35) % 2 ? 5 : 4;
    } else f = Math.floor(w.t / 0.9) % 2 ? 5 : 4;
    const dsx = Math.round(w.gx + w.dogOff - camX);
    let dfr, flip = false;
    if (w.dogState === 'sniff') dfr = 'sniff';
    else dfr = (w.dogState === 'sulk' ? 'k' : 'w') + (w.dogMoving ? Math.floor(w.dogAnim / 0.11) % 4 : 0);
    if (w.dogState === 'sniff' && Math.floor(w.mt * 4) % 2) dfr = 'w0';
    if (w.dogState === 'trick') { flip = Math.floor(w.dogT / 0.15) % 2 === 1; dfr = 'w' + (Math.floor(w.dogT / 0.08) % 4); }
    const d = drawDog(ctx, H, st.dog.breed, dsx, dfr, st.equipped.dog, flip);
    const g = drawGent(ctx, H, st.equipped, gxS, f, { weather, dy: gdy });
    drawLeash(ctx, [g.hand[0] + 1, g.hand[1] + 1], d.neck, w.held || w.dogState === 'chase');
    if (w.dogBubble) drawBubble(ctx, dsx, d.top, w.dogBubble.k);
    if (w.dogState === 'trick') ctx.drawImage(S.prop('spark'), dsx - 2, d.top - 6 - (Math.floor(w.dogT * 8) % 2));
    if (w.smile > 0) ctx.drawImage(S.prop('spark'), gxS + 6, L.yF - 54);
    w.sparks.forEach((s) => {
      const sx = Math.round(s.x - camX), up = Math.round((0.5 - s.life) * 24);
      ctx.drawImage(S.prop('spark'), sx - 2, L.yF - 20 - up);
    });
    if (w.splash.length) {
      ctx.fillStyle = '#8a7a5c';
      w.splash.forEach((s) => ctx.fillRect(Math.round(s.x - camX), Math.round(L.yF - 1 + s.y), 1, 1));
    }
    if (w.rain.length) {
      ctx.fillStyle = 'rgba(60,70,90,0.12)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(214,226,236,0.75)';
      w.rain.forEach((r) => ctx.fillRect(Math.round(r.x), Math.round(r.y), 1, 3));
    }
    if (w.wantShot) {
      if (w.wantShot > w.shotScore) { w.shot = cropShot(lo, gxS); w.shotScore = w.wantShot; }
      w.wantShot = 0;
    }
    if (w.fade > 0) { ctx.fillStyle = 'rgba(43,33,28,' + w.fade + ')'; ctx.fillRect(0, 0, W, H); }
  }

  /* ---------- 결산 계산 ---------- */
  function finishWalk(w) {
    const di = w.di, sc = outfitScore(st.equipped, di);
    const stars = Math.max(1, sc.stars - Math.min(w.dirt, 2));
    const bonus = stars * 2 + (w.featuredFav ? 5 : 0);
    const total = w.earned + w.findCoins + bonus;
    st.coins += total;
    Object.keys(w.aff).forEach((k) => (st.affinity[k] += w.aff[k]));
    st.dogFree += w.dogFreeGain;
    if (w.blue) st.blueGreetDays += 1;
    st.dogMood = clamp(Math.round(w.mood), 0, 100);
    w.route.slice(1).forEach((t) => {
      st.routeCounts[t] = (st.routeCounts[t] || 0) + 1;
      if (t === 'alley' && di.weather === 'rain') st.alleyRain = (st.alleyRain || 0) + 1;
    });
    st.day += 1;
    const newFr = w.frags.slice();
    w.frags.forEach((id) => st.unlockedFragments.push(id));
    PG.FRAGMENTS.forEach((f) => {
      if (f.source === 'dog' || st.unlockedFragments.includes(f.id)) return;
      if (PG.evalCond(f.cond, st)) { st.unlockedFragments.push(f.id); newFr.push(f.id); }
    });
    let diary;
    if (newFr.length) diary = FRAG[newFr[newFr.length - 1]].text;
    else diary = PG.DAILY_LINES[(di.day * 5 + w.greets.length) % PG.DAILY_LINES.length];
    if (!st.pendingEnding) {
      const e = PG.ENDINGS.find((x) => !st.endingsSeen.includes(x.id) && PG.evalCond(x.cond, st));
      if (e) { st.endingsSeen.push(e.id); st.pendingEnding = e.id; }
    }
    if (!w.shot) w.shot = cropShot(lo, Math.round(LW * 0.3));
    st.lastWalk = {
      day: di.day, weather: di.weather, stars, dirt: Math.min(w.dirt, 2), route: w.route.slice(), mood: st.dogMood,
      coins: { pick: w.earned, find: w.findCoins, bonus, total },
      aff: w.aff, greets: w.greets, dogFree: w.dogFreeGain, diary, newFrags: newFr,
      shot: w.shot.toDataURL('image/png'),
    };
    save().then(() => go('result'));
  }
  /* 해시로 결산을 바로 열 때: 산책을 자동 시뮬레이션 (갈림길=첫 번째, 인사=스윗존에서 선호 제스처, 줄=free) */
  function simulateWalk() {
    const w = makeWalk(); scenes.walk.w = w;
    const was = DEBUG.autoTap; DEBUG.autoTap = true;
    let guard = 0;
    while (!w.done && guard++ < 9000) {
      if (w.mode === 'home' && w.mt + 1 / 30 >= 1.5) break;
      stepWalk(w, 1 / 30);
      if (w.wantShot || guard % 30 === 0) drawWalk(lx, w);
    }
    DEBUG.autoTap = was;
    hidePrompt();
    return w;
  }

  /* ---------- 4. 결산 ---------- */
  let cardCanvas = null;
  scenes.result = {
    enter() {
      const lw = st.lastWalk;
      if (!lw) { go('wardrobe'); return; }
      $('rTitle').textContent = 'Day ' + lw.day + ' 귀가 · ' + PG.WEATHER[lw.weather].label;
      $('rPick').textContent = '+' + lw.coins.pick;
      $('rFind').textContent = '+' + lw.coins.find;
      $('rBonus').textContent = '+' + lw.coins.bonus;
      $('rStars').innerHTML = starsHTML(lw.stars);
      $('rTotal').textContent = '+' + lw.coins.total;
      $('rDirtRow').hidden = !lw.dirt;
      $('rDirt').textContent = '−' + (lw.dirt || 0) + '★';
      $('rRouteRow').hidden = !lw.route;
      $('rRoute').textContent = (lw.route || []).map((t) => ROUTE[t] || t).join(' → ');
      $('rMoodRow').hidden = typeof lw.mood !== 'number';
      if (typeof lw.mood === 'number') { const c = Math.ceil(lw.mood / 25 - 1e-9); $('rMood').textContent = '🐾 ' + '■'.repeat(c) + '□'.repeat(4 - c); }
      $('rNbrs').innerHTML = PG.NEIGHBORS.map((n) => {
        const g = lw.aff[n.id] || 0;
        return '<div class="row"><span>' + n.name + ' <small style="color:var(--muted)">' + n.role + '</small></span><span><span class="hearts">' +
          heartsHTML(st.affinity[n.id]) + '</span> ' + (g ? '<span class="plus">+' + g + '</span>' : '<span style="color:var(--muted)">·</span>') +
          ((lw.greets || []).some((x) => x.id === n.id && x.perfect) ? '<span class="badge">완벽 인사</span>' : '') + '</span></div>';
      }).join('');
      $('rDiary').textContent = '일기 · ' + lw.diary;
      $('rShot').removeAttribute('src');
      cardCanvas = null;
      makeCard(lw.shot, lw).then((c) => { cardCanvas = c; $('rShot').src = c.toDataURL('image/png'); });
      $('rNext').textContent = st.pendingEnding ? '…그날 저녁' : '내일 산책';
    },
    update() {},
    render(ctx) { drawRoom(ctx, LW, LH, st.lastWalk ? st.lastWalk.weather : 'sunny'); },
  };
  function proceed(dest) {
    if (st.pendingEnding) go('ending', { id: st.pendingEnding, then: dest });
    else go(dest);
  }
  $('rShop').addEventListener('click', () => proceed('shop'));
  $('rNext').addEventListener('click', () => proceed('wardrobe'));
  $('rShare').addEventListener('click', () => {
    if (!cardCanvas) return;
    const lw = st.lastWalk, fname = 'passeggiata-day' + lw.day + '.png';
    cardCanvas.toBlob(async (blob) => {
      try {
        const file = new File([blob], fname, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Passeggiata', text: 'Day ' + lw.day + ' · 오늘의 한 컷' });
          return;
        }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = fname;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('이미지를 저장했어요');
    }, 'image/png');
  });

  /* ---------- 5. 상점 ---------- */
  scenes.shop = {
    enter() { this.build(); },
    build() {
      const grid = $('sGrid'); grid.innerHTML = '';
      PG.ITEMS.filter((i) => !i.starter).forEach((it) => {
        const owned = st.owned.includes(it.id), on = st.equipped[it.slot] === it.id;
        const b = document.createElement('button');
        b.className = 'cell' + (on ? ' on' : '');
        const tail = on ? '<span class="tag">착용 중</span>' : owned ? '<span class="tag" style="background:var(--muted)">보유</span>' : '';
        b.innerHTML = '<img src="' + iconFor(it.id) + '" alt="">' + it.name + '<br><span class="st">' + '★'.repeat(it.style) + '</span> ' +
          (owned ? '' : '<span class="price">' + it.price + '</span>') + tail;
        b.addEventListener('click', () => this.buy(it));
        grid.appendChild(b);
      });
    },
    async buy(it) {
      $('sDesc').textContent = PG.SLOT_LABEL[it.slot] + ' · ' + it.name + ' — ' + (it.desc || '');
      if (st.owned.includes(it.id)) { st.equipped[it.slot] = it.id; await save(); this.build(); toast(it.name + ' 착용'); return; }
      if (st.coins < it.price) { toast('코인이 ' + (it.price - st.coins) + ' 부족해요'); return; }
      st.coins -= it.price; st.owned.push(it.id); st.equipped[it.slot] = it.id;
      await save(); updateHUD(); this.build();
      toast('구매 완료 · ' + it.name + '을(를) 옷장에 넣고 입었어요');
    },
    update() {},
    render(ctx) { drawRoom(ctx, LW, LH, 'sunny'); ctx.fillStyle = 'rgba(43,33,28,0.25)'; ctx.fillRect(0, 0, LW, LH); },
  };
  $('sBack').addEventListener('click', () => go('wardrobe'));

  /* ---------- 6. 엔딩 도감 ---------- */
  scenes.endings = {
    enter(arg) {
      this.back = arg.back && arg.back !== 'endings' && arg.back !== 'ending' ? arg.back : (this.back || 'wardrobe');
      if (this.back === 'walk' || this.back === 'dog') this.back = 'wardrobe';
      const box = $('eCards'); box.innerHTML = '';
      PG.ENDINGS.forEach((e) => {
        const un = st.endingsSeen.includes(e.id);
        const pic = endingArt(e.id, !un);
        const el = document.createElement('div');
        el.className = 'ecard' + (un ? '' : ' locked');
        el.innerHTML = '<img src="' + S.toURL(pic, 2) + '" alt=""><b>' + (un ? e.title : '???') + '</b><p>' + (un ? e.card : '잠김 · ' + e.hint) + '</p>';
        if (un) {
          const b = document.createElement('button'); b.className = 'btn small'; b.textContent = '다시 보기';
          b.addEventListener('click', () => go('ending', { id: e.id, then: 'endings', replay: true }));
          el.appendChild(b);
        }
        box.appendChild(el);
      });
      $('eCount').textContent = st.endingsSeen.length + '/' + PG.ENDINGS.length + ' · 일기 조각 ' + st.unlockedFragments.length + '/' + PG.FRAGMENTS.length;
    },
    update() {},
    render(ctx) { drawRoom(ctx, LW, LH, 'sunny'); ctx.fillStyle = 'rgba(43,33,28,0.25)'; ctx.fillRect(0, 0, LW, LH); },
  };
  $('bookBtn').addEventListener('click', () => go('endings', { back: sceneName }));
  $('eBack').addEventListener('click', () => go(scenes.endings.back || 'wardrobe'));

  /* ---------- 7. 엔딩 씬 ---------- */
  scenes.ending = {
    enter(arg) {
      this.e = END[arg.id]; this.then = arg.then || 'wardrobe'; this.replay = !!arg.replay;
      this.li = 0; this.ci = 0; this.t = 0; this.finished = false;
      $('eTitle').textContent = '— ' + this.e.title + ' —';
      $('eArt').src = S.toURL(endingArt(this.e.id), 3);
      $('eText').textContent = '';
    },
    update(dt) {
      if (this.finished) return;
      this.t += dt;
      const line = this.e.lines[this.li];
      const want = Math.floor(this.t * 26);
      if (this.ci < line.length && want > this.ci) { this.ci = Math.min(line.length, want); $('eText').textContent = line.slice(0, this.ci); }
    },
    tap() {
      const line = this.e.lines[this.li];
      if (this.ci < line.length) { this.ci = line.length; $('eText').textContent = line; return; }
      if (this.li < this.e.lines.length - 1) { this.li++; this.ci = 0; this.t = 0; $('eText').textContent = ''; return; }
      if (this.finished) return;
      this.finished = true;
      const done = () => go(this.then);
      if (!this.replay) {
        st.pendingEnding = null;
        save().then(() => { done(); toast('엔딩 도감에 「' + this.e.title + '」가 기록되었어요', 2600); });
      } else done();
    },
    render(ctx) { ctx.fillStyle = '#0d0b0a'; ctx.fillRect(0, 0, LW, LH); },
  };
  $('ui-ending').addEventListener('pointerdown', (e) => { e.preventDefault(); scenes.ending.tap(); });

  /* ---------------- 입력 ---------------- */
  // 산책: 누르고 있기=줄 당기기, 스와이프(24px↑)=위/아래 선택·인사, 짧은 탭=미소, 인사 구간 0.7초 홀드=대화
  window.addEventListener('pointerdown', (e) => {
    if (sceneName !== 'walk') return;
    if (e.target.closest && e.target.closest('button')) return;
    const w = scenes.walk.w;
    if (!w || w.done) return;
    Object.assign(inp, { down: true, id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), swiped: false, consumed: false });
    setHeld(w, true);
  });
  window.addEventListener('pointermove', (e) => {
    if (!inp.down || e.pointerId !== inp.id || sceneName !== 'walk') return;
    const dx = e.clientX - inp.x0, dy = e.clientY - inp.y0;
    if (inp.swiped || inp.consumed || Math.hypot(dx, dy) < 24) return;
    inp.swiped = true;
    setHeld(scenes.walk.w, false);
    walkSwipe(dy < 0 ? 'up' : 'down');
  });
  const pointerEnd = (e) => {
    if (!inp.down || e.pointerId !== inp.id) return;
    inp.down = false;
    if (sceneName !== 'walk') return;
    if (e.type === 'pointerup' && !inp.swiped && !inp.consumed && performance.now() - inp.t0 < 250) walkTap();
    setHeld(scenes.walk.w, false);
  };
  window.addEventListener('pointerup', pointerEnd);
  window.addEventListener('pointercancel', pointerEnd);
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());

  /* ---------------- 루프 ---------------- */
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (scene && !PORTRAIT.matches && !document.hidden) {
      if (scene.update) scene.update(dt);
      lx.setTransform(1, 0, 0, 1, 0, 0);
      if (scene.render) scene.render(lx);
      cx.imageSmoothingEnabled = false;
      cx.drawImage(lo, 0, 0, LW, LH, OX, OY, LW * SC, LH * SC);
    }
    requestAnimationFrame(loop);
  }

  /* ---------------- 부팅 / 해시 라우팅 ---------------- */
  async function boot() {
    S.bake();
    resize();
    window.addEventListener('resize', resize);
    $('hudCoinImg').src = S.iconURL('coinicon');
    $('bookImg').src = S.iconURL('book');
    st = PG.migrate(await PG.repo.load());
    route();
    window.addEventListener('hashchange', route);
    requestAnimationFrame(loop);
  }
  async function route() {
    const h = location.hash.replace('#', '');
    if (h && h !== 'dog' && !st) {
      st = PG.newSave('dachshund', 'Bruno'); st.coins = 150;
      await save();
    }
    if (h === 'dog') go('dog');
    else if (h === 'wardrobe') go('wardrobe');
    else if (h === 'walk') go('walk');
    else if (h === 'shop') go('shop');
    else if (h === 'endings') go('endings', { back: 'wardrobe' });
    else if (h.indexOf('ending-') === 0 && END[h.slice(7)]) go('ending', { id: h.slice(7), then: 'endings', replay: true });
    else if (h === 'result') {
      if (!st.lastWalk) { go('walk'); const w = simulateWalk(); w.done = true; finishWalk(w); }
      else go('result');
    } else if (!st) go('dog');
    else if (st.pendingEnding && st.lastWalk) go('result');
    else go('wardrobe');
  }
  boot();
})();

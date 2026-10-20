/* Passeggiata — sprites.js
   픽셀 데이터: 문자열 배열(한 글자 = 1px, '.' = 투명) + 팔레트 맵.
   로드 시 bake() 가 오프스크린 캔버스로 한 번 굽는다. 그리기는 전부 drawImage.
   신사 = 의미 문자 마스터 그리드(프레임별) → 슬롯별 레이어 시트로 분해 → 아이템 팔레트로 칠함. */
(function () {
  'use strict';
  const PG = (window.PG = window.PG || {});
  const S = (PG.SPR = {});
  const OUT = '#2b211c';

  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').imageSmoothingEnabled = false;
    return c;
  }
  function rng(seed) {
    let a = seed >>> 0 || 1;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function paint(ctx, rows, pal, ox, oy) {
    ox = ox || 0; oy = oy || 0;
    for (let y = 0; y < rows.length; y++) {
      const r = rows[y];
      for (let x = 0; x < r.length; x++) {
        const col = pal[r[x]];
        if (!col) continue;
        ctx.fillStyle = col; ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    }
  }
  function bakeRows(rows, pal) {
    const w = Math.max.apply(null, rows.map((r) => r.length));
    const c = mk(w, rows.length);
    paint(c.getContext('2d'), rows, pal);
    return c;
  }
  function outline(src, color) {
    const c = mk(src.width + 2, src.height + 2), x = c.getContext('2d');
    [[0, 1], [2, 1], [1, 0], [1, 2]].forEach((d) => x.drawImage(src, d[0], d[1]));
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color || OUT; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-over';
    x.drawImage(src, 1, 1);
    return c;
  }
  function flipH(src) {
    const c = mk(src.width, src.height), x = c.getContext('2d');
    x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
    return c;
  }
  function silhouette(src, color) {
    const c = mk(src.width, src.height), x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  S.mk = mk; S.rng = rng; S.paint = paint; S.outline = outline; S.flipH = flipH; S.silhouette = silhouette;

  /* ================= 신사 (24×52, 오른쪽을 봄) =================
     의미 문자: H/G 은발(밝/어두) S 피부 z 귀 E 눈 m 콧수염
     C 칼라 T 몸통 A 가까운 소매 a 먼 소매 K/k 손
     L/l 가까운/먼 다리 B 벨트 F/f 구두 q 밑창 */
  const HEAD = [
    '..GHHHG..',
    '.HHHGHHH.',
    'HHGHHHHS.',
    'HGHHSSGS.',
    'GHHzSSESS',
    'HHHzSSSSS',
    '.GHSSSmm.',
    '..GSSSSS.',
    '...SSSS..',
  ];
  const NECK = ['...SS....'];
  const TORSO = ['..CCCC.', '.TTTTTT'].concat(Array(12).fill('TTTTTTT'));
  const rep = (s, n) => Array(n).fill(s);
  const ARM = {
    STR: rep('...AA', 11).concat(['...KK', '...KK']),
    BACK: rep('...AA', 4).concat(rep('..AA.', 4), rep('.AA..', 3), ['KK...', 'KK...']),
    FWD: rep('....AA...', 4).concat(rep('.....AA..', 4), rep('......AA.', 3), ['.......KK', '.......KK']),
    UP: ['........KK.', '........KK.'].concat(rep('........AA.', 7),
      ['.......AAA.', '......AAA..', '.....AAA...', '....AAA....', '...AAA.....', '...AA......']),
  };
  const ARM_Y = { STR: 16, BACK: 16, FWD: 16, UP: 2 };
  const LEG = {
    A: ['....BBBBBBB...', '....LLLLLLL...'].concat(rep('....lllLLL....', 5), rep('...lll..LLL...', 5),
      rep('..lll....LLL..', 5), rep('.lll......LLL.', 3), ['.ffff.....FFFF', '.qqqq.....qqqq', '..............']),
    B: ['....BBBBBBB...', '....LLLLLLL...'].concat(rep('....lllLLL....', 10), rep('...lll.LLL....', 5),
      rep('..lll..LLL....', 2), ['..ff...LLL....', '..qq...LLL....', '.......FFFF...', '.......qqqq...']),
    C: ['....BBBBBBB...', '....LLLLLLL...'].concat(rep('....LLLlll....', 5), rep('...LLL..lll...', 5),
      rep('..LLL....lll..', 5), rep('.LLL......lll.', 3), ['.FFFF.....ffff', '.qqqq.....qqqq', '..............']),
    D: ['....BBBBBBB...', '....LLLLLLL...'].concat(rep('....LLLlll....', 10), rep('...LLL.lll....', 5),
      rep('..LLL..lll....', 2), ['..FF...lll....', '..qq...lll....', '.......ffff...', '.......qqqq...']),
    STAND: ['....BBBBBBB...', '....LLLLLLL...'].concat(rep('....lllLLL....', 18), ['....ffFFFFF...', '....qqqqqqq...']),
    SIT: ['....BBBBBBB.....', '....LLLLLLLLLLL.', '....LLLLLLLLLLL.', '....lllllllllLL.']
      .concat(rep('............LLL.', 8), ['............FFFF', '............qqqq']),
  };
  /* 프레임: 0~3 걷기, 4 서기, 5 숨쉬기, 6 앉기, 7 인사(팔 올림) */
  const GF = [
    { legs: 'A', ly: 29, bob: 0, near: 'BACK', far: 'FWD' },
    { legs: 'B', ly: 28, bob: -1, near: 'STR', far: 'STR' },
    { legs: 'C', ly: 29, bob: 0, near: 'FWD', far: 'BACK' },
    { legs: 'D', ly: 28, bob: -1, near: 'STR', far: 'STR' },
    { legs: 'STAND', ly: 29, bob: 0, near: 'STR', far: 'STR' },
    { legs: 'STAND', ly: 29, bob: -1, near: 'STR', far: 'STR', hipFill: true },
    { legs: 'SIT', ly: 37, bob: 8, near: 'STR', far: 'STR' },
    { legs: 'STAND', ly: 29, bob: 0, near: 'UP', far: 'STR' },
  ];
  S.GFRAMES = GF.length;
  const GW = 24, GH = 52;

  function grid() { return Array.from({ length: GH }, () => Array(GW).fill('.')); }
  function stamp(g, rows, ox, oy, map) {
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
      let ch = rows[y][x];
      if (ch === '.') continue;
      if (map && map[ch]) ch = map[ch];
      const gx = ox + x, gy = oy + y;
      if (gx >= 0 && gx < GW && gy >= 0 && gy < GH) g[gy][gx] = ch;
    }
  }
  function masterFrame(f) {
    const d = GF[f], g = grid(), b = d.bob;
    stamp(g, ARM[d.far], 8, 16 + b, { A: 'a', K: 'k' });
    if (d.hipFill) stamp(g, ['....LLLLLLL...'], 4, 28);
    stamp(g, LEG[d.legs], 4, d.ly);
    stamp(g, TORSO, 8, 15 + b);
    stamp(g, HEAD, 8, 5 + b);
    stamp(g, NECK, 8, 14 + b);
    stamp(g, ARM[d.near], 7, ARM_Y[d.near] + b);
    return g;
  }
  const MASTER = [];
  const HAND = [];

  const BODY_PAL = { H: '#d9dbde', G: '#9ea3aa', S: '#e6b896', z: '#c99474', E: '#2b211c', m: '#c9ccd1' };
  const SKIN = BODY_PAL.S;

  function layerFromMask(f, fn) {
    const g = MASTER[f], c = mk(GW, GH), x = c.getContext('2d');
    for (let y = 0; y < GH; y++) for (let xx = 0; xx < GW; xx++) {
      const col = fn(g[y][xx], xx, y);
      if (col) { x.fillStyle = col; x.fillRect(xx, y, 1, 1); }
    }
    return c;
  }
  const TIE_SHAPE = {
    long: { ox: 5, oy: 1, rows: ['dD', 'DD', '.D', '.D', '.D', '.D', '.D', '.D', '.D'] },
    ascot: { ox: 3, oy: 0, rows: ['dDD', 'DdD', '.DD', '..d'] },
  };
  const HAT_SHAPE = {
    fedora: ['....hhh....', '...hhhhhh..', '..hhHhhhhh.', '..bbbbbbbb.', 'hhhhhhhhhhh'],
    panama: ['...hhhhh...', '..hhhhhhh..', '..bbbbbbb..', 'hhhhhhhhhhh'],
  };

  function bakeItemLayer(it, f) {
    const d = GF[f], b = d.bob, p = it.pal;
    switch (it.slot) {
      case 'shirt':
        return layerFromMask(f, (ch) => ({ C: p.C, T: p.T, A: p.A, a: p.a, K: SKIN, k: '#d9a882' })[ch]);
      case 'pants':
        return layerFromMask(f, (ch) => ({ L: p.L, l: p.l, B: p.B })[ch]);
      case 'shoes':
        return layerFromMask(f, (ch) => ({ F: p.F, f: p.f, q: p.q })[ch]);
      case 'tie': {
        const sh = TIE_SHAPE[it.shape], g = MASTER[f], c = mk(GW, GH), x = c.getContext('2d');
        sh.rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) {
          const ch = r[xx]; if (ch === '.') continue;
          const gx = 8 + sh.ox + xx, gy = 15 + b + sh.oy + yy;
          const m = g[gy] && g[gy][gx];
          if (m !== 'T' && m !== 'C') continue;
          x.fillStyle = p[ch]; x.fillRect(gx, gy, 1, 1);
        } });
        return c;
      }
      case 'coat': {
        const ty = 15 + b, skirt0 = ty + 14, skirt1 = skirt0 + (it.len || 7);
        return layerFromMask(f, (ch, xx, y) => {
          const ry = y - ty;
          if (ch === 'T') {
            if (ry >= 1 && ry <= 3 && xx >= 13) return null;
            if (ry >= 4 && ry <= 7 && xx >= 14) return null;
            if ((ry >= 1 && ry <= 3 && xx === 12) || (ry >= 4 && ry <= 7 && xx === 13)) return p.P;
            if (it.shape === 'double' && (xx === 10 || xx === 12) && (ry === 6 || ry === 9 || ry === 12)) return p.o;
            if (it.shape === 'trench' && ry === 12) return p.o;
            return p.T;
          }
          if (ch === 'A') return p.A;
          if (ch === 'a') return p.a;
          if (y >= skirt0 && y < skirt1) {
            if (ch === 'l') return p.a;
            if (ch === 'L' || ch === 'B') return p.T;
            if (xx >= 8 && xx <= 14 && f !== 6) return p.T;
          }
          return null;
        });
      }
      case 'hat': {
        if (f === 6) return null;
        const rows = HAT_SHAPE[it.shape], c = mk(GW, GH);
        paint(c.getContext('2d'), rows, p, 7, 5 + b - (rows.length - 1));
        return c;
      }
      case 'acc': {
        if (f === 6 || f === 7) return null;
        const h = HAND[f], c = mk(GW, GH), x = c.getContext('2d');
        const sx = h[0] + 2;
        if (it.shape === 'cane') {
          x.fillStyle = p.w;
          x.fillRect(h[0] - 1, h[1] - 1, 4, 1);
          x.fillRect(h[0] - 1, h[1], 1, 1);
          x.fillRect(sx, h[1] - 1, 1, 50 - h[1]);
          x.fillStyle = p.s; x.fillRect(sx, 49, 1, 2);
        } else {
          x.fillStyle = p.w;
          x.fillRect(h[0] - 1, h[1] - 1, 4, 1);
          x.fillRect(sx, h[1] - 1, 1, 4);
          x.fillStyle = p.u; x.fillRect(sx, h[1] + 3, 2, 13);
          x.fillStyle = p.U; x.fillRect(sx + 1, h[1] + 3, 1, 13);
          x.fillStyle = '#2b211c'; x.fillRect(sx, h[1] + 16, 1, 50 - (h[1] + 16) + 1);
        }
        return c;
      }
      default: return null;
    }
  }

  const LAYERS = {}; // itemId -> [canvas per frame]
  const BODY = [];
  let ITEMS = {};
  function bakeGentleman() {
    for (let f = 0; f < GF.length; f++) {
      MASTER[f] = masterFrame(f);
      let hx = 99, hy = 99;
      MASTER[f].forEach((row, y) => row.forEach((ch, x) => { if (ch === 'K') { hx = Math.min(hx, x); hy = Math.min(hy, y); } }));
      HAND[f] = [hx, hy];
      BODY[f] = layerFromMask(f, (ch) => BODY_PAL[ch]);
    }
    ITEMS = {};
    PG.ITEMS.forEach((it) => {
      ITEMS[it.id] = it;
      if (it.slot === 'dog') return;
      LAYERS[it.id] = GF.map((_, f) => bakeItemLayer(it, f));
    });
  }
  S.HAND = HAND;

  const ORDER = ['shoes', 'pants', 'shirt', 'tie', 'coat', 'acc', 'hat'];
  const GCACHE = new Map();
  const PAD = 6;
  /* 합성 + 외곽선 캐시. 반환 {c, ox, oy}: 스프라이트 (0,0) = c 의 (ox,oy) */
  S.gent = function (eq, f, opt) {
    opt = opt || {};
    const lift = f === 7 && !opt.noLift ? 1 : 0;
    const key = ORDER.map((s) => eq[s] || '').join(',') + '|' + f + '|' + lift + (opt.noHat ? 'H' : '') + (opt.noAcc ? 'A' : '');
    let r = GCACHE.get(key);
    if (r) return r;
    const c = mk(GW, GH + PAD), x = c.getContext('2d');
    x.drawImage(BODY[f], 0, PAD);
    ORDER.forEach((slot) => {
      const id = eq[slot];
      if (!id || !LAYERS[id]) return;
      if (slot === 'hat' && opt.noHat) return;
      if (slot === 'acc' && opt.noAcc) return;
      const L = LAYERS[id][f];
      if (!L) return;
      if (slot === 'hat' && lift) x.drawImage(L, 2, PAD - 3);
      else x.drawImage(L, 0, PAD);
    });
    r = { c: outline(c), ox: 1, oy: PAD + 1, hand: HAND[f] };
    GCACHE.set(key, r);
    return r;
  };
  /* 모자 단독(엔딩 컷에서 벤치/무릎 위에 놓을 때) */
  S.hatAlone = function (id) {
    const L = LAYERS[id] && LAYERS[id][4];
    return L ? outline(L) : null;
  };

  /* ================= 강아지 ================= */
  const DOGS = {
    dachshund: {
      w: 22, h: 14, neck: [17, 8],
      pal: { D: '#a35a2c', d: '#723b1a', e: '#2b211c', n: '#2b211c' },
      body: { x: 1, y: 6, rows: ['d................', '.d...............', '..dDDDDDDDDDDDDD.',
        '..DDDDDDDDDDDDDDD', '..DDDDDDDDDDDDDDD', '...dDDDDDDDDDDDd.'] },
      head: { x: 14, y: 3, rows: ['..DDD..', '.DDDDD.', '.DDeDDD', 'ddDDDDn', 'ddDDDD.', 'dd.....'] },
      sulk: { x: 14, y: 4, rows: ['..DDD..', '.DDDDD.', '.DDdDDD', 'ddDDDDn', 'ddDDDD.', '.dd....'] },
      sniff: [1, 5],
      legsY: 12, legsX: 1,
      legs: [['...dD.......dD...', '...dD.......dD...'], ['...dD.......dD...', '..d..D.....d..D..'],
        ['...Dd.......Dd...', '...Dd.......Dd...'], ['...Dd.......Dd...', '..D..d.....D..d..']],
    },
    collie: {
      w: 20, h: 17, neck: [15, 8],
      pal: { K: '#3d3d45', k: '#2a2a30', W: '#f2efe6', w: '#cfc9bd', e: '#e0b24a', n: '#141416', d: '#2a2a30' },
      body: { x: 0, y: 7, rows: ['...KKKKKKKKKKK...', '..KKKKKKKKKKKKKW.', '.KKKKKKKKKKKKKWW.',
        'K.KKKKKKKKKKKWWW.', 'W..KKKKKKKKKWWW..', '....KKKKKKKKWW...'] },
      head: { x: 13, y: 2, rows: ['..K.K..', '.KKKKK.', '.KKWeK.', 'KKKWWWW', 'KKKWWWn', '.KWWWW.'] },
      sulk: { x: 13, y: 3, rows: ['.......', 'KKKKKK.', '.KKWdK.', 'KKKWWWW', 'KKKWWWn', '.KWWWW.'] },
      sniff: [1, 6],
      legsY: 13, legsX: 0,
      legs: [['....kK.......wW..', '....kK.......wW..', '....kK.......wW..', '....wW.......wW..'],
        ['....kK.......wW..', '...k..K.....w..W.', '...k..K.....w..W.', '..w....W...w....W'],
        ['....Kk.......Ww..', '....Kk.......Ww..', '....Kk.......Ww..', '....Ww.......Ww..'],
        ['....Kk.......Ww..', '...K..k.....W..w.', '...K..k.....W..w.', '..W....w...W....w']],
    },
    poodle: {
      w: 19, h: 17, neck: [13, 7],
      pal: { Q: '#efe0bf', q: '#cdb68a', e: '#2b211c', n: '#2b211c' },
      body: { x: 0, y: 5, rows: ['QQ..............', 'QQq.............', '.q.qQQQQQQQQq...', '...QQqQQQqQQQQ..',
        '...QQQQQQQQQQQQ.', '...qQQqQQQQqQQ..', '....qQQQQQQQQ...'] },
      head: { x: 11, y: 0, rows: ['..QQQ...', '.QQqQQ..', 'qQQQeQ..', 'qQQQQQQn', 'qqQQQQ..', 'qq.QQ...', 'qq......'] },
      sulk: { x: 11, y: 1, rows: ['..QQQ...', '.QQqQQ..', 'qQQQqQ..', 'qQQQQQQn', 'qqQQQQ..', 'qq.QQ...', 'qq......'] },
      sniff: [1, 6],
      legsY: 12, legsX: 0,
      legs: [['....qQ......qQ..', '....qQ......qQ..', '....qQ......qQ..', '....qQ......qQ..', '...qQQ.....qQQ..'],
        ['....qQ......qQ..', '....q.Q....q.Q..', '...q..Q....q..Q.', '...q..Q...q...Q.', '..qq..QQ..qq..QQ'],
        ['....Qq......Qq..', '....Qq......Qq..', '....Qq......Qq..', '....Qq......Qq..', '...QQq.....QQq..'],
        ['....Qq......Qq..', '....Q.q....Q.q..', '...Q..q....Q..q.', '...Q..q...Q...q.', '..QQ..qq..QQ..qq']],
    },
  };
  S.DOGS = DOGS;
  const DCACHE = new Map();
  /* frame: 'w0'..'w3' 걷기, 'sniff', 'k0'..'k3' 삐짐(귀 처짐) */
  S.dog = function (breed, frame, itemId) {
    const key = breed + '|' + frame + '|' + (itemId || '');
    let r = DCACHE.get(key);
    if (r) return r;
    const D = DOGS[breed];
    const c = mk(D.w, D.h + 2), x = c.getContext('2d');
    const li = frame === 'sniff' ? 0 : +frame[1];
    paint(x, D.legs[li], D.pal, D.legsX, D.legsY);
    paint(x, D.body.rows, D.pal, D.body.x, D.body.y);
    if (frame === 'sniff') paint(x, D.head.rows, D.pal, D.head.x + D.sniff[0], D.head.y + D.sniff[1]);
    else if (frame[0] === 'k') paint(x, D.sulk.rows, D.pal, D.sulk.x, D.sulk.y);
    else paint(x, D.head.rows, D.pal, D.head.x, D.head.y);
    const it = itemId && ITEMS[itemId];
    if (it) {
      const nx = D.neck[0], ny = D.neck[1], p = it.pal;
      if (it.shape === 'collar') {
        x.fillStyle = p.c; x.fillRect(nx - 1, ny - 1, 2, 3);
        x.fillStyle = p.y; x.fillRect(nx, ny + 2, 1, 1);
      } else {
        x.fillStyle = p.c; x.fillRect(nx - 2, ny, 4, 1); x.fillRect(nx - 1, ny + 1, 3, 1); x.fillRect(nx, ny + 2, 1, 1);
        x.fillStyle = p.C; x.fillRect(nx - 2, ny, 1, 1);
      }
    }
    r = { c: outline(c), w: D.w, h: D.h, neck: D.neck };
    DCACHE.set(key, r);
    return r;
  };

  /* ================= 이웃 (정면, idle 2프레임) ================= */
  const NBR = {
    marta: {
      pal: { R: '#8a4a2a', S: '#e2b08a', e: '#2b211c', r: '#a8553a', V: '#6f7d45', P: '#efe6cf', o: '#c9bb98', k: '#3a2a20' },
      head: 9,
      rows: ['......RRR.......', '.....RRRRR......', '.....RRRRRR.....', '.....RSSSSR.....', '.....SeSSeS.....',
        '.....SSSSSS.....', '.....SSrrSS.....', '......SSSS......', '.......SS.......', '....VVVVVVVV....',
        '...VVVPPPPVVV...', '...VVVPPPPVVV...', '...SVVPPPPVVS...', '...SVVPPPPVVS...', '...SVVPPPPVVS...',
        '...SVPPPPPPVS...', '...SPPPPPPPPS...', '...SPPPPPPPPS...', '....PPPPPPPP....', '....PPPoPPPP....',
        '....PPPPPPPP....', '....PPPPPPPP....', '....VPPPPPPV....', '....VVVVVVVV....', '....VVVVVVVV....',
        '....VVVVVVVV....'].concat(rep('.....SS..SS.....', 12), ['.....kk..kk.....', '....kkk..kkk....']),
    },
    enzo: {
      pal: { N: '#2e2620', S: '#dcaa82', e: '#2b211c', M: '#3a2a20', W: '#f2eee4', X: '#2f2b2a', b: '#7a2232', Y: '#4a4744', k: '#1f1814' },
      head: 10,
      rows: ['.....NNNNNN.....', '....NNNNNNNN....', '....NSSSSSSN....', '....SSeSSeSS....', '....SSSSSSSS....',
        '....SMMMMMMS....', '....MSSSSSSM....', '.....SSSSSS.....', '......SSSS......', '......WbbW......',
        '...WWWXbbXWWW...', '...WWXXWWXXWW...', '...WWXXWWXXWW...', '...WWXXWWXXWW...', '...SWXXWWXXWS...',
        '...SXXXXXXXXS...', '...SXXXXXXXXS...'].concat(rep('....XXXXXXXX....', 10), rep('.....YY..YY.....', 11),
        ['.....kk..kk.....', '....kkk..kkk....']),
    },
    sofia: {
      pal: { R: '#7a4526', S: '#ecc29c', e: '#2b211c', r: '#b5452f', W: '#f6efdf', Y: '#e3b341', y: '#c49326', w: '#f6efdf', d: '#a8402f' },
      head: 7,
      rows: ['....RRRR....', '...RRRRRR...', '.R.RSSSSR.R.', 'RR.SeSSeS.RR', 'R..SSSSSS..R', '...SSrrSS...',
        '....SSSS....', '...WWWWWW...', '..SYYYYYYS..', '..SYYYYYYS..', '..SYYYYYYS..', '...YYYYYY...',
        '..YYYYYYYY..', '.YYYYYYYYYY.', '.yYYYYYYYYy.', '....SS.SS...', '....SS.SS...', '....SS.SS...',
        '....SS.SS...', '....ww.ww...', '....ww.ww...', '...ddd.ddd..'],
    },
  };
  const NCACHE = {};
  function bakeNeighbors() {
    Object.keys(NBR).forEach((id) => {
      const n = NBR[id];
      const f0 = bakeRows(n.rows, n.pal);
      const rows1 = n.rows.slice();
      const head = rows1.slice(0, n.head - 1);
      const r1 = ['.'.repeat(n.rows[0].length)].concat(head, rows1.slice(n.head));
      const f1 = bakeRows(r1, n.pal);
      NCACHE[id] = [outline(f0), outline(f1)];
    });
  }
  S.nbr = (id, f) => NCACHE[id][f & 1];

  /* ================= 소품 ================= */
  const PROPS_DEF = {
    coin0: { pal: { o: '#e0b23a', O: '#b8862a', w: '#fff3c4' }, rows: ['.ooo.', 'owooo', 'owoOo', 'oooOo', '.ooo.'] },
    coin1: { pal: { o: '#e0b23a', O: '#b8862a', w: '#fff3c4' }, rows: ['.oo..', '.wo..', '.oO..', '.oO..', '.oo..'] },
    coin2: { pal: { o: '#e0b23a', O: '#b8862a', w: '#fff3c4' }, rows: ['..o..', '..O..', '..O..', '..O..', '..o..'] },
    spark: { pal: { w: '#fffbe8', y: '#f0cf5a' }, rows: ['..w..', '..y..', 'wyyyw', '..y..', '..w..'] },
    bubble: { pal: { k: '#2b211c', w: '#fbf6ea' }, rows: ['.kkkkkkkkkkk.', 'kwwwwwwwwwwwk', 'kwwwwwwwwwwwk', 'kwwwwwwwwwwwk',
      'kwwwwwwwwwwwk', 'kwwwwwwwwwwwk', '.kkkkkkkkkkk.', '...kwk.......', '...kk........'] },
    dots: { pal: { k: '#2b211c' }, rows: ['k.k.k'] },
    heart: { pal: { r: '#c8452f', w: '#f6efdf', R: '#9c2f20' }, rows: ['.rr.rr.', 'rwrrrrr', 'rrrrrrR', '.rrrrR.', '..rrR..', '...R...'] },
    sheart: { pal: { r: '#c8452f', R: '#9c2f20' }, rows: ['rr.rr', 'rrrrR', '.rrR.', '..R..'] },
    scent: { pal: { g: '#7c8a52' }, rows: ['.g...', '..g..', '.g..g', '..g.g', '...g.', '..g..'] },
    cloud: { pal: { w: '#fbf6ea', W: '#e4dccb' }, rows: ['........wwww..............', '....wwwwwwwwww...www......',
      '..wwwwwwwwwwwwwwwwwwww....', '.wwwwwwwwwwwwwwwwwwwwwww..', 'wwwwwwwwwwwwwwwwwwwwwwwwww', '.WWWWWWWWWWWWWWWWWWWWWWW..'] },
    bush: { pal: { g: '#6f8a3e', G: '#566e2e', l: '#93ab5a', r: '#c8452f', y: '#e8c24a', p: '#b8592f', P: '#94451f' },
      rows: ['....ggg..ggg....', '..gglggggglggg..', '.glgggrggggyggg.', 'gggggggggGggrgGg', 'ggyggGgggggggGGg',
        'gggGggggggrggGGg', '.gGGgggGGgggGGg.', '..GGGGGGGGGGGG..', 'pppppppppppppppp', 'pPpppPpppPpppPpp', 'PPPPPPPPPPPPPPPP'] },
    fountain: { pal: { b: '#8fbbd6', w: '#e8f3f8', c: '#d4cab2', C: '#b4a98f', k: '#8a7f68' },
      rows: ['.........b..........', '........bwb.........', '.......b.b.b........', '......b..c..b.......',
        '.....b...c...b......', '.........c..........', '..cccccccccccccccc..', '.cCbbbbwbbbbbwbbbCc.', '.cCCCCCCCCCCCCCCCCc.',
        '..cCCCkCCCCCkCCCCc..', '..cCCCCCCCCCCCCCCc..', '...cccccccccccccc...', '.....kkkkkkkkkk.....'] },
    stall: { pal: { b: '#4f7fc0', B: '#3a6399', y: '#e8c24a', r: '#c8452f', w: '#f6efdf', g: '#5f7a36', p: '#9ea4a6', P: '#7c8284', m: '#9a6a3e', M: '#74502c' },
      rows: ['..b.y.b..r.bb..y.b.r.b..w.b.', '.bBbyybb.rrb.yyy.bBrrbb.wwb.', '..gg.gg..gg..gg..gg.gg..gg..',
        '.ppppp..ppppp..ppppp..ppppp.', '.PpppP..PpppP..PpppP..PpppP.', 'mmmmmmmmmmmmmmmmmmmmmmmmmmmm',
        'MmMmMmMmMmMmMmMmMmMmMmMmMmMm', 'mmmmmmmmmmmmmmmmmmmmmmmmmmmm', 'M.........................M.', 'M.........................M.',
        'M.........................M.', 'M.........................M.'] },
    cafe: { pal: { k: '#2b211c', B: '#2f3a33', w: '#e8e4d8', m: '#5c5f62', M: '#3f4245', c: '#5a3a22', s: '#7a5232' },
      rows: ['kkkkkkkk..............', 'kBBBBBBk..............', 'kBwwBwBk.......ww.....', 'kBBBBBBk.......wc.....',
        'kBwBwwBk.s..mmmmmmmmmm', 'kBBBBBBk.s...MMMMMMMM.', 'kBwwwBBk.s......mm....', 'kkkkkkkk.ssss...mm....',
        '.k....k..s..s...mm....', '.k....k..s..s...mm....', 'k......k.s..s..mmmm...', 'k......k.s..s.mmmmmm..'] },
    bouquet: { pal: { b: '#4f7fc0', B: '#2f5a99', w: '#e8f0fa', g: '#5f7a36', p: '#efe6cf', P: '#cfc2a2' },
      rows: ['.b.bw..', 'bBbbBb.', 'bwbBbbb', '.bbBbb.', '..g.g..', '..ggg..', '..pPp..', '.ppPpp.', '.pPppp.'] },
    lamphead: { pal: { i: '#2f3333', y: '#f1d98a', Y: '#d9b85a' }, rows: ['..iii..', '.iyyyi.', 'iyyYyyi', '.iyyyi.', '..iii..', '...i...'] },
    umbrella: { pal: { u: '#55653d', U: '#3f4c2c', k: '#2b211c' }, rows: ['.......kk.........', '....uuuuuuuuuu....',
      '..uuuuUuuuuUuuuu..', '.uuuuUuuuuuuUuuuu.', 'uuuUuuuuuuuuuuUuuu', 'u.u..u..u..u..u..u'] },
    sun: { pal: { y: '#e8b83a', Y: '#c8902a' }, rows: ['....y....', '.y.....y.', '...yyy...', '..yyyyy..', 'y.yyYyy.y', '..yyyyy..', '...yyy...', '.y.....y.', '....y....'] },
    cloudi: { pal: { w: '#f2eee4', W: '#b9b4a8' }, rows: ['.........', '...www...', '..wwwww..', '.wwwwwwww', 'wwwwwwwww', 'WWWWWWWWW', '.........'] },
    rain: { pal: { w: '#e4e2dc', W: '#9ea3aa', b: '#6f9fd0' }, rows: ['...www...', '..wwwww..', '.wwwwwwww', 'WWWWWWWWW', '.b..b..b.', 'b..b..b..', '.b..b..b.'] },
    coinicon: { pal: { o: '#e0b23a', O: '#9c7020', w: '#fff3c4', k: '#5a3e14' }, rows: ['..ooo..', '.owwoO.', 'owoooOo', 'owokoOo', 'ooooOOo', '.oOOOO.', '..ooo..'] },
    book: { pal: { r: '#7a2232', R: '#5a1824', w: '#f6efdf', y: '#d9b45a' }, rows: ['rrrrrrrr.', 'rRyyyyRrw', 'rRyRRyRrw', 'rRRRRRRrw', 'rRRRRRRrw', 'rRRyyRRrw', 'rRRRRRRrw', 'rrrrrrrrw', '.wwwwwwww'] },
  };
  const PROPS = {};
  function bakeProps() {
    Object.keys(PROPS_DEF).forEach((k) => {
      const d = PROPS_DEF[k];
      const raw = bakeRows(d.rows, d.pal);
      PROPS[k] = ['cloud', 'spark', 'scent', 'dots'].indexOf(k) >= 0 ? raw : outline(raw);
    });
    PROPS.tree = makeTree();
    PROPS.lamp = makeLamp();
    PROPS.door = makeDoor();
    PROPS.bench = makeBench();
  }
  S.prop = (k) => PROPS[k];

  function makeTree() {
    const w = 30, h = 70, c = mk(w, h), x = c.getContext('2d'), r = rng(42);
    x.fillStyle = '#6b4a2f'; x.fillRect(14, 22, 2, 46);
    x.fillStyle = '#4e3520'; x.fillRect(15, 22, 1, 46);
    x.fillStyle = '#4e3520'; x.fillRect(11, 67, 8, 1);
    const cols = ['#6f8a3e', '#566e2e', '#93ab5a'];
    for (let yy = 0; yy < 28; yy++) for (let xx = 0; xx < w; xx++) {
      const dx = (xx - 15) / 14, dy = (yy - 13) / 13;
      const d = dx * dx + dy * dy + (r() - 0.5) * 0.25;
      if (d > 1) continue;
      let ci = 0;
      if (dy > 0.25 || dx > 0.45) ci = 1;
      if (dy < -0.35 && dx < 0.1 && r() < 0.5) ci = 2;
      if (r() < 0.08) ci = 1;
      x.fillStyle = cols[ci]; x.fillRect(xx, yy, 1, 1);
    }
    return outline(c);
  }
  function makeLamp() {
    const c = mk(9, 56), x = c.getContext('2d');
    paint(x, PROPS_DEF.lamphead.rows, PROPS_DEF.lamphead.pal, 1, 0);
    x.fillStyle = '#2f3333'; x.fillRect(4, 6, 1, 46);
    x.fillStyle = '#454a4a'; x.fillRect(3, 50, 3, 3); x.fillRect(2, 53, 5, 3);
    x.fillRect(2, 8, 5, 1);
    return outline(c);
  }
  function makeDoor() {
    const c = mk(26, 40), x = c.getContext('2d');
    x.fillStyle = '#d8cdb3'; x.fillRect(0, 4, 26, 36); x.fillRect(3, 1, 20, 4); x.fillRect(7, 0, 12, 1);
    x.fillStyle = '#b4a98f'; x.fillRect(0, 39, 26, 1);
    x.fillStyle = '#4f6b4a'; x.fillRect(4, 6, 18, 32); x.fillRect(6, 4, 14, 2);
    x.fillStyle = '#3d5639'; x.fillRect(12, 6, 2, 32);
    x.fillRect(6, 9, 4, 10); x.fillRect(16, 9, 4, 10); x.fillRect(6, 23, 4, 12); x.fillRect(16, 23, 4, 12);
    x.fillStyle = '#d9b45a'; x.fillRect(11, 22, 1, 2); x.fillRect(14, 22, 1, 2);
    x.fillStyle = '#efe6cf'; x.fillRect(10, 1, 6, 3);
    x.fillStyle = '#2f3d5c'; x.fillRect(12, 2, 2, 1);
    x.fillStyle = '#b4a98f'; x.fillRect(2, 38, 22, 2);
    return outline(c);
  }
  function makeBench() {
    const c = mk(14, 25), x = c.getContext('2d');
    x.fillStyle = '#8a5a36'; x.fillRect(0, 0, 2, 14); x.fillRect(0, 14, 12, 2);
    x.fillStyle = '#6b4227'; x.fillRect(1, 0, 1, 14); x.fillRect(0, 15, 12, 1);
    x.fillStyle = '#2f3333'; x.fillRect(1, 16, 1, 9); x.fillRect(9, 16, 1, 9); x.fillRect(0, 24, 3, 1); x.fillRect(8, 24, 3, 1);
    return outline(c);
  }

  /* ================= 건물 파사드 (타일 조합, 시드별 캐시) ================= */
  const WIN_OPEN = ['..ffffffff..', 'ssfddddddfss', 'SSfdLddddfSS', 'ssfdLddddfss', 'SSfddddddfSS', 'ssffffffffss',
    'SSfddddddfSS', 'ssfdLddddfss', 'SSfddddddfSS', 'ssfddddddfss', '..ffffffff..', '.tttttttttt.'];
  const WIN_SHUT = ['..ffffffff..', '..fssssssf..', '..fSSSSSSf..', '..fssssssf..', '..fSSSSSSf..', '..fssssssf..',
    '..fSSSSSSf..', '..fssssssf..', '..fSSSSSSf..', '..fssssssf..', '..ffffffff..', '.tttttttttt.'];
  const BALC = ['iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii', 'i..i..i..i..i..i..i..i..i..i..i..i.i',
    'i..i..i..i..i..i..i..i..i..i..i..i.i', 'tttttttttttttttttttttttttttttttttttt', '.kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.'];
  const WALLS = [['#c96f45', '#a85a37'], ['#d9a441', '#b8862f'], ['#efe2c4', '#d3c3a0'], ['#e3c99a', '#c4a877'],
    ['#b9a36b', '#998553'], ['#d98c52', '#b8733f']];
  const SHUT = [['#5f7a45', '#4a6136'], ['#4c6f73', '#3a5659'], ['#7a5232', '#5e3e25'], ['#6b7a3a', '#55622d']];
  const AWN = [['#b8592f', '#efe2c4'], ['#5f6e34', '#efe2c4'], ['#2f3d5c', '#efe2c4']];
  const BCACHE = new Map();
  S.BW = 48;
  S.building = function (i, alley) {
    const key = i + (alley ? 'a' : '');
    if (BCACHE.has(key)) return BCACHE.get(key);
    const r = rng(i * 9973 + 17 + (alley ? 5 : 0));
    const pick = (a) => a[Math.floor(r() * a.length)];
    const w = S.BW, floors = 2 + (r() < 0.55 ? 1 : 0) + (r() < 0.25 ? 1 : 0), h = 26 + floors * 20 + 6;
    let [wall, wallD] = pick(WALLS);
    const [sh, shD] = pick(SHUT);
    if (alley) { wall = pick(['#a99a80', '#9c8a72', '#b3a184']); wallD = '#867660'; }
    const c = mk(w, h), x = c.getContext('2d');
    x.fillStyle = wall; x.fillRect(0, 0, w, h);
    x.fillStyle = wallD;
    for (let n = 0; n < 30; n++) x.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1, 1);
    x.fillRect(0, 0, 1, h);
    x.fillStyle = '#9c4a2c'; x.fillRect(0, 0, w, 1);
    x.fillStyle = '#f3ead6'; x.fillRect(0, 1, w, 2);
    x.fillStyle = wallD; x.fillRect(0, 3, w, 1);
    const pal = { f: '#f3ead6', d: '#3d4a55', L: '#6c7f8c', s: sh, S: shD, t: '#f3ead6', i: '#2f3333', k: wallD };
    const mixed = r() < 0.5;
    for (let fl = 0; fl < floors; fl++) {
      const y = 7 + fl * 20;
      [6, 30].forEach((wx) => paint(x, mixed && r() < 0.45 ? WIN_SHUT : WIN_OPEN, pal, wx, y));
      if (fl === floors - 1 && r() < 0.5) {
        paint(x, BALC, pal, 6, y + 9);
        x.fillStyle = '#6f8a3e';
        for (let px = 7; px < 41; px += 3 + Math.floor(r() * 3)) { x.fillRect(px, y + 8, 2, 1); if (r() < 0.4) { x.fillStyle = '#c8452f'; x.fillRect(px, y + 7, 1, 1); x.fillStyle = '#6f8a3e'; } }
      }
    }
    const gy = h - 26;
    x.fillStyle = wallD; x.fillRect(0, gy, w, 1);
    x.fillStyle = '#f3ead6'; x.fillRect(0, gy + 1, w, 1);
    if (r() < 0.55) {
      const [a1, a2] = pick(AWN);
      x.fillStyle = '#3d4a55'; x.fillRect(20, gy + 10, 24, 14);
      x.fillStyle = '#6c7f8c'; x.fillRect(22, gy + 12, 2, 6); x.fillRect(32, gy + 12, 2, 6);
      x.fillStyle = '#f3ead6'; x.fillRect(19, gy + 9, 26, 1); x.fillRect(31, gy + 10, 1, 14);
      for (let ax = 0; ax < 28; ax++) {
        x.fillStyle = (ax >> 1) & 1 ? a2 : a1;
        x.fillRect(18 + ax, gy + 3, 1, 5);
        if (!((ax >> 1) & 1)) x.fillRect(18 + ax, gy + 8, 1, 1);
      }
      x.fillStyle = '#5a3a22'; x.fillRect(5, gy + 8, 10, 18);
      x.fillStyle = '#74502c'; x.fillRect(6, gy + 10, 3, 6); x.fillRect(11, gy + 10, 3, 6); x.fillRect(6, gy + 18, 3, 6); x.fillRect(11, gy + 18, 3, 6);
    } else {
      x.fillStyle = '#5a3a22'; x.fillRect(19, gy + 6, 12, 20); x.fillRect(20, gy + 5, 10, 1); x.fillRect(22, gy + 4, 6, 1);
      x.fillStyle = '#74502c'; x.fillRect(20, gy + 9, 4, 15); x.fillRect(26, gy + 9, 4, 15);
      paint(x, WIN_SHUT, pal, 2, gy + 9);
      paint(x, WIN_SHUT, pal, 35, gy + 9);
    }
    BCACHE.set(key, c);
    return c;
  };

  /* UI 아이콘 → dataURL (정수 배율로 미리 키워서 CSS 축소에도 선명) */
  function toURL(src, scale) {
    const c = mk(src.width * scale, src.height * scale), x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }
  S.toURL = toURL;
  S.iconURL = function (k) { return toURL(PROPS[k], 6); };

  const ICON_CROP = { hat: [0, 0, 26, 26], coat: [0, 12, 26, 44], shirt: [0, 12, 26, 30], tie: [2, 13, 22, 22],
    pants: [0, 30, 26, 30], shoes: [0, 46, 26, 14], acc: [0, 14, 26, 46] };
  const BASE_EQ = { shirt: 'shirt_white', pants: 'pants_grey', shoes: 'shoes_brown' };
  /* 아이템 아이콘: 기본 착장 + 해당 아이템을 입힌 서기 프레임을 슬롯 영역으로 크롭 */
  S.itemIconURL = function (id, breed) {
    const it = ITEMS[id];
    if (it.slot === 'dog') return toURL(S.dog(breed || 'dachshund', 'w0', id).c, 5);
    const eq = Object.assign({}, BASE_EQ);
    eq[it.slot] = id;
    const g = S.gent(eq, 4);
    const cr = ICON_CROP[it.slot];
    const c = mk(cr[2], cr[3]);
    c.getContext('2d').drawImage(g.c, -cr[0], -cr[1]);
    return toURL(c, 5);
  };

  S.bake = function () {
    bakeGentleman();
    bakeNeighbors();
    bakeProps();
  };
})();

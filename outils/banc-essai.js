// Banc d'essai de Cible Photo : outil de mise au point, non chargé par l'application.
// Usage : ouvrir l'application dans un navigateur d'ordinateur, puis dans la console :
//   const s = document.createElement('script'); s.src = 'outils/banc-essai.js'; document.head.append(s);
//   summ(sweep(1, 31, { face: 'tri', perEnd: 3 }))                       // 30 scènes simulées : erreurs de position et de valeur
//   window._noRefine = true                                              // même mesure sans l'affinage (comparaison)
//   cordonSumm(cordonTest(1, 9, { face: 'tri' }, [0.5, 1, 2, 3, 4, 5]))  // flèches à moins de 0,12 anneau d'un trait, avec gros plan simulé
// Les scènes sont tirées d'un numéro (seed) : une même commande redonne les mêmes scènes.
window.seedRun = (seed, cfg) => {
  Object.assign(S.cfg, cfg); let s = seed * 7919 + 13; const orig = Math.random;
  Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  try {
    A = { photo: makeDemo(true), spots: [], hits: [], sel: -1, mode: 'hits' }; detect();
    const out = [], used = new Set();
    window._demoPts.forEach((p, j) => {
      let b = -1, bd = 1e9;
      A.hits.forEach((hh, k) => { const dd = Math.hypot(hh.x - p[0], hh.y - p[1]); if (dd < bd && !used.has(k)) { bd = dd; b = k; } });
      const loc = b >= 0 ? hitLoc(A.hits[b]) : null, ok = !!loc && bd / ringPx(A.spots[loc.si]) < 1;
      if (ok) {
        used.add(b); const hh = A.hits[b];
        out.push({ seed, j, k: b, r: +window._demoR[j].toFixed(2), rerr: +(loc.r - window._demoR[j]).toFixed(3), err: +(bd / ringPx(A.spots[loc.si])).toFixed(3),
          dr: +(hh.dr || 0).toFixed(3), fine: !!hh.fine, cal: !!hh.cal, uns: !!hh.unsure, val: hitVal(hh), truth: window._demoTruth[j], cord: cordon(hh) });
      } else out.push({ seed, j, miss: true });
    });
    return out;
  } finally { Math.random = orig; }
};
window.sweep = (a, b, cfg) => { let all = []; for (let i = a; i < b; i++) all = all.concat(seedRun(i, cfg)); return all; };
window.summ = R => {
  const f = R.filter(r => !r.miss);
  const q = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b.length ? +b[Math.min(b.length - 1, Math.floor(p * b.length))].toFixed(3) : null; };
  const fc = f.filter(r => r.fine && r.cal), ab = a => a.map(r => Math.abs(r.rerr));
  return { n: R.length, found: f.length, posMed: q(f.map(r => r.err), .5), pos90: q(f.map(r => r.err), .9), rMed: q(ab(f), .5), r90: q(ab(f), .9),
    fcN: fc.length, fcMed: q(ab(fc), .5), fc90: q(ab(fc), .9), fc97: q(ab(fc), .97), fcMax: q(ab(fc), 1),
    valOK: +(f.filter(r => r.val === r.truth).length / f.length).toFixed(3), wrongSilent: f.filter(r => r.val !== r.truth && !r.cord && !r.uns).length, cord: f.filter(r => r.cord).length };
};

// ---- gros plan simulé de la flèche j de la dernière scène ----
window.zoomShot = (j, o) => {
  const sc = window._demoScene, q = sc.arrows[j], W = 1500, H = 2000;
  const p0 = sc.toPhoto(q.x, q.y), p1 = sc.toPhoto(q.x + 1, q.y), p2 = sc.toPhoto(q.x, q.y + 1);
  const a = p1[0] - p0[0], b = p1[1] - p0[1], c = p2[0] - p0[0], d = p2[1] - p0[1], cr = Math.cos(o.rot), sr = Math.sin(o.rot), Zf = o.zoom;
  const m11 = Zf * (cr * a - sr * b), m21 = Zf * (sr * a + cr * b), m12 = Zf * (cr * c - sr * d), m22 = Zf * (sr * c + cr * d);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#8a7355'; g.fillRect(0, 0, W, H);
  const cx = W / 2 + o.dx, cy = H / 2 + o.dy;
  g.setTransform(m11, m21, m12, m22, cx - m11 * q.x - m12 * q.y, cy - m21 * q.x - m22 * q.y);
  paintScene(g, sc); g.setTransform(1, 0, 0, 1, 0, 0);
  g.filter = 'blur(' + o.blur + 'px)'; g.drawImage(cv, 0, 0); g.filter = 'none';
  const sh = g.createLinearGradient(0, 0, W, H); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,' + o.shade + ')'); g.fillStyle = sh; g.fillRect(0, 0, W, H);
  const ux = Math.cos(q.a), uy = Math.sin(q.a), dx = m11 * ux + m12 * uy, dy = m21 * ux + m22 * uy, dl = Math.hypot(dx, dy);
  return { cv, tip: [cx, cy], dir: [dx / dl, dy / dl], rho: sc.sh / 2 * dl };
};
window.zoomTest = (seed, cfg) => {
  const wide = seedRun(seed, cfg); let s = seed * 104729 + 7; const rnd = (a, b) => { s = (s * 1664525 + 1013904223) >>> 0; return a + (b - a) * s / 4294967296; };
  const out = [];
  for (const w of wide) {
    if (w.miss) continue;
    const o = { zoom: rnd(3.5, 6), rot: rnd(-0.07, 0.07), dx: rnd(-150, 150), dy: rnd(-150, 150), blur: rnd(1, 2.5), shade: rnd(0.05, 0.3) };
    const shot = zoomShot(w.j, o), back = rnd(1.5, 4) * shot.rho, lat = rnd(-0.4, 0.4) * shot.rho;
    Z = { i: w.k, photo: shot.cv, stage: 'tap', res: null };
    let err = null; try { zoomAnalyse(shot.tip[0] + shot.dir[0] * back - shot.dir[1] * lat, shot.tip[1] + shot.dir[1] * back + shot.dir[0] * lat); } catch (e) { err = String(e); }
    const R = Z.res, truthR = window._demoR[w.j];
    out.push({ seed, j: w.j, r: +truthR.toFixed(2), wideErr: w.rerr, wideVal: w.val, truth: w.truth, stage: Z.stage, err, msg: Z.stage === 'fail' ? Z.msg.slice(0, 40) : undefined,
      zErr: R ? +(R.r - truthR).toFixed(3) : null, zVal: R ? R.val : null, pos: R ? +(Math.hypot(R.x - shot.tip[0], R.y - shot.tip[1]) / R.P).toFixed(3) : null, rhoRatio: R ? +(R.rho / shot.rho).toFixed(2) : null, cord: w.cord });
    Z = null;
  }
  return out;
};

window.zoomDbg = (seed, j, cfg) => {
  const wide = seedRun(seed, cfg), w = wide.find(q => q.j === j); let s = seed * 104729 + 7; const rnd = (a, b) => { s = (s * 1664525 + 1013904223) >>> 0; return a + (b - a) * s / 4294967296; };
  let o, shot, back, lat;
  for (const q of wide) { if (q.miss) continue; o = { zoom: rnd(3.5, 6), rot: rnd(-0.07, 0.07), dx: rnd(-150, 150), dy: rnd(-150, 150), blur: rnd(1, 2.5), shade: rnd(0.05, 0.3) }; const r1 = rnd(1.5, 4), r2 = rnd(-0.4, 0.4); if (q.j === j) { shot = zoomShot(j, o); back = r1 * shot.rho; lat = r2 * shot.rho; break; } }
  const sx = shot.tip[0] + shot.dir[0] * back - shot.dir[1] * lat, sy = shot.tip[1] + shot.dir[1] * back + shot.dir[0] * lat;
  const t = tubeAt(shot.cv, sx, sy), out = { o, trueRho: +shot.rho.toFixed(1), tube: window._demoScene.arrows[j].tube };
  const rel = q => ({ along: +((q.x - shot.tip[0]) * shot.dir[0] + (q.y - shot.tip[1]) * shot.dir[1]).toFixed(1), lat: +((q.x - shot.tip[0]) * -shot.dir[1] + (q.y - shot.tip[1]) * shot.dir[0]).toFixed(1) });
  if (!t) return { ...out, t: null };
  out.t = { ...rel(t), dot: +(t.ux * shot.dir[0] + t.uy * shot.dir[1]).toFixed(3), rho: +t.rho.toFixed(1), len: +t.len.toFixed(0) };
  const P = t.rho / shaftU(), m = 2.4 * P + 6 * t.rho + 12, px = sampler(shot.cv, t.x - m, t.y - m, t.x + m, t.y + m);
  const f = refineShaft(px, t.x, t.y, t.ux, t.uy, t.rho, P, t.len, t.rho);
  out.f = f && { ...rel(f), rho: +f.rho.toFixed(1), end: f.end };
  window._shot = shot; return out;
};

// ---- cas de cordon : flèches placées à moins de 0,12 anneau d'un trait ----
window.cordonTest = (a, b, cfg, lines) => {
  Object.assign(S.cfg, cfg); const su = shaftU(), out = [];
  for (let seed = a; seed < b; seed++) {
    let s = seed * 31337 + 5; const rnd = (x, y) => { s = (s * 1664525 + 1013904223) >>> 0; return x + (y - x) * s / 4294967296; };
    const n = S.cfg.face === 'tri' ? 3 : S.cfg.perEnd, gs = [];
    window._demoList = Array.from({ length: n }, (_, i) => { const g = rnd(-0.12, 0.12), Rl = lines[(rnd(0, lines.length)) | 0]; gs.push(g); return [S.cfg.face === 'tri' ? i : 0, Rl + su + g, rnd(0, 6.28)]; });
    let res; try { res = zoomTest(seed, cfg); } finally { delete window._demoList; }
    for (const r of res) out.push({ seed, j: r.j, g: +gs[r.j].toFixed(3), truth: r.truth, wideVal: r.wideVal, wideOK: r.wideVal === r.truth, wideCord: r.cord, stage: r.stage, zVal: r.zVal, zOK: r.zVal === r.truth, zErr: r.zErr, msg: r.msg });
  }
  return out;
};
window.cordonSumm = R => {
  const d = R.filter(r => r.stage === 'done'), big = r => Math.abs(r.g) >= 0.03;
  return { n: R.length, wideOK: R.filter(r => r.wideOK).length, wideWrongSilent: R.filter(r => !r.wideOK && !r.wideCord).length, wideFlagged: R.filter(r => r.wideCord).length,
    zoomDone: d.length, zoomOK: d.filter(r => r.zOK).length, zoomWrong: d.filter(r => !r.zOK).map(r => [r.seed, r.j, r.g, r.zErr]), zoomOKbig: d.filter(r => big(r) && r.zOK).length + '/' + d.filter(big).length,
    zErrAbsMed: (a => a.sort((x, y) => x - y)[a.length >> 1])(d.map(r => Math.abs(r.zErr))), fails: R.filter(r => r.stage !== 'done').map(r => [r.seed, r.j, (r.msg || '').slice(0, 22)]) };
};

// Détection hors navigateur, pour la mise au point sur de vraies photos (trispot).
//   python outils/image-brute.py to photo.png dossier/photo.rgba      (image -> pixels bruts)
//   node outils/essai-node.js index.html dossier photo                (impacts, tubes suivis ; écrit dossier/photo.dbg)
//   python outils/image-brute.py from dossier/photo.dbg controle.png  (image de contrôle : masque, tubes, anneaux)
// _tstBands est activé : à retirer pour une photo d'origine (il sert aux captures d'écran, où les anneaux verts sont incrustés).
const fs = require("fs"), path = require("path");
const [html, dir, ...names] = process.argv.slice(2);
const dummy = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => "" : dummy), apply: () => dummy, set: () => true, construct: () => dummy });
class Canvas {
  constructor(w = 1, h = 1, data) { this.width = w; this.height = h; this._d = data || null; }
  get data() { if (!this._d || this._d.length !== this.width * this.height * 4) this._d = new Uint8ClampedArray(this.width * this.height * 4); return this._d; }
  getContext() {
    const cv = this;
    return {
      drawImage(src, x, y, w, h) {
        const sw = src.width, sh = src.height, sd = src.data; w = w || sw; h = h || sh; const dd = cv.data, fx = sw / w, fy = sh / h;
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {      // moyenne de surface (réduction)
          const x0 = Math.floor(i * fx), x1 = Math.max(x0 + 1, Math.floor((i + 1) * fx)), y0 = Math.floor(j * fy), y1 = Math.max(y0 + 1, Math.floor((j + 1) * fy));
          let r = 0, g = 0, b = 0, n = 0;
          for (let yy = y0; yy < y1 && yy < sh; yy++) for (let xx = x0; xx < x1 && xx < sw; xx++) { const k = (yy * sw + xx) * 4; r += sd[k]; g += sd[k + 1]; b += sd[k + 2]; n++; }
          const o = (j * cv.width + i) * 4; dd[o] = r / n; dd[o + 1] = g / n; dd[o + 2] = b / n; dd[o + 3] = 255;
        }
      },
      getImageData(x, y, w, h) {
        const out = new Uint8ClampedArray(w * h * 4), sd = cv.data;
        for (let j = 0; j < h; j++) { const yy = y + j; if (yy < 0 || yy >= cv.height) continue; for (let i = 0; i < w; i++) { const xx = x + i; if (xx < 0 || xx >= cv.width) continue; const s = (yy * cv.width + xx) * 4, o = (j * w + i) * 4; out[o] = sd[s]; out[o + 1] = sd[s + 1]; out[o + 2] = sd[s + 2]; out[o + 3] = 255; } }
        return { data: out, width: w, height: h };
      },
    };
  }
}
global.window = global; global.__fs = fs; global.devicePixelRatio = 1;
global.document = { querySelector: () => dummy, querySelectorAll: () => [], createElement: t => (t === "canvas" ? new Canvas() : dummy), addEventListener() {}, body: dummy, head: dummy };
global.localStorage = { getItem: () => null, setItem() {} };
Object.defineProperty(global, "navigator", { value: {}, configurable: true });
global.location = { protocol: "http:" }; global.addEventListener = () => {}; global.scrollTo = () => {}; global.setTimeout = () => 0; global.alert = () => {}; global.requestAnimationFrame = () => 0;
const src = fs.readFileSync(html, "utf8"), js = src.slice(src.indexOf("<script>") + 8, src.lastIndexOf("</script>"));
const load = n => { const b = fs.readFileSync(path.join(dir, n + ".rgba")), w = b.readUInt32LE(0), h = b.readUInt32LE(4); return new Canvas(w, h, new Uint8ClampedArray(b.buffer, b.byteOffset + 8, w * h * 4)); };
const tail = `
;globalThis.__run = (ph, cfg, dbgOut) => {
  Object.assign(S.cfg, cfg); A = { photo: ph, spots: [], hits: [], sel: -1, mode: "hits" }; window._dbg = true; window._tstBands = true; detect();
  const D = window._dbg, k = Math.min(1, 1100 / Math.max(ph.width, ph.height));
  const res = { n: A.spots.length, hits: A.hits.map(h => [Math.round(h.x), Math.round(h.y), hitVal(h), h.unsure ? "?" : "", cordon(h) ? "c" : ""]),
    vp: D.vp && D.vp.map(v => Math.round(v / k)), arrows: (D.arrows || []).map(a => a.e.map(e => [Math.round(e.x / k), Math.round(e.y / k), e.out ? "out" : "in"]).concat([a.m.join("/"), +(a.cov || 0).toFixed(2)])) };
  if (dbgOut && D.mask) {
    const w = D.w, h = D.h, o = Buffer.alloc(8 + w * h * 3); o.writeUInt32LE(w, 0); o.writeUInt32LE(h, 4);
    for (let i = 0; i < w * h; i++) { const m = D.mask[i]; o[8 + i * 3] = m ? 255 : D.d[i * 4] * 0.5; o[9 + i * 3] = m ? 0 : D.d[i * 4 + 1] * 0.5; o[10 + i * 3] = m ? 255 : D.d[i * 4 + 2] * 0.5; }
    const dot = (x, y, r, c) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { const X = Math.round(x + xx), Y = Math.round(y + yy); if (X >= 0 && Y >= 0 && X < w && Y < h) { const p = 8 + (Y * w + X) * 3; o[p] = c[0]; o[p + 1] = c[1]; o[p + 2] = c[2]; } } };
    for (const a of D.arrows) { const [e0, e1] = a.e; for (let t = 0; t <= 1; t += 0.004) dot(e0.x + (e1.x - e0.x) * t, e0.y + (e1.y - e0.y) * t, 0, [0, 255, 0]); dot(e0.x, e0.y, 2, e0.out ? [255, 255, 255] : [0, 255, 255]); dot(e1.x, e1.y, 2, e1.out ? [255, 255, 255] : [0, 255, 255]); }
    for (const sp of A.spots) for (const R of [2, 4, 5]) { const e = ellAt(sp, R); for (let q = 0; q < 720; q++) { const a = q / 720 * 2 * Math.PI, ex = e.a * Math.cos(a), ey = e.b * Math.sin(a); dot((e.cx + ex * Math.cos(e.th) - ey * Math.sin(e.th)) * k, (e.cy + ex * Math.sin(e.th) + ey * Math.cos(e.th)) * k, 0, [255, 255, 0]); } }
    for (const hh of A.hits) dot(hh.x * k, hh.y * k, 3, [255, 128, 0]);
    globalThis.__fs.writeFileSync(dbgOut, o);
  }
  return res;
};`;
(0, eval)(js + tail);
for (const n of names) {
  const r = __run(load(n), { face: "tri", diam: 40, shaft: 6, ten: "x", perEnd: 3 }, path.join(dir, n + ".dbg"));
  console.log(n, JSON.stringify(r));
}

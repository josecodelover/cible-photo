"""Évalue la détection sur les photos d'essai dont la vérité est relevée dans essais/verite.json.

    python outils/evaluer.py [index.html] [dossier-de-travail]

Pour chaque flèche : écart entre l'impact proposé le plus proche et le bout planté relevé à l'œil,
ramené à une photo de 1126 px de large (un anneau du trispot y fait environ 41 px). L'impact proposé
est le centre du trou, un rayon de tube en retrait du bout : un écart de 5 à 10 px est normal.
"""
import json, os, subprocess, sys, tempfile
sys.stdout.reconfigure(encoding="utf-8")
from PIL import Image, ImageOps

ici = os.path.dirname(os.path.abspath(__file__))
html = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ici, "..", "index.html")
tmp = sys.argv[2] if len(sys.argv) > 2 else os.path.join(tempfile.gettempdir(), "cible-photo-essais")
ess = os.path.join(ici, "..", "essais")
os.makedirs(tmp, exist_ok=True)
verite = {k: v for k, v in json.load(open(os.path.join(ess, "verite.json"), encoding="utf8")).items() if not k.startswith("_")}

noms, ech = [], {}
for f in verite:
    n = os.path.splitext(f)[0]; raw = os.path.join(tmp, n + ".rgba"); noms.append(n)
    im = ImageOps.exif_transpose(Image.open(os.path.join(ess, f))).convert("RGBA"); ech[n] = im.width / 1126
    if not os.path.exists(raw):
        w, h = im.size; open(raw, "wb").write(w.to_bytes(4, "little") + h.to_bytes(4, "little") + im.tobytes())

env = dict(os.environ, ORIG="1")
out = subprocess.run(["node", os.path.join(ici, "essai-node.js"), html, tmp] + noms, capture_output=True, text=True, encoding="utf8", env=env).stdout
res = {l.split(" ", 1)[0]: json.loads(l.split(" ", 1)[1]) for l in out.splitlines() if " {" in l}

errs, bad = [], 0
for f, pts in verite.items():
    n = os.path.splitext(f)[0]; k = ech[n]; hits = res.get(n, {}).get("hits", []); ligne = []
    for (x, y) in pts:
        e = min((((h[0] - x) ** 2 + (h[1] - y) ** 2) ** 0.5 / k for h in hits), default=999)
        errs.append(e); bad += e > 15; ligne.append(f"{e:5.0f}{'!' if e > 15 else ' '}")
    print(f"{n:22s}" + " ".join(ligne) + "   " + " ".join(h[2] for h in hits))
errs.sort()
print(f"flèches : {len(errs)}   écart > 15 px : {bad}   médiane : {errs[len(errs)//2]:.0f} px")

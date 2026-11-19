# Cible Photo

Application de tir à l'arc : on photographie le blason avec le téléphone, l'application repère les anneaux et les impacts, propose le score de chaque flèche et le note dans une feuille de marque.

- Blasons : trispot (6 à 10) et blason complet (1 à 10), 10 classique, X ou petit 10 poulies.
- Prise de vue guidée : gabarit à l'écran, consignes, puis contrôle de la photo (floue, coupée, trop en biais, trop petite, mal éclairée) avec demande de la refaire si besoin.
- Si plusieurs blasons sont dans l'image (cibles voisines en concours), l'application garde celui qui est entier et le plus au centre. Un spot en partie masqué par une flèche est placé d'après ses deux voisins, avec un avertissement.
- Chaque impact peut être déplacé, ajouté ou supprimé au doigt avant validation.
- Chaque impact est affiné sur la photo en pleine résolution : axe et largeur du tube mesurés sur ses bords, centre du trou placé un rayon en retrait du bout du tube, rayon recalé sur le trait imprimé voisin.
- Les flèches trop près d'une ligne pour trancher sont signalées « ⚠ cordon ». On peut alors prendre la flèche en **gros plan** (bouton « 🔍 Gros plan », toujours visible sous les flèches, puis choix de la flèche) : on touche le tube sur la photo rapprochée — l'application le cherche jusqu'à environ un doigt autour du point touché — et elle mesure l'écart entre le bord du tube et le trait.
- Trispot : chaque tube est suivi d'un bout à l'autre, même s'il passe au-dessus d'un autre spot ; l'impact est le bout planté, pas l'endroit où le tube croise un trait. L'ombre portée de la flèche n'est pas prise pour le tube : sur un anneau de couleur, elle garde la teinte de l'anneau. Deux flèches dans le même spot : seule la moins bonne compte, l'autre vaut M.
- Tout reste sur le téléphone : aucune photo n'est envoyée sur Internet.
- Mode intégré : ouverte dans un cadre avec `?embed=1&face=tri&diam=40&shaft=9&ten=small&per=3`, la page ne montre que la prise de vue et rend la volée lue à l'application hôte par `postMessage` (`cible-photo:end`, `cible-photo:cancel`). C'est ainsi que [Carnet de tir](https://github.com/josecodelover/carnet-de-tir) l'utilise pour sa saisie par photo, à partir d'une copie exacte de `index.html`.

## État du projet

Première confrontation à de vraies photos (trois volées sur trispot, 12 novembre 2026) : l'impact était lu le long du tube, là où il croisait un trait ou un autre spot, et non à la pointe. Cause : sur un vrai blason le tube est long (il sort souvent de l'image ou passe au-dessus du spot voisin), il est brillant et prend la couleur de l'anneau près de la pointe, et le papier est criblé de trous. L'assemblage du trispot a été refait en conséquence. Il n'a été vérifié que sur des captures d'écran de ces trois volées (8 impacts sur 9 replacés au bon endroit), pas encore sur les photos d'origine.

Deuxième confrontation (quatre volées sur trispot, 18 novembre 2026, photos d'origine) : sur le spot du haut, la flèche arrive par le haut et son ombre continue le tube vers le bas ; le suivi la prenait pour le tube et plaçait l'impact 40 à 140 px sous la pointe. Corrigé en 1.3.2 : les 4 impacts du spot du haut sont à moins de 10 px de la pointe. Restent sur ces 12 flèches : deux impacts du spot du bas lus 30 à 50 px au-delà de la pointe, à travers les trous groupés au centre, et une flèche vue presque de face (spot du milieu) remplacée par un trou.

En 1.3.3, avec quatre autres volées en pleine résolution : l'affinage du bout, lui aussi, suivait l'ombre (jusqu'à 65 px au-delà de la pointe) ; il s'arrête maintenant où l'ombre commence. `outils/evaluer.py` mesure l'écart à la pointe relevée à l'œil (`essais/verite.json`) : sur 24 flèches, 6 à plus de 15 px (8 en 1.3.2), écart médian 6 px (un anneau fait environ 41 px). Les 6 : deux flèches au gros empennage tout près du blason non trouvées (un trou à leur place) ; deux spots du bas où un trou collé à la pointe se confond avec le tube ; un pli du papier suivi au-delà de la pointe ; un écart de 16 px. Le blason complet n'a pas encore été confronté à de vraies photos.

En 1.3.4, avec six volées tirées en extérieur en fin de journée (18 novembre 2026, soleil rasant, photos prises de plus loin) : l'écart est maintenant compté en centièmes d'anneau, faux au-delà de 35. Sur 40 flèches dont la pointe est visible, 13 fausses au lieu de 18, écart médian 23 centièmes. Trois corrections : le contour d'un spot n'est plus déformé par les impacts groupés au bord du jaune ; un spot introuvable est recalé sur ses anneaux de couleur, et non plus seulement copié de ses voisins ; le côté empenné d'une flèche, quand il est net, l'emporte sur la perspective pour savoir quel bout est planté. Restent fausses : des pointes dans une ombre de soleil profonde (le tube reflète le jaune et l'ombre est plus nette que lui), des trous collés à la pointe, des flèches vues presque de face, et une volée où deux flèches se disputent le même spot.

Sur le banc d'essai simulé (60 scènes par blason, `outils/banc-essai.js`) :

| | Trispot | Blason complet |
|---|---|---|
| Flèches trouvées | 96 % | 76 % |
| Erreur de position médiane | 0,016 anneau (0,16 sans l'affinage) | 0,016 anneau (0,17) |
| Bonne valeur, parmi les flèches trouvées | 99 % (93 %) | 90 % (86 %) |
| Valeur fausse sans alerte | 0 sur 172 (6) | 1 sur 136 (7) |

Marge au-delà de laquelle un cordon est signalé : 0,10 anneau pour un impact non affiné, 0,06 pour un impact affiné, 0,03 après un gros plan. Sur 100 flèches simulées à moins de 0,12 anneau d'un trait, le gros plan a pu mesurer 92 fois et s'est trompé 2 fois, les deux à moins de 0,03 anneau du trait, donc signalées.

Il y a toujours quelques faux impacts et des flèches manquées : il faut relire la proposition avant de valider. Limites connues : tube clair sur la zone blanche, tube noir planté dans le noir (signalé en pointillé), flèches qui se croisent, flèche en plein centre du blason complet. Le gros plan suppose une photo prise presque de face ; il refuse de mesurer si le tube ou le trait ne se distinguent pas.

## Utilisation

**Dans le navigateur (Android ou iPhone)** : une fois le site publié avec GitHub Pages, ouvrir son adresse, puis « Ajouter à l'écran d'accueil ». L'application fonctionne ensuite hors ligne.

**Android (APK)** : installer `android/out/CiblePhoto.apk` (signé avec une clé de développement).

## Mise en ligne avec GitHub Pages

Dans le dépôt : **Settings → Pages**, *Source* = **Deploy from a branch**, branche **main**, dossier **/ (root)**, puis **Save**. Le site est ensuite à l'adresse `https://<identifiant>.github.io/<nom-du-dépôt>/`.

Après une mise à jour de `index.html`, augmenter `VERSION` dans `sw.js`, sinon les téléphones gardent l'ancienne version en cache.

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | L'application complète (HTML, CSS, JavaScript, analyse d'image) |
| `manifest.webmanifest`, `sw.js`, `icon-*.png` | Installation sur l'écran d'accueil et fonctionnement hors ligne |
| `android/` | Enveloppe Android (WebView) et script `build_apk.ps1` (sans Gradle : aapt2, javac, d8, apksigner) |
| `android/make_icons.ps1` | Génère les icônes |
| `outils/essai-node.js`, `outils/image-brute.py` | Lance la détection hors navigateur (Node) sur une photo et produit une image de contrôle ; mode d'emploi en tête du fichier |
| `outils/evaluer.py` | Écart à la pointe sur les vraies photos de `essais/` dont la vérité est relevée dans `essais/verite.json` (dossier local, non publié) |
| `outils/banc-essai.js` | Banc d'essai (scènes simulées reproductibles, gros plans simulés) ; non chargé par l'application |

Dans la console du navigateur, `selfTest(20)` lance le banc d'essai sur 20 cibles simulées. Le mode d'emploi du banc complet est en tête de `outils/banc-essai.js`.

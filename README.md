# Cible Photo

Application de tir à l'arc : on photographie le blason avec le téléphone, l'application repère les anneaux et les impacts, propose le score de chaque flèche et le note dans une feuille de marque.

- Blasons : trispot (6 à 10) et blason complet (1 à 10), 10 classique, X ou petit 10 poulies.
- Prise de vue guidée : gabarit à l'écran, consignes, puis contrôle de la photo (floue, coupée, trop en biais, trop petite, mal éclairée) avec demande de la refaire si besoin.
- Chaque impact peut être déplacé, ajouté ou supprimé au doigt avant validation. Les flèches à moins d'un dixième d'anneau d'une ligne sont signalées « ⚠ cordon » : à juger sur la cible.
- Tout reste sur le téléphone : aucune photo n'est envoyée sur Internet.

## État du projet

La détection a été réglée sur des photos simulées uniquement. Sur ce banc d'essai elle trouve environ 87 % des flèches sur trispot et 72 % sur blason complet, avec quelques faux impacts : il faut toujours relire la proposition avant de valider. Limites connues : tube clair sur la zone blanche, tube noir planté dans le noir.

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

Dans la console du navigateur, `selfTest(20)` lance le banc d'essai sur 20 cibles simulées.

# Tetris App

Application Tetris en React + TypeScript + Vite.

L'app propose un jeu jouable directement dans le navigateur, avec:

- le gameplay Tetris classique
- un systeme de score et de progression
- une page d'accueil, un classement et un profil utilisateur
- une authentification Firebase
- des sauvegardes de score locales en secours si Firebase n'est pas disponible
- des powerups aleatoires qui peuvent detruire une ligne, une colonne ou provoquer une explosion locale

## Prerequis

- Node.js 18+ recommande
- npm

## Installation

```bash
npm install
```

## Configuration Firebase

Le projet utilise Firebase pour l'authentification et le stockage des scores.

Crée un fichier `.env` a la racine du projet si tu veux activer ces fonctions:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Si ces variables ne sont pas renseignees, les pages Firebase peuvent ne pas fonctionner correctement, mais le jeu reste lancable.

## Lancer le projet

### Mode developpement

```bash
npm run dev
```

Puis ouvre l'URL affichee par Vite, en general `http://localhost:5173`.

### Build de production

```bash
npm run build
```

### Previsualiser le build

```bash
npm run preview
```

## Commandes utiles

```bash
npm run lint
npm run typecheck
npm run format
npm run format:fix
```

## Fonctionnalites

- Jeu Tetris complet avec score, niveau et prochaine piece
- Sauvegarde des scores
- Authentification login / register
- Classement des meilleurs scores
- Interface unifiee et responsive
- Powerups de jeu:
  - bombe: explosion autour de la case
  - ligne: destruction de la ligne entiere
  - colonne: destruction de la colonne entiere

## Organisation rapide

- `src/pages/` contient les ecrans principaux
- `src/components/` contient les composants reutilisables
- `src/services/` contient Firebase et la logique de score
- `src/store/` contient Redux
- `src/config/firebase.ts` contient la configuration Firebase

## Notes

- Le jeu fonctionne sans compte, mais la sauvegarde de score est plus complete avec Firebase.
- Si tu changes la configuration Firebase, pense a verifier aussi les regles Firestore.

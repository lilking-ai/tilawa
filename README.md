# Tilawa — Quran Reader & Reciters

Read the Quran with translation, listen to hundreds of reciters (from mp3quran.net),
bookmark verses, and sync your favorites and settings across devices with Google sign-in.
Installs on iPhone and Android as a home-screen app. Free to host.

**Live app:** https://lilking-ai.github.io/tilawa/

## Install on iPhone (free)

1. Open https://lilking-ai.github.io/tilawa/ in **Safari**.
2. Tap **Share** → **Add to Home Screen** → Add.

It opens full-screen with its own icon and shows play/pause/next on the lock screen
(on recent iOS versions). Surahs you've opened can be read offline.

On Android: open the link in Chrome → menu → **Install app**.

## What's inside

```
firebase.json            Firebase Hosting + Firestore config (serves the docs/ folder)
.firebaserc              Your Firebase project ID goes here
firestore.rules          Security: each user can only read/write their own data
docs/                    The app (GitHub Pages serves this folder too)
  index.html, styles.css, app.js
  sync.js                Google sign-in + Firestore sync
  firebase-config.js     ← paste your Firebase web config here
  sw.js, manifest.webmanifest, icons/   Installable app + offline reading
```

The app runs without a Firebase config — just without sign-in and sync.

## Turn on sign-in & sync (Firebase, free Spark plan)

1. **Create a project** at https://console.firebase.google.com → *Add project*.
2. **Add a web app**: Project overview → the `</>` icon → register an app (name: Tilawa).
   Copy the `firebaseConfig` values into `docs/firebase-config.js` (you can edit it right on GitHub).
3. **Turn on Google sign-in**: Build → Authentication → Get started → Sign-in method → Google → Enable.
4. **Allow this site**: Authentication → Settings → Authorized domains → Add `lilking-ai.github.io`.
5. **Create the database**: Build → Firestore Database → Create database → *Production mode*.
6. **Publish the security rules**: Firestore → Rules → paste the contents of `firestore.rules` → Publish.

That's it — the GitHub Pages site picks up the config automatically.

### Optional: host on Firebase instead (`*.web.app`)

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # pick your project
firebase deploy           # publishes docs/ and firestore.rules
```

When you change files, bump `VERSION` in `docs/sw.js` so installed copies refresh.

## Data sources

- Quran text & translations: api.alquran.cloud (fallback: api.quran.com)
- Reciters & full-surah audio: mp3quran.net
- Verse-by-verse audio: cdn.islamic.network (via alquran.cloud)

# Tilawa — Quran Reader, Reciters & AI Sheikh

Read the Quran in **47 languages** (Somali first), listen to **244 reciters**, bookmark verses,
sign in with a **one-tap email link** from a no-reply address, get a **welcome email**, and learn
with a gentle **AI Sheikh**. Installs on iPhone and Android as a home-screen app. Free to run.

**Live app:** https://lilking-ai.github.io/tilawa/

## Install on iPhone (free)
Open the link in **Safari** → **Share** → **Add to Home Screen**. On Android: Chrome → menu → **Install app**.

## What works right away
Reading, translations in 47 languages, all reciters, verse-by-verse audio, bookmarks, the long welcome page
and the language chooser. Sign-in, sync, the welcome email and the AI Sheikh switch on after the setup below.

## Switch on sign-in, sync and the AI Sheikh (Firebase, free Spark plan, ~15 minutes)
You can do all of this from a phone browser. Edit files right on GitHub (open the file → pencil icon → *Commit changes*).

1. **Create a project** at https://console.firebase.google.com → *Add project* (Analytics optional).
2. **Add a web app**: Project overview → `</>` → name it Tilawa → copy the `firebaseConfig` values into
   `docs/firebase-config.js` (section 1).
3. **Email-link sign-in**: Build → Authentication → Get started → Sign-in method →
   enable **Email/Password**, then also enable **Email link (passwordless sign-in)** → Save.
   (Optional: enable **Google** too.)
4. **Allow this site**: Authentication → Settings → Authorized domains → Add `lilking-ai.github.io`.
5. **Sender name**: Authentication → Templates → edit the sender name to `Tilawa`. Sign-in emails come from
   `noreply@YOUR_PROJECT_ID.firebaseapp.com` — a no-reply address.
6. **Database**: Build → Firestore Database → Create database → *Production mode* → then the **Rules** tab →
   paste everything from `firestore.rules` → **Publish**.
7. **AI Sheikh**: Build → **AI Logic** → Get started → choose **Gemini Developer API** (free, no card needed).
   Recommended: also turn on **App Check** so others can't use your free AI quota.

## Lovely welcome email (free, optional)
1. Create a free account at https://www.emailjs.com (200 emails/month free).
2. **Email Services** → Add service → connect a Gmail you make for the app (e.g. `tilawa.noreply@gmail.com`).
3. **Email Templates** → Create → set **Subject** `{{subject}}`, **To Email** `{{to_email}}`, **From Name** `Tilawa` →
   in Content choose the code editor and paste `emails/welcome.html` → Save.
4. Put the **Service ID**, **Template ID** and **Public Key** (Account → General) into `docs/firebase-config.js` (section 2).
5. Account → Security: allow only `lilking-ai.github.io`.

The email is sent once, after a new person signs up and picks their language, written in that language.

## How sign-in works
1. Someone enters their email on the welcome page → Firebase emails them a sign-in link from the no-reply address.
2. Tapping the link signs them in. If it opens in a different browser than the app (common on iPhone with the
   home-screen app), they can long-press the link, copy it, and paste it into the app's “Paste the sign-in link” box.
3. They choose their language (Somali first, then English, Arabic and 44 more), and the welcome email goes out.

## Files
```
docs/                 The app (GitHub Pages serves this folder)
  index.html, styles.css, extras.css, app.js
  i18n.js             Languages + Somali/English/Arabic text (hand-written)
  i18n-extra.js       44 more languages (machine-translated - corrections welcome)
  onboarding.js       Long welcome/sign-up page + language chooser
  sync.js             Email-link & Google sign-in, sync, welcome email
  sheikh.js           AI Sheikh (Firebase AI Logic / Gemini)
  fb.js               Shared Firebase setup
  firebase-config.js  ← your keys go here
  sw.js, manifest.webmanifest, icons/
emails/welcome.html   Welcome email template for EmailJS
firestore.rules       Database security rules
firebase.json         Optional: deploy to Firebase Hosting instead (`firebase deploy`)
```

## About the AI Sheikh
It is an AI, not a real scholar, and can make mistakes — the app says so clearly. It is instructed to be gentle,
cite Quran references, admit uncertainty, avoid sectarian disputes, and send people to a qualified scholar for
personal rulings. Each person can ask up to 40 questions a day (change `dailyLimit` in `firebase-config.js`).

## Data sources
Quran text & translations: api.alquran.cloud (fallback api.quran.com) · Reciters: mp3quran.net ·
Verse audio: cdn.islamic.network

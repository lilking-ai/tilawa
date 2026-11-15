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

## Sign-in (Firebase, free Spark plan)
Firebase project: **tilwa-d7b7d** (its settings are already in `docs/firebase-config.js`).
People see a sign-in screen right after the opening animation, with **Log in**, **Sign up** and **Forgot password?**
(email + password), plus Google. They can also continue without an account.

In the Firebase console (works in Safari on iPad):
1. Build → **Authentication** → Get started → Sign-in method → turn on **Email/Password** (not "Email link").
   Optional: turn on **Google**.
2. Authentication → **Settings** → Authorized domains → add `lilking-ai.github.io`.
3. Authentication → **Templates** → set the sender name to `Tilawa`. Password-reset emails come from
   `noreply@tilwa-d7b7d.firebaseapp.com`, a no-reply address.
4. Build → **Firestore Database** → Create database → *Production mode* → **Rules** tab → paste everything from
   `firestore.rules` → **Publish**. This keeps each person's bookmarks and favourites.

## "Thank you for joining" email (free, optional)
1. Create a free account at https://www.emailjs.com (200 emails/month free).
2. **Email Services** → Add service → connect a Gmail you make for the app (e.g. `tilawa.noreply@gmail.com`).
3. **Email Templates** → Create → set **Subject** `{{subject}}`, **To Email** `{{to_email}}`, **From Name** `Tilawa` →
   in Content choose the code editor and paste `emails/welcome.html` → Save.
4. Put the **Service ID**, **Template ID** and **Public Key** (Account → General) into `docs/firebase-config.js` (section 2).
5. Account → Security: allow only `lilking-ai.github.io`.

The no-reply thank-you email is sent once, only to new accounts, after they pick their language, written in that language.

## How sign-in works
1. After the opening animation, the sign-in screen shows **Sign up** for new people and **Log in** for people who have
   had an account on this device. Signed-in people go straight to the app.
2. **Forgot password?** sends Firebase's reset email (no-reply) in the person's language where Firebase has it.
3. After signing up they choose their language (Somali first, then English, Arabic and 44 more), and the thank-you email goes out.

## Files
```
docs/                 The app (GitHub Pages serves this folder)
  index.html, styles.css, extras.css, app.js
  i18n.js             Languages + Somali/English/Arabic text (hand-written)
  i18n-extra.js       44 more languages (machine-translated - corrections welcome)
  onboarding.js       Long welcome/sign-up page + language chooser
  sync.js             Email + password & Google sign-in, sync, thank-you email
  sheikh.js           AI Sheikh (Firebase AI Logic / Gemini)
  fb.js               Shared Firebase setup
  firebase-config.js  ← your keys go here
  sw.js, manifest.webmanifest, icons/
emails/welcome.html   Thank-you email template for EmailJS
firestore.rules       Database security rules
firebase.json         Optional: deploy to Firebase Hosting instead (`firebase deploy`)
```

## About the AI Sheikh

**Closed until December (in shaa Allah).** The app shows a "closed for upgrades" message and the ElevenLabs agent is archived,
so no credits are used. To reopen: set `const OPEN = true` in `docs/sheikh.js` and unarchive the agent in ElevenLabs.
The AI Sheikh runs on an ElevenLabs agent called **Tilawa AI Sheikh** (agent id `agent_8601m7ddnakpfdqv57gk9n1w6pfz`),
so it works without Firebase. You can type to it or tap the microphone and talk; it listens and answers out loud.
It uses your ElevenLabs credits. Limits are set on the agent: calls end after 5 minutes, at most 3 at once and
60 a day; each phone is also limited to 40 messages and 8 voice chats a day (change these in `docs/sheikh.js`).
Voice recordings are not kept and transcripts are deleted after 30 days. Edit the agent's prompt, voice or limits
at https://elevenlabs.io/app/agents.

It is an AI, not a real scholar, and can make mistakes - the app says so clearly.

## Recitation checker
Tap the microphone on any verse (or "Check my recitation" under the surah title), recite, and each word is marked
green (correct), red (wrong - tap to see what was heard) or crossed out (missed). It uses the phone's built-in speech
recognition (Safari on iPhone, Chrome on Android/computer), checks words rather than every tajweed rule, and can
send your mistakes to the AI Sheikh for help.

## Data sources
Quran text & translations: api.alquran.cloud (fallback api.quran.com) · Reciters: mp3quran.net ·
Verse audio: cdn.islamic.network

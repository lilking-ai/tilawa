// ===== Tilawa settings (safe to keep public; access is protected by firestore.rules) =====

// 1) Firebase web app config
//    Firebase console -> Project settings -> General -> Your apps -> Web app -> "SDK setup and configuration" -> Config.
//    Until you replace these, the app still works - just without sign-in, sync and the AI Sheikh.
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// 2) Lovely welcome email (free) - https://www.emailjs.com
//    Email Services -> your Service ID; Email Templates -> your Template ID; Account -> General -> Public Key.
//    Leave as is to skip the welcome email.
export const emailjsConfig = {
  serviceId: "YOUR_SERVICE_ID",
  templateId: "YOUR_TEMPLATE_ID",
  publicKey: "YOUR_PUBLIC_KEY",
};

// 3) AI Sheikh - Firebase console -> AI Logic -> Get started -> Gemini Developer API (free plan).
//    Models are tried in this order; if one isn't available the next is used.
export const aiConfig = {
  models: ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"],
  dailyLimit: 40, // questions per person per day
};

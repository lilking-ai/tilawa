// ===== Tilawa settings (safe to keep public; access is protected by firestore.rules) =====

// 1) Firebase web app config
//    Firebase console -> Project settings -> General -> Your apps -> Web app -> "SDK setup and configuration" -> Config.
//    Project: tilwa-d7b7d (Firebase console). These values are safe to be public.
export const firebaseConfig = {
  apiKey: "AIzaSyCdKVHc6rEuW4_HyNcAuXbIOFevAF6-OEo",
  authDomain: "tilwa-d7b7d.firebaseapp.com",
  projectId: "tilwa-d7b7d",
  storageBucket: "tilwa-d7b7d.firebasestorage.app",
  messagingSenderId: "52386063681",
  appId: "1:52386063681:web:2f359e27f490a903c5edc0",
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

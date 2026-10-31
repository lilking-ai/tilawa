// Shared Firebase app for Tilawa (sign-in, sync and the AI Sheikh).
import { firebaseConfig } from "./firebase-config.js";
export const SDK = "https://www.gstatic.com/firebasejs/13.1.0";
export const configured = !!(firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith("YOUR_"));
let appPromise = null;
export function getApp() {
  if (!configured) return Promise.resolve(null);
  if (!appPromise) appPromise = import(`${SDK}/firebase-app.js`).then((m) => m.initializeApp(firebaseConfig));
  return appPromise;
}

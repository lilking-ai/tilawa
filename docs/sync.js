// Tilawa - Firebase sign-in (email link from a no-reply address, or Google), Firestore sync,
// and a lovely welcome email (EmailJS) after a new person signs up and picks a language.
// The app (app.js) works without this file.
import { emailjsConfig } from "./firebase-config.js";
import { SDK, configured, getApp } from "./fb.js";

const T = window.Tilawa;
if (!T || !configured) {
  if (!configured) console.info("[Tilawa] Firebase not configured - running without sign-in/sync. Edit docs/firebase-config.js.");
} else {
  start().catch((e) => console.error("[Tilawa] Firebase failed to start", e));
}

const LS = {
  get: (k) => { try { return localStorage.getItem("tilawa." + k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem("tilawa." + k, v); } catch (e) {} },
  del: (k) => { try { localStorage.removeItem("tilawa." + k); } catch (e) {} },
};
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
const appUrl = () => location.origin + location.pathname;
const userInfo = (u) => (u ? { uid: u.uid, displayName: u.displayName, email: u.email, photoURL: u.photoURL } : null);

async function start() {
  const [authMod, fsMod, app] = await Promise.all([
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-firestore.js`),
    getApp(),
  ]);
  const { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut,
    sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, getAdditionalUserInfo, updateProfile } = authMod;
  const { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, onSnapshot, setDoc, serverTimestamp } = fsMod;

  const auth = getAuth(app);
  let db;
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch (e) {
    db = initializeFirestore(app, {});
  }
  T.setAuth({ configured: true });

  // ---------- email link (passwordless) ----------
  async function finishLink(email, link) {
    try {
      const res = await signInWithEmailLink(auth, email, link);
      LS.del("emailForSignIn");
      const name = LS.get("pendingName");
      if (name && !res.user.displayName) { try { await updateProfile(res.user, { displayName: name }); } catch (e) {} }
      LS.del("pendingName");
      if (location.search) history.replaceState(null, "", location.pathname + location.hash);
      T.setAuth({ user: userInfo(auth.currentUser) });
      emit("tilawa:signedin", { isNew: !!(getAdditionalUserInfo(res) || {}).isNewUser });
    } catch (e) {
      console.warn("[Tilawa] email link sign-in failed", e);
      emit("tilawa:linkerror", { code: e.code });
    }
  }
  if (isSignInWithEmailLink(auth, location.href)) {
    const email = LS.get("emailForSignIn");
    if (email) finishLink(email, location.href);
    else emit("tilawa:needemail", {});
  }
  window.addEventListener("tilawa:confirmemail", (e) => finishLink(e.detail.email, location.href));
  window.addEventListener("tilawa:pastelink", (e) => {
    const { email, link } = e.detail || {};
    if (!link || !isSignInWithEmailLink(auth, link)) { emit("tilawa:linkerror", { code: "invalid-link" }); return; }
    finishLink(email, link);
  });
  window.addEventListener("tilawa:emaillink", async (e) => {
    const { email, name } = e.detail || {};
    try {
      auth.languageCode = T.getLang(); // Firebase's sign-in email in the person's language where available
      await sendSignInLinkToEmail(auth, email, { url: appUrl(), handleCodeInApp: true });
      LS.set("emailForSignIn", email);
      if (name) LS.set("pendingName", name);
      emit("tilawa:emaillink-result", { ok: true, email });
    } catch (err) {
      console.warn("[Tilawa] sending sign-in link failed", err);
      emit("tilawa:emaillink-result", { ok: false, code: err.code });
    }
  });

  // ---------- Google (optional) ----------
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  getRedirectResult(auth).catch(() => {});
  window.addEventListener("tilawa:signin", async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if (e && /popup-blocked|operation-not-supported|cancelled-popup/.test(e.code || "")) {
        try { await signInWithRedirect(auth, provider); } catch (_) { T.toast("signInErr"); }
      } else if (!e || e.code !== "auth/popup-closed-by-user") {
        T.toast("signInErr");
      }
    }
  });
  window.addEventListener("tilawa:signout", () => signOut(auth));

  // ---------- welcome email ----------
  let welcomed = true, welcomeBusy = false;
  async function sendWelcome(user) {
    const c = emailjsConfig || {};
    if (!c.publicKey || !c.serviceId || !c.templateId || String(c.publicKey).startsWith("YOUR_")) return false;
    const name = user.displayName || LS.get("pendingName") || T.t("emFriend");
    const params = {
      to_email: user.email, to_name: name,
      subject: T.t("emSubject"), title: T.t("emTitle"), greeting: T.t("emGreeting").replace("{name}", name),
      message: T.t("emBody"), cta: T.t("emCta"), signature: T.t("emSign"),
      app_url: appUrl(), dir: T.dir(), lang: T.getLang(),
    };
    const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_id: c.serviceId, template_id: c.templateId, user_id: c.publicKey, template_params: params }),
    });
    if (!r.ok) console.warn("[Tilawa] welcome email failed", r.status, await r.text().catch(() => ""));
    return r.ok;
  }
  async function maybeWelcome() {
    const u = auth.currentUser;
    if (!u || !u.email || !ref || welcomed || welcomeBusy || !LS.get("langChosen")) return;
    welcomeBusy = true;
    try {
      if (await sendWelcome(u)) { welcomed = true; await setDoc(ref, { welcomedAt: serverTimestamp() }, { merge: true }); }
    } catch (e) { console.warn("[Tilawa] welcome email error", e); }
    welcomeBusy = false;
  }
  window.addEventListener("tilawa:langchosen", maybeWelcome);

  // ---------- Firestore sync ----------
  let unsub = null, ref = null, firstSnap = true, writeTimer = null;
  const union = (a = [], b = []) => [...new Set([...a, ...b])];
  async function push() {
    if (!ref) return;
    T.setAuth({ sync: "busy" });
    try {
      await setDoc(ref, { ...T.snapshot(), updatedAt: serverTimestamp() }, { merge: true });
      T.setAuth({ sync: "ok" });
    } catch (e) {
      console.warn("[Tilawa] sync write failed", e);
      T.setAuth({ sync: "err" });
    }
  }
  window.addEventListener("tilawa:change", () => { clearTimeout(writeTimer); writeTimer = setTimeout(push, 300); });

  onAuthStateChanged(auth, (user) => {
    if (unsub) { unsub(); unsub = null; }
    ref = null; firstSnap = true; welcomed = true;
    if (!user) { T.setAuth({ user: null, sync: "ok" }); return; }
    T.setAuth({ user: userInfo(user), sync: "busy" });
    ref = doc(db, "users", user.uid);
    unsub = onSnapshot(ref, async (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const remote = snap.exists() ? snap.data() : null;
      if (firstSnap) {
        firstSnap = false;
        welcomed = !!(remote && remote.welcomedAt);
        const local = T.snapshot();
        if (!remote) {
          await push();
        } else {
          const merged = {
            favs: union(remote.favs, local.favs),
            bookmarks: union(remote.bookmarks, local.bookmarks),
            settings: { ...local.settings, ...(remote.settings || {}) },
            last: remote.last || local.last,
          };
          // A language chosen on this device right after signing up wins over the account's old one.
          if (LS.get("langChosen") && local.settings && local.settings.lang) { merged.settings.lang = local.settings.lang; merged.settings.tr = local.settings.tr; }
          T.apply(merged, { first: true });
          await push();
        }
        T.toast("welcome");
        maybeWelcome();
        return;
      }
      if (remote && !snap.metadata.fromCache) T.apply(remote);
      T.setAuth({ sync: "ok" });
    }, (err) => {
      console.warn("[Tilawa] sync listen failed", err);
      T.setAuth({ sync: "err" });
    });
  });
}

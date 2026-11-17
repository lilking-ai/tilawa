// Tilawa - Firebase sign-in (email + password with "forgot password", or Google), Firestore sync,
// and a no-reply "thank you for joining" email (EmailJS) after a new person signs up and picks a language.
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
    createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, getAdditionalUserInfo, updateProfile, signInAnonymously } = authMod;
  const { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, onSnapshot, setDoc, serverTimestamp, increment, arrayUnion } = fsMod;

  const auth = getAuth(app);
  let db;
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch (e) {
    db = initializeFirestore(app, {});
  }
  T.setAuth({ configured: true });

  // ---------- email + password ----------
  // Firebase sends the "reset your password" email itself, from noreply@<project>.firebaseapp.com.
  const result = (detail) => emit("tilawa:auth-result", detail);
  window.addEventListener("tilawa:pwsignup", async (e) => {
    const { email, password, name } = e.detail || {};
    try {
      if (name) LS.set("pendingName", name);
      LS.set("newAccount", "1");
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (name) { try { await updateProfile(res.user, { displayName: name }); T.setAuth({ user: userInfo(res.user) }); } catch (_) {} }
      result({ ok: true, mode: "signup" });
      // Firebase's own no-reply email to every new email sign-up (free): "Thank you for joining Tilawa"
      // is set as its subject in the console (Authentication -> Templates -> Email address verification).
      auth.languageCode = T.getLang();
      // Sent without a "continue" link: a link to a site Firebase hasn't allowed makes it refuse the email,
      // and an immediate retry is then blocked as "too many attempts".
      try { await sendEmailVerification(res.user); }
      catch (err) { console.warn("[Tilawa] welcome email from Firebase failed", err); }
    } catch (err) {
      LS.del("newAccount");
      console.warn("[Tilawa] sign-up failed", err);
      result({ ok: false, mode: "signup", code: err.code });
    }
  });
  window.addEventListener("tilawa:pwlogin", async (e) => {
    const { email, password } = e.detail || {};
    try {
      await signInWithEmailAndPassword(auth, email, password);
      result({ ok: true, mode: "login" });
    } catch (err) {
      console.warn("[Tilawa] log-in failed", err);
      result({ ok: false, mode: "login", code: err.code });
    }
  });
  window.addEventListener("tilawa:pwreset", async (e) => {
    const { email } = e.detail || {};
    try {
      auth.languageCode = T.getLang(); // the reset email in the person's language where Firebase has it
      try { await sendPasswordResetEmail(auth, email, { url: appUrl() }); }
      catch (err) {
        // If this site isn't in Firebase's authorized domains yet, send the plain reset email instead.
        if (/unauthorized-continue-uri|invalid-continue-uri/.test(err.code || "")) await sendPasswordResetEmail(auth, email);
        else throw err;
      }
      result({ ok: true, mode: "reset", email });
    } catch (err) {
      // Don't reveal whether an account exists: treat "no such user" like success.
      if (/user-not-found/.test(err.code || "")) { result({ ok: true, mode: "reset", email }); return; }
      console.warn("[Tilawa] password reset failed", err);
      result({ ok: false, mode: "reset", code: err.code });
    }
  });

  // ---------- Google (optional) ----------
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  getRedirectResult(auth).then((res) => { if (res && (getAdditionalUserInfo(res) || {}).isNewUser) { LS.set("newAccount", "1"); maybeWelcome(); } }).catch(() => {});
  window.addEventListener("tilawa:signin", async () => {
    try {
      const res = await signInWithPopup(auth, provider);
      if ((getAdditionalUserInfo(res) || {}).isNewUser) { LS.set("newAccount", "1"); maybeWelcome(); }
      result({ ok: true, mode: "google" });
    } catch (e) {
      const code = (e && e.code) || "";
      if (/popup-blocked|operation-not-supported|cancelled-popup/.test(code)) {
        try { await signInWithRedirect(auth, provider); return; } catch (err) { result({ ok: false, mode: "google", code: err.code || code }); return; }
      }
      // Closing the Google window isn't an error worth showing.
      result({ ok: false, mode: "google", code: code === "auth/popup-closed-by-user" ? "" : code || "unknown" });
    }
  });
  window.addEventListener("tilawa:signout", () => signOut(auth));

  // ---------- "thank you for joining" email (sent once, only for new accounts) ----------
  // Every new account gets it - even if the database isn't reachable - but never twice.
  let welcomed = false, welcomeBusy = false;
  async function sendWelcome(user) {
    const c = emailjsConfig || {};
    if (!c.publicKey || !c.serviceId || !c.templateId || String(c.publicKey).startsWith("YOUR_")) return false;
    const name = user.displayName || LS.get("pendingName") || T.t("emFriend");
    const params = {
      to_email: user.email, to_name: name,
      subject: T.t("emSubject"), title: T.t("emTitle"), greeting: T.t("emGreeting").replace("{name}", name),
      message: T.t("emBody"), cta: T.t("emCta"), signature: T.t("emSign"), noreply: T.t("emNoReply"),
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
    if (!u || !u.email || welcomed || welcomeBusy || !LS.get("langChosen") || LS.get("newAccount") !== u.uid && LS.get("newAccount") !== "1") return;
    welcomeBusy = true;
    try {
      if (await sendWelcome(u)) {
        welcomed = true; LS.del("newAccount"); LS.del("pendingName");
        if (ref) { try { await setDoc(ref, { welcomedAt: serverTimestamp() }, { merge: true }); } catch (_) {} }
      }
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

  // ---- Visitor log -------------------------------------------------------
  // A stable per-device id so repeat visits from the same browser are counted
  // as the same person (not a fingerprint, just a random tag we set once).
  function deviceId() {
    let id = LS.get("did");
    if (!id) { id = "d-" + Math.random().toString(36).slice(2) + Date.now().toString(36); LS.set("did", id); }
    return id;
  }
  // Country of the device, from its IP, via a free no-key service. Cached for
  // the day so we don't look it up on every open.
  async function country() {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const c = JSON.parse(LS.get("geo") || "null");
      if (c && c.d === today) return c;
    } catch (e) {}
    try {
      const r = await fetch("https://get.geojs.io/v1/ip/geo.json");
      const j = await r.json();
      const c = { d: today, name: j.country || "", cc: j.country_code || "" };
      LS.set("geo", JSON.stringify(c));
      return c;
    } catch (e) { return { d: today, name: "", cc: "" }; }
  }
  // Write one log entry per app open (once per tab session, so a page that
  // fires auth twice isn't double-counted).
  let loggedGuest = false, loggedMember = false;
  async function logVisitor(user) {
    const guest = !user || user.isAnonymous;
    // Log the viewer once per session; but always log once more when they turn
    // into a real signed-in member, so the row gets their email and flips type.
    if (guest) { if (loggedGuest) return; loggedGuest = true; }
    else { if (loggedMember) return; loggedMember = true; }
    const geo = await country();
    const today = new Date().toISOString().slice(0, 10);
    const entry = {
      lastSeen: serverTimestamp(),
      visits: increment(1),
      days: arrayUnion(today),
      country: geo.name, cc: geo.cc,
      type: guest ? "guest" : "member",
      ua: (navigator.userAgent || "").slice(0, 160),
    };
    if (!guest) { entry.email = user.email || ""; entry.uid = user.uid; entry.signedInEver = true; }
    try {
      await setDoc(doc(db, "visitors", deviceId()), entry, { merge: true });
      await setDoc(doc(db, "stats", "global"), { views: increment(1), lastView: serverTimestamp() }, { merge: true });
    } catch (e) { console.warn("[Tilawa] visitor log skipped", e); }
  }

  onAuthStateChanged(auth, (user) => {
    if (unsub) { unsub(); unsub = null; }
    ref = null; firstSnap = true; welcomed = false;
    // Count this visitor (guest, anonymous viewer, or signed-in member).
    logVisitor(user);
    if (!user) {
      T.setAuth({ user: null, sync: "ok", ready: true });
      // Give every viewer a lightweight anonymous identity so even people who
      // never sign up or tap "continue as guest" get logged. Harmless if the
      // Anonymous provider isn't enabled yet — it just no-ops.
      signInAnonymously(auth).catch(() => {});
      return;
    }
    // Anonymous viewers are logged above but, for the app's UX, are treated as
    // "not signed in" — the sign-in screen and guest mode behave exactly as before.
    if (user.isAnonymous) { T.setAuth({ user: null, sync: "ok", ready: true }); return; }
    if (LS.get("newAccount") === "1") LS.set("newAccount", user.uid);
    setTimeout(maybeWelcome, 0);
    T.setAuth({ user: userInfo(user), sync: "busy", ready: true });
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
      maybeWelcome();
      T.setAuth({ sync: "err" });
    });
  });
}

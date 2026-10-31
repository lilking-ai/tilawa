// Tilawa — Firebase Auth + Firestore sync.
// The app (app.js) works without this file; this adds Google sign-in and
// syncs favorites, bookmarks, settings and last-read surah across devices.
import { firebaseConfig } from "./firebase-config.js";

const SDK = "https://www.gstatic.com/firebasejs/10.12.2";
const T = window.Tilawa;
const configured = !!(firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith("YOUR_"));

if (!T || !configured) {
  if (!configured) console.info("[Tilawa] Firebase not configured — running without sign-in/sync. Edit docs/firebase-config.js.");
} else {
  start().catch((e) => console.error("[Tilawa] Firebase failed to start", e));
}

async function start() {
  const [{ initializeApp }, authMod, fsMod] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-firestore.js`),
  ]);
  const { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } = authMod;
  const { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, onSnapshot, setDoc, serverTimestamp } = fsMod;

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  let db;
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch (e) {
    db = initializeFirestore(app, {}); // e.g. private browsing without IndexedDB
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  T.setAuth({ configured: true });
  getRedirectResult(auth).catch(() => T.toast("signInErr"));

  window.addEventListener("tilawa:signin", async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      // Popups are often blocked on mobile / in-app browsers — fall back to a redirect.
      if (e && /popup-blocked|operation-not-supported|cancelled-popup/.test(e.code || "")) {
        try { await signInWithRedirect(auth, provider); } catch (_) { T.toast("signInErr"); }
      } else if (!e || e.code !== "auth/popup-closed-by-user") {
        T.toast("signInErr");
      }
    }
  });
  window.addEventListener("tilawa:signout", () => signOut(auth));

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
  window.addEventListener("tilawa:change", () => {
    clearTimeout(writeTimer);
    writeTimer = setTimeout(push, 300);
  });

  onAuthStateChanged(auth, (user) => {
    if (unsub) { unsub(); unsub = null; }
    ref = null; firstSnap = true;
    if (!user) { T.setAuth({ user: null, sync: "ok" }); return; }

    T.setAuth({ user: { uid: user.uid, displayName: user.displayName, email: user.email, photoURL: user.photoURL }, sync: "busy" });
    ref = doc(db, "users", user.uid);

    unsub = onSnapshot(ref, async (snap) => {
      if (snap.metadata.hasPendingWrites) return; // our own local echo
      const remote = snap.exists() ? snap.data() : null;

      if (firstSnap) {
        firstSnap = false;
        const local = T.snapshot();
        if (!remote) {
          await push(); // first sign-in ever: upload what this device has
        } else {
          // Merge: keep favorites/bookmarks from both sides; account settings win.
          const merged = {
            favs: union(remote.favs, local.favs),
            bookmarks: union(remote.bookmarks, local.bookmarks),
            settings: { ...local.settings, ...(remote.settings || {}) },
            last: remote.last || local.last,
          };
          T.apply(merged, { first: true });
          const changed = merged.favs.length !== (remote.favs || []).length || merged.bookmarks.length !== (remote.bookmarks || []).length;
          if (changed) await push(); else T.setAuth({ sync: "ok" });
        }
        T.toast("welcome");
        return;
      }
      if (remote && !snap.metadata.fromCache) T.apply(remote); // live update from another device
      T.setAuth({ sync: "ok" });
    }, (err) => {
      console.warn("[Tilawa] sync listen failed", err);
      T.setAuth({ sync: "err" });
    });
  });
}

// Tilawa service worker: makes the app installable and lets surahs you've
// already opened be read offline. Audio is streamed, not cached.
const VERSION = "tilawa-v4";
const SHELL = ["./", "index.html", "styles.css", "extras.css", "i18n.js", "i18n-extra.js", "app.js", "onboarding.js", "fb.js", "sync.js", "sheikh.js", "firebase-config.js", "manifest.webmanifest", "icons/icon-192.png"];
const SHELL_CACHE = VERSION + "-shell";
const DATA_CACHE = VERSION + "-data";
const DATA_HOSTS = ["api.alquran.cloud", "api.quran.com", "mp3quran.net", "fonts.googleapis.com", "fonts.gstatic.com", "www.gstatic.com"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never touch audio, Firebase auth/Firestore traffic, or range requests.
  if (/\.mp3($|\?)/.test(url.pathname) || req.headers.has("range")) return;
  if (/googleapis\.com$/.test(url.hostname) && url.hostname !== "fonts.googleapis.com") return;
  if (url.pathname.startsWith("/__/") || url.searchParams.has("oobCode")) return; // Firebase Hosting reserved URLs (auth handler)

  // App shell: network first so updates show up, cache as fallback.
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(SHELL_CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
    );
    return;
  }

  // Quran text, reciter list, fonts, SDK: stale-while-revalidate.
  if (DATA_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req).then((res) => {
          if (res.ok || res.type === "opaque") cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});

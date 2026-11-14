// Tilawa - AI Sheikh: a gentle Quran teacher you can talk to (voice) or type to.
// Runs on an ElevenLabs agent ("Tilawa AI Sheikh"). The agent id is public; no secret keys live in the app.
const AGENT_ID = "agent_8601m7ddnakpfdqv57gk9n1w6pfz";
const SDK_URL = "https://cdn.jsdelivr.net/npm/@elevenlabs/client@1.36.1/+esm";
const DAILY_TEXT = 40, DAILY_VOICE = 8;

const T = window.Tilawa;
if (T) init();

function init() {
  const t = (k) => T.t(k);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sv = (p, w) => `<svg width="${w || 20}" height="${w || 20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const I = {
    chat: sv('<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1.1-4.6A8 8 0 1121 12z"/>'),
    send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20l18-8L3 4v6l12 2-12 2z"/></svg>',
    plus: sv('<path d="M12 5v14M5 12h14"/>'),
    x: sv('<path d="M18 6L6 18M6 6l12 12"/>'),
    mic: sv('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0014 0M12 17v5"/>', 26),
    stop: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  };

  const btn = document.createElement("button");
  btn.className = "iconbtn sheikh-btn"; btn.id = "sheikhBtn"; btn.type = "button";
  const anchor = document.getElementById("settingsBtn");
  anchor.parentNode.insertBefore(btn, anchor);
  const scrim = document.createElement("div"); scrim.className = "sh-scrim";
  const panel = document.createElement("aside"); panel.className = "sh"; panel.id = "sheikh"; panel.setAttribute("aria-label", "AI Sheikh");
  document.body.append(scrim, panel);

  let msgs = [], sdk = null, conv = null, kind = null, status = "disconnected", agentMode = "listening", idleTimer = null, waitTimer = null, raf = 0, starting = null;

  function label() { btn.innerHTML = I.chat; btn.title = t("shTitle"); btn.setAttribute("aria-label", t("shTitle")); }
  const isOpen = () => panel.classList.contains("open");

  function counter(key, max) {
    const day = new Date().toISOString().slice(0, 10);
    let c; try { c = JSON.parse(localStorage.getItem("tilawa." + key) || "{}"); } catch (e) { c = {}; }
    if (c.d !== day) c = { d: day, n: 0 };
    if (c.n >= max) return false;
    c.n++; try { localStorage.setItem("tilawa." + key, JSON.stringify(c)); } catch (e) {}
    return true;
  }
  function md(s) {
    const inline = (x) => x.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, "$1<i>$2</i>");
    let html = "", list = null;
    for (const raw of esc(s).split(/\n/)) {
      const l = raw.trim();
      const ul = /^[-*•]\s+(.*)/.exec(l), ol = /^\d+[.)]\s+(.*)/.exec(l);
      if (ul || ol) {
        const tag = ul ? "ul" : "ol";
        if (list !== tag) { if (list) html += `</${list}>`; html += `<${tag}>`; list = tag; }
        html += `<li dir="auto">${inline((ul || ol)[1])}</li>`; continue;
      }
      if (list) { html += `</${list}>`; list = null; }
      if (l) html += `<p dir="auto">${inline(l.replace(/^#{1,4}\s*/, ""))}</p>`;
    }
    if (list) html += `</${list}>`;
    return html;
  }
  function bubble(m) {
    if (m.role === "user") return `<div class="sh-m me" dir="auto">${esc(m.text)}</div>`;
    if (m.pending) return `<div class="sh-m bot"><span class="sh-typing" aria-label="${esc(t("shThinking"))}"><i></i><i></i><i></i></span></div>`;
    return `<div class="sh-m bot${m.err ? " err" : ""}">${md(m.text)}</div>`;
  }
  function renderMsgs() {
    const box = panel.querySelector(".sh-msgs"); if (!box) return;
    box.innerHTML = bubble({ role: "agent", text: t("shHello") }) + msgs.map(bubble).join("");
    box.scrollTop = box.scrollHeight;
  }
  function voiceLabel() {
    if (kind !== "voice") return t("shTalk");
    if (status === "connecting") return t("shConnecting");
    return agentMode === "speaking" ? t("shSpeaking") : t("shListening");
  }
  function renderVoice() {
    const v = panel.querySelector(".sh-voice"); if (!v) return;
    const on = kind === "voice";
    v.classList.toggle("on", on); v.classList.toggle("speaking", on && agentMode === "speaking");
    v.querySelector(".sh-mic").innerHTML = on ? I.stop : I.mic;
    v.querySelector(".sh-mic").setAttribute("aria-label", on ? t("shEnd") : t("shTalk"));
    v.querySelector(".sh-vstat").textContent = voiceLabel();
  }
  function render() {
    panel.dir = T.dir();
    panel.innerHTML = `<div class="sh-head"><div class="sh-av">${I.chat}</div><div class="t"><b>${esc(t("shTitle"))}</b><span class="muted">${esc(t("shSub"))}</span></div>
      <button class="iconbtn" data-act="new" title="${esc(t("shNew"))}" aria-label="${esc(t("shNew"))}">${I.plus}</button>
      <button class="iconbtn" data-act="close" aria-label="Close">${I.x}</button></div>
      <div class="sh-note">${esc(t("shNote"))}</div>
      <div class="sh-msgs" aria-live="polite"></div>
      <div class="sh-chips">${["shQ1", "shQ2", "shQ3", "shQ4"].map((k) => `<button type="button" data-q="${k}">${esc(t(k))}</button>`).join("")}</div>
      <div class="sh-voice"><button class="sh-mic" type="button" data-act="voice"></button><div class="sh-vstat"></div></div>
      <form class="sh-form"><textarea rows="1" dir="auto" placeholder="${esc(t("shPlaceholder"))}"></textarea>
      <button class="sh-send" aria-label="${esc(t("shSend"))}">${I.send}</button></form>`;
    renderMsgs(); renderVoice();
  }
  function open() { if (!panel.innerHTML) render(); else { panel.dir = T.dir(); } panel.classList.add("open"); scrim.classList.add("open"); }
  function close() { panel.classList.remove("open"); scrim.classList.remove("open"); if (kind === "voice") stop(); }

  const ctxText = (extra) => { const c = T.context(); return `The student's app language is ${T.langName()}. They are reading Surah ${c.en} (${c.surah}) in the Tilawa app.${extra ? " " + extra : ""}`; };

  function onMessage(m) {
    const role = m.role || (m.source === "ai" ? "agent" : "user");
    const text = (m.message || "").trim(); if (!text) return;
    if (role === "user") {
      const last = [...msgs].reverse().find((x) => x.role === "user");
      if (last && last.local && last.text === text) { last.local = false; return; }
      msgs = msgs.filter((x) => !x.pending); msgs.push({ role: "user", text });
    } else {
      clearTimeout(waitTimer);
      msgs = msgs.filter((x) => !x.pending); msgs.push({ role: "agent", text });
    }
    renderMsgs(); armIdle();
  }
  function armIdle() { clearTimeout(idleTimer); if (kind === "text") idleTimer = setTimeout(stop, 180000); }
  function levels() {
    cancelAnimationFrame(raf);
    const v = panel.querySelector(".sh-voice");
    const tick = () => {
      if (!conv || kind !== "voice" || !v) return;
      let lvl = 0;
      try { lvl = agentMode === "speaking" ? conv.getOutputVolume() : conv.getInputVolume(); } catch (e) {}
      v.style.setProperty("--lvl", Math.min(1, lvl * 2.2).toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  async function start(want, extra) {
    if (conv && kind === want) return conv;
    if (starting) { try { await starting; } catch (e) {} if (conv && kind === want) return conv; }
    await stop();
    kind = want; status = "connecting"; renderVoice();
    starting = (async () => {
      if (!sdk) sdk = await import(SDK_URL);
      const base = {
        agentId: AGENT_ID,
        textOnly: want === "text",
        onMessage,
        onModeChange: ({ mode }) => { agentMode = mode; renderVoice(); },
        onStatusChange: ({ status: s }) => { status = s; renderVoice(); },
        onDisconnect: () => { conv = null; kind = null; status = "disconnected"; cancelAnimationFrame(raf); renderVoice(); msgs = msgs.filter((x) => !x.pending); renderMsgs(); },
        onError: (e) => console.warn("[Tilawa] Sheikh error", e),
      };
      const ov = (lang) => ({ agent: { language: lang, firstMessage: want === "voice" ? t("shVoiceHi") : "" }, conversation: { textOnly: want === "text" } });
      let c;
      try { c = await sdk.Conversation.startSession({ ...base, overrides: ov(T.getLang()) }); }
      catch (e) { console.warn("[Tilawa] retrying in English", e); c = await sdk.Conversation.startSession({ ...base, overrides: ov("en") }); }
      conv = c; status = "connected";
      try { c.sendContextualUpdate(ctxText(extra)); } catch (e) {}
      if (want === "voice") levels();
      renderVoice(); armIdle();
      return c;
    })();
    try { return await starting; } catch (e) { kind = null; status = "disconnected"; renderVoice(); throw e; } finally { starting = null; }
  }
  async function stop() {
    clearTimeout(idleTimer); cancelAnimationFrame(raf);
    const c = conv; conv = null; kind = null; status = "disconnected";
    if (c) { try { await c.endSession(); } catch (e) {} }
    renderVoice();
  }
  async function sendText(text, extra) {
    text = (text || "").trim(); if (!text) return;
    if (!counter("shCount", DAILY_TEXT)) { msgs.push({ role: "user", text }, { role: "agent", text: t("shLimit"), err: true }); renderMsgs(); return; }
    msgs.push({ role: "user", text, local: true }, { role: "agent", pending: true }); renderMsgs();
    try {
      const c = conv || (await start("text", extra));
      if (extra && conv === c) { try { c.sendContextualUpdate(ctxText(extra)); } catch (e) {} }
      c.sendUserMessage(text);
      clearTimeout(waitTimer);
      waitTimer = setTimeout(() => { if (msgs.some((x) => x.pending)) { msgs = msgs.filter((x) => !x.pending); msgs.push({ role: "agent", text: t("shErr"), err: true }); renderMsgs(); } }, 35000);
      armIdle();
    } catch (e) {
      console.warn("[Tilawa] Sheikh text error", e);
      msgs = msgs.filter((x) => !x.pending); msgs.push({ role: "agent", text: t("shErr"), err: true }); renderMsgs();
    }
  }
  async function toggleVoice() {
    if (kind === "voice") { stop(); return; }
    if (!counter("shVoice", DAILY_VOICE)) { msgs.push({ role: "agent", text: t("shLimit"), err: true }); renderMsgs(); return; }
    try { await start("voice"); }
    catch (e) { console.warn("[Tilawa] voice start failed", e); msgs.push({ role: "agent", text: t("shVoiceErr"), err: true }); renderMsgs(); }
  }

  btn.addEventListener("click", () => (isOpen() ? close() : open()));
  scrim.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) close(); });
  panel.addEventListener("click", (e) => {
    const a = e.target.closest("[data-act]");
    if (a) {
      const act = a.dataset.act;
      if (act === "close") close();
      else if (act === "new") { stop(); msgs = []; renderMsgs(); }
      else if (act === "voice") toggleVoice();
      return;
    }
    const q = e.target.closest("[data-q]"); if (q) sendText(t(q.dataset.q));
  });
  panel.addEventListener("submit", (e) => {
    e.preventDefault();
    const i = panel.querySelector(".sh-form textarea"); if (!i) return;
    const v = i.value; i.value = ""; i.style.height = ""; sendText(v);
  });
  panel.addEventListener("keydown", (e) => {
    if (e.target.matches(".sh-form textarea") && e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); panel.querySelector(".sh-form").requestSubmit(); }
  });
  panel.addEventListener("input", (e) => { if (e.target.matches(".sh-form textarea")) { e.target.style.height = "auto"; e.target.style.height = Math.min(140, e.target.scrollHeight) + "px"; } });
  window.addEventListener("tilawa:ask", (e) => {
    const d = e.detail || {};
    open();
    const q = t("shAskVerse").replace("{ref}", `${d.surah}:${d.ayah}`).replace("{surah}", d.name || "");
    const extra = d.ar ? `The verse ${d.surah}:${d.ayah} in Arabic: ${d.ar}${d.tr ? ` | Translation shown in the app: ${d.tr}` : ""}` : "";
    sendText(q, extra);
  });
  window.addEventListener("tilawa:sheikhsay", (e) => { const d = e.detail || {}; open(); sendText(d.text, d.extra); });
  window.addEventListener("tilawa:sheikh", () => (isOpen() ? close() : open()));
  window.addEventListener("tilawa:closeall", () => { if (isOpen()) close(); });
  window.addEventListener("tilawa:langchange", () => { label(); if (panel.innerHTML) render(); if (conv) stop(); });
  window.addEventListener("pagehide", () => { if (conv) conv.endSession().catch(() => {}); });
  label();
}

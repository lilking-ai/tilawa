// Tilawa - AI Sheikh: a gentle AI teacher, powered by Firebase AI Logic (Gemini Developer API, free tier).
import { aiConfig } from "./firebase-config.js";
import { SDK, configured, getApp } from "./fb.js";

const T = window.Tilawa;
if (T) init();

function init() {
  const t = (k) => T.t(k);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MODELS = [...new Set([...((aiConfig && aiConfig.models) || []), "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"])];
  const DAILY = (aiConfig && aiConfig.dailyLimit) || 40;
  const I = {
    chat: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1.1-4.6A8 8 0 1121 12z"/><path d="M14.5 9.2a2.6 2.6 0 10.9 3.9 3.2 3.2 0 11-.9-3.9z" fill="currentColor" stroke="none"/></svg>',
    send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20l18-8L3 4v6l12 2-12 2z"/></svg>',
    plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  };
  const SYSTEM = (lang) => `You are "AI Sheikh", a gentle, warm and patient Islamic teacher inside the Tilawa Quran app. You are an AI, not a human scholar - never claim otherwise.
How to teach:
- Speak kindly and encouragingly, like a caring teacher with a beginner. Use simple words, short paragraphs and step-by-step explanations. When it helps, end with one gentle follow-up question.
- Base your answers on the Quran and authentic Sunnah. When you refer to the Quran, give the reference like (Al-Baqarah 2:255). Quote Arabic only when you are sure of the exact wording; otherwise explain the meaning.
- Where scholars differ, say briefly and respectfully that there are different views, without criticising any group. For personal rulings (fatwa), marriage/divorce, inheritance, health or legal matters, give general guidance and kindly advise asking a qualified local scholar or imam.
- If you are not sure, say so honestly. Never invent verses, hadith, narrators or references.
- Stay with the Quran, Islam, Arabic, tajweed, good character and learning. Gently steer back if asked about unrelated topics. Never produce hateful, extremist or harmful content.
- Reply in ${lang}, unless the student writes in another language - then reply in the language they used. Keep Quranic Arabic in Arabic script followed by its meaning.
- Keep answers short (usually under 180 words) unless the student asks for more.`;

  const btn = document.createElement("button");
  btn.className = "pill sheikh-btn"; btn.id = "sheikhBtn"; btn.type = "button";
  const anchor = document.getElementById("settingsBtn");
  anchor.parentNode.insertBefore(btn, anchor);
  const scrim = document.createElement("div"); scrim.className = "sh-scrim";
  const panel = document.createElement("aside"); panel.className = "sh"; panel.id = "sheikh"; panel.setAttribute("aria-label", "AI Sheikh");
  document.body.append(scrim, panel);

  let msgs = [], busy = false, aiMod = null, modelIdx = 0, model = null, modelLang = null, lastGate = "";

  function label() { btn.innerHTML = I.chat + `<span class="hide-m">${esc(t("shTitle"))}</span>`; btn.title = t("shTitle"); }
  function gateKey() { const A = T.authState(); return !configured ? "off" : !A.user ? "signin" : "chat"; }

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
    if (m.pending && !m.text) return `<div class="sh-m bot"><span class="sh-typing" aria-label="${esc(t("shThinking"))}"><i></i><i></i><i></i></span></div>`;
    return `<div class="sh-m bot${m.err ? " err" : ""}">${md(m.text)}</div>`;
  }
  function renderMsgs() {
    const box = document.getElementById("shMsgs"); if (!box) return;
    box.innerHTML = bubble({ role: "model", text: t("shHello") }) + msgs.map(bubble).join("");
    box.scrollTop = box.scrollHeight;
    const s = panel.querySelector(".sh-send"); if (s) s.disabled = busy;
  }
  function render() {
    panel.dir = T.dir();
    const g = gateKey(); lastGate = g;
    let body;
    if (g === "off") body = `<div class="sh-gate">${I.chat}<p>${esc(t("shOff"))}</p></div>`;
    else if (g === "signin") body = `<div class="sh-gate">${I.chat}<p>${esc(t("shSignIn"))}</p><button class="ob-btn primary" data-act="signin">${esc(t("signIn"))}</button></div>`;
    else body = `<div class="sh-msgs" id="shMsgs" aria-live="polite"></div>
      <div class="sh-chips">${["shQ1", "shQ2", "shQ3", "shQ4"].map((k) => `<button type="button" data-q="${k}">${esc(t(k))}</button>`).join("")}</div>
      <form class="sh-form" id="shForm"><textarea id="shIn" rows="1" dir="auto" placeholder="${esc(t("shPlaceholder"))}"></textarea>
      <button class="sh-send" aria-label="${esc(t("shSend"))}">${I.send}</button></form>`;
    panel.innerHTML = `<div class="sh-head"><div class="sh-av">${I.chat}</div><div class="t"><b>${esc(t("shTitle"))}</b><span class="muted">${esc(t("shSub"))}</span></div>
      ${g === "chat" ? `<button class="iconbtn" data-act="new" title="${esc(t("shNew"))}" aria-label="${esc(t("shNew"))}">${I.plus}</button>` : ""}
      <button class="iconbtn" data-act="close" aria-label="Close">${I.x}</button></div>
      <div class="sh-note">${esc(t("shNote"))}</div>${body}`;
    renderMsgs();
  }
  function open() { render(); panel.classList.add("open"); scrim.classList.add("open"); const i = document.getElementById("shIn"); if (i && matchMedia("(min-width:901px)").matches) i.focus(); }
  function close() { panel.classList.remove("open"); scrim.classList.remove("open"); }
  const isOpen = () => panel.classList.contains("open");

  function underLimit() {
    const day = new Date().toISOString().slice(0, 10);
    let c; try { c = JSON.parse(localStorage.getItem("tilawa.shCount") || "{}"); } catch (e) { c = {}; }
    if (c.d !== day) c = { d: day, n: 0 };
    if (c.n >= DAILY) return false;
    c.n++; try { localStorage.setItem("tilawa.shCount", JSON.stringify(c)); } catch (e) {}
    return true;
  }
  async function getModel() {
    const lang = T.langName();
    if (model && modelLang === lang) return model;
    if (!aiMod) aiMod = await import(`${SDK}/firebase-ai.js`);
    const app = await getApp();
    const ai = aiMod.getAI(app, { backend: new aiMod.GoogleAIBackend() });
    model = aiMod.getGenerativeModel(ai, { model: MODELS[modelIdx], systemInstruction: SYSTEM(lang), generationConfig: { temperature: 0.6, maxOutputTokens: 1200 } });
    modelLang = lang;
    return model;
  }
  async function ask(text, extra, onPartial) {
    const c = T.context();
    const prefix = `[App context, not written by the student: they are reading Surah ${c.en} (${c.surah}).${extra ? " " + extra : ""}]\n`;
    const history = msgs.slice(0, -2).filter((m) => !m.err && m.text).map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
    while (history.length && history[0].role !== "user") history.shift();
    for (;;) {
      try {
        const m = await getModel();
        const chat = m.startChat({ history });
        const res = await chat.sendMessageStream(prefix + text);
        let full = "";
        for await (const chunk of res.stream) { const s = chunk.text(); if (s) { full += s; onPartial(full); } }
        return full;
      } catch (e) {
        const msg = String((e && (e.message || e.code)) || "");
        if (/not found|404|not supported|unsupported|not available|deprecated|retired|no longer|invalid.*model|model.*invalid/i.test(msg) && modelIdx < MODELS.length - 1) {
          modelIdx++; model = null; continue;
        }
        throw e;
      }
    }
  }
  async function send(text, extra) {
    text = (text || "").trim();
    if (!text || busy || gateKey() !== "chat") return;
    const user = { role: "user", text };
    if (!underLimit()) { msgs.push(user, { role: "model", text: t("shLimit"), err: true }); user.err = true; renderMsgs(); return; }
    const bot = { role: "model", text: "", pending: true };
    msgs.push(user, bot); busy = true; renderMsgs();
    try {
      const reply = await ask(text, extra, (partial) => { bot.text = partial; renderMsgs(); });
      bot.text = reply || t("shErr"); if (!reply) { bot.err = user.err = true; }
    } catch (e) {
      console.warn("[Tilawa] AI Sheikh error", e);
      bot.text = t("shErr"); bot.err = user.err = true;
    }
    bot.pending = false; busy = false; renderMsgs();
  }

  btn.addEventListener("click", () => (isOpen() ? close() : open()));
  scrim.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) close(); });
  panel.addEventListener("click", (e) => {
    const a = e.target.closest("[data-act]");
    if (a) {
      const act = a.dataset.act;
      if (act === "close") close();
      else if (act === "new") { msgs = []; renderMsgs(); }
      else if (act === "signin") { close(); window.dispatchEvent(new CustomEvent("tilawa:showsignin")); }
      return;
    }
    const q = e.target.closest("[data-q]"); if (q) send(t(q.dataset.q));
  });
  panel.addEventListener("submit", (e) => {
    e.preventDefault();
    const i = document.getElementById("shIn"); if (!i) return;
    const v = i.value; i.value = ""; i.style.height = ""; send(v);
  });
  panel.addEventListener("keydown", (e) => {
    if (e.target.id === "shIn" && e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); panel.querySelector(".sh-form").requestSubmit(); }
  });
  panel.addEventListener("input", (e) => { if (e.target.id === "shIn") { e.target.style.height = "auto"; e.target.style.height = Math.min(140, e.target.scrollHeight) + "px"; } });
  window.addEventListener("tilawa:ask", (e) => {
    const d = e.detail || {};
    open();
    const q = t("shAskVerse").replace("{ref}", `${d.surah}:${d.ayah}`).replace("{surah}", d.name || "");
    const extra = d.ar ? `The verse ${d.surah}:${d.ayah} in Arabic: ${d.ar}${d.tr ? ` | Translation shown in the app: ${d.tr}` : ""}` : "";
    send(q, extra);
  });
  window.addEventListener("tilawa:authchange", () => { if (isOpen() && gateKey() !== lastGate) render(); });
  window.addEventListener("tilawa:langchange", () => { label(); model = null; if (isOpen()) render(); });
  label();
}

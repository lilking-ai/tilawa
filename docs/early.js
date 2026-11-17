/* Tilawa - Early Access. Scanning Yaqub's special QR code opens the app with ?early=<code>,
   which unlocks the Kiswah theme (black and gold), an Early Access badge, and first place in line
   for the AI Sheikh. The code is checked against a hash, so it isn't written in the app.
   Classic script: talks to app.js through window.Tilawa. */
(function(){
"use strict";
var T=window.Tilawa; if(!T) return;
function t(k){return T.t(k)}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
var LS={get:function(k){try{return localStorage.getItem("tilawa."+k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem("tilawa."+k,v)}catch(e){}},del:function(k){try{localStorage.removeItem("tilawa."+k)}catch(e){}}};
// 32-bit FNV-1a, enough to keep the code out of plain sight
function h(s){var x=0x811c9dc5;s=String(s).trim().toUpperCase();for(var i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,0x01000193)>>>0}return x.toString(16)}
var CODES=["4a1d934b"];

var root=document.documentElement;
function isEarly(){return LS.get("early")==="1"}
function skinOn(){return isEarly()&&LS.get("skin")!=="off"}
function applySkin(){
  if(skinOn())root.setAttribute("data-skin","kiswah");else root.removeAttribute("data-skin");
  var m=document.querySelector('meta[name="theme-color"]');if(m&&skinOn())m.content="#0B0B0C";
  root.classList.toggle("early",isEarly());
}

/* the code from the QR link */
var unlockedNow=false;
(function(){
  var q=new URLSearchParams(location.search),c=q.get("early");
  if(!c)return;
  if(CODES.indexOf(h(c))>=0){LS.set("early","1");LS.set("earlyAt",new Date().toISOString());unlockedNow=true}
  q.delete("early");var rest=q.toString();
  history.replaceState(null,"",location.pathname+(rest?"?"+rest:"")+location.hash);
})();
applySkin();

/* a line under "by Yaqub" in the opening animation */
if(isEarly()){var by=document.querySelector("#splash .sp-by");if(by){var e=document.createElement("div");e.className="sp-early";e.textContent="✦ Early Access";by.parentNode.insertBefore(e,by.nextSibling)}}

/* welcome screen when the code is first scanned */
function svg(p,w){return '<svg width="'+(w||22)+'" height="'+(w||22)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
var ARCH='<svg class="ea-arch" viewBox="0 0 200 240" aria-hidden="true"><path stroke-width="1.6" d="M40 236V104c0-42 30-70 60-90c30 20 60 48 60 90v132"/><path stroke-width=".9" d="M54 236V108c0-33 22-56 46-72c24 16 46 39 46 72v128"/></svg>';
function showWelcome(){
  var o=document.createElement("div");o.className="ea";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");o.dir=T.dir();
  var perks=[["eaP1",'<path d="M4 7l8-4 8 4v10l-8 4-8-4z"/><path d="M4 7l8 4 8-4M12 11v10"/>'],["eaP2",'<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>'],["eaP3",'<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1.1-4.6A8 8 0 1121 12z"/>']]
    .map(function(p){return '<li><span class="ea-ic">'+svg(p[1])+'</span><span>'+esc(t(p[0]))+'</span></li>'}).join("");
  o.innerHTML='<div class="ea-in">'+ARCH+'<p class="ea-k">✦ '+esc(t("eaBadge"))+'</p><h2>'+esc(t("eaTitle"))+'</h2><p class="ea-sub">'+esc(t("eaSub"))+'</p><ul>'+perks+'</ul><button class="ea-go">'+esc(t("eaStart"))+'</button></div>';
  document.body.appendChild(o);document.body.classList.add("ob-open");
  o.querySelector(".ea-go").addEventListener("click",function(){o.classList.add("out");setTimeout(function(){o.remove();if(!document.querySelector(".ob:not([hidden]),.lp:not([hidden])"))document.body.classList.remove("ob-open")},350)});
}
// show it after the opening animation and on top of the sign-in screen
if(unlockedNow)setTimeout(function(){setTimeout(showWelcome,document.getElementById("splash")?6600:200)},0);

window.TilawaEarly={isEarly:isEarly,skinOn:skinOn,setSkin:function(on){LS.set("skin",on?"on":"off");applySkin()},_hash:h};
window.addEventListener("tilawa:langchange",applySkin);
})();

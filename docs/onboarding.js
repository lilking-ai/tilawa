/* Tilawa - welcome (sign-up) page you scroll down through, and the language chooser.
   Classic script: talks to app.js through window.Tilawa and to sync.js through window events. */
(function(){
"use strict";
var T=window.Tilawa; if(!T) return;
var LANGS=window.TILAWA_LANGS||[];
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
var LS={get:function(k){try{return localStorage.getItem("tilawa."+k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem("tilawa."+k,v)}catch(e){}}};
function emit(n,d){window.dispatchEvent(new CustomEvent(n,{detail:d}))}
function t(k){return T.t(k)}
var I={
 star:'<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l2.6 4.2L19 4.9l-1.3 4.5L22 12l-4.3 2.6 1.3 4.5-4.4-1.3L12 22l-2.6-4.2L5 19.1l1.3-4.5L2 12l4.3-2.6L5 4.9l4.4 1.3z"/><circle cx="12" cy="12" r="3.2"/></svg>',
 mic:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0014 0M12 17v5"/></svg>',
 globe:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20"/></svg>',
 chat:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1.1-4.6A8 8 0 1121 12z"/><path d="M14.5 9.2a2.6 2.6 0 10.9 3.9 3.2 3.2 0 11-.9-3.9z" fill="currentColor" stroke="none"/></svg>',
 bookmark:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h12a1 1 0 011 1v19l-7-4.5L5 22V3a1 1 0 011-1z"/></svg>',
 down:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
 mail:'<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
 check:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 12l5 5 9-10"/></svg>',
 search:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
 google:'<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>'
};
var st={form:"email",email:LS.get("emailForSignIn")||"",sentTo:"",error:"",busy:false};
var prevUser=null,prevConfigured=false,lpFirst=false;

var ob=document.createElement("div");ob.id="ob";ob.className="ob";ob.hidden=true;ob.setAttribute("role","dialog");ob.setAttribute("aria-modal","true");
var lp=document.createElement("div");lp.id="lp";lp.className="lp";lp.hidden=true;lp.setAttribute("role","dialog");lp.setAttribute("aria-modal","true");
document.body.appendChild(ob);document.body.appendChild(lp);

/* ---------- welcome page ---------- */
function signHTML(){
  var A=T.authState();
  if(A.user) return '<div class="ob-sign-card ob-sent"><div class="ob-ic">'+I.check+'</div><h2>'+esc(t("obSignedIn"))+'</h2><p></p><button class="ob-btn primary" data-act="continue">'+esc(t("obStart"))+'</button></div>';
  if(!A.configured) return '<div class="ob-sign-card"><h2>'+esc(t("obTag"))+'</h2><p class="sub"></p><button class="ob-btn primary" data-act="guest">'+esc(t("obStart"))+'</button></div>';
  var err=st.error?'<div class="ob-err" role="alert">'+esc(st.error)+'</div>':'';
  if(st.form==="confirm") return '<div class="ob-sign-card"><h2>'+esc(t("obConfirmEmail"))+'</h2><p class="sub"></p>'+err+
    '<label class="ob-field"><input id="obConfirm" type="email" inputmode="email" autocomplete="email" placeholder="'+esc(t("obEmail"))+'" value="'+esc(st.email)+'"></label>'+
    '<button class="ob-btn primary" data-act="confirm">'+esc(t("obPasteBtn"))+'</button></div>';
  if(st.form==="sent") return '<div class="ob-sign-card ob-sent"><div class="ob-ic">'+I.mail+'</div><p>'+esc(t("obSent")).replace("{email}","<b>"+esc(st.sentTo)+"</b>")+'</p>'+err+
    '<button class="ob-btn ghost" data-act="resend">'+esc(t("obResend"))+'</button>'+
    '<div class="ob-paste"><b>'+esc(t("obPasteTitle"))+'</b><label class="ob-field"><input id="obPaste" type="url" inputmode="url" autocomplete="off" placeholder="'+esc(t("obPaste"))+'"></label>'+
    '<button class="ob-btn primary" data-act="paste">'+esc(t("obPasteBtn"))+'</button></div></div>';
  return '<div class="ob-sign-card"><h2>'+esc(t("obSignTitle"))+'</h2><p class="sub">'+esc(t("obSignSub"))+'</p>'+err+
    '<label class="ob-field"><input id="obName" type="text" autocomplete="name" placeholder="'+esc(t("obName"))+'" value="'+esc(LS.get("pendingName")||"")+'"></label>'+
    '<label class="ob-field"><input id="obEmail" type="email" inputmode="email" autocomplete="email" placeholder="'+esc(t("obEmail"))+'" value="'+esc(st.email)+'"></label>'+
    '<button class="ob-btn primary" data-act="send"'+(st.busy?' disabled':'')+'>'+I.mail.replace('width="30" height="30"','width="20" height="20"')+esc(st.busy?t("obSending"):t("obSend"))+'</button>'+
    '<div class="ob-or">'+esc(t("obOr"))+'</div>'+
    '<button class="ob-btn ghost" data-act="google">'+I.google+esc(t("obGoogle"))+'</button>'+
    '<button class="ob-link" data-act="guest">'+esc(t("obGuest"))+'</button></div>';
}
function renderOb(){
  ob.dir=T.dir();
  var feats=[["mic","obF1"],["globe","obF2"],["chat","obF3"],["bookmark","obF4"]].map(function(f,n){
    return '<article class="ob-card" style="--d:'+(n*90)+'ms"><div class="ob-ic">'+I[f[0]]+'</div><h3>'+esc(t(f[1]+"Title"))+'</h3><p>'+esc(t(f[1]))+'</p></article>'}).join("");
  ob.innerHTML='<div class="ob-progress"><span id="obBar"></span></div>'+
   '<div class="ob-scroll" id="obScroll" tabindex="-1">'+
    '<section class="ob-hero"><div class="ob-logo">'+I.star+'</div><h1>Tilawa <span>تلاوة</span></h1><p class="ob-tag">'+esc(t("obTag"))+'</p>'+
     '<div class="ob-bism">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div><button class="ob-cue" data-act="down">'+esc(t("obScroll"))+I.down+'</button></section>'+
    '<section class="ob-feats" id="obFeat">'+feats+'</section>'+
    '<section class="ob-sign" id="obSign">'+signHTML()+'</section>'+
    '<footer class="ob-foot">Tilawa · تلاوة</footer></div>'+
   '<button class="ob-down" id="obDown" aria-label="'+esc(t("obScroll"))+'">'+I.down+'</button>';
  var sc=document.getElementById("obScroll"),bar=document.getElementById("obBar"),down=document.getElementById("obDown");
  function onScroll(){var max=sc.scrollHeight-sc.clientHeight;var p=max>0?sc.scrollTop/max:1;bar.style.width=(p*100)+"%";down.classList.toggle("hide",p>0.92)}
  sc.addEventListener("scroll",onScroll,{passive:true});onScroll();
  if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{root:sc,threshold:.2});
    ob.querySelectorAll(".ob-card").forEach(function(c){io.observe(c)})} else ob.querySelectorAll(".ob-card").forEach(function(c){c.classList.add("in")});
  down.onclick=function(){sc.scrollBy({top:sc.clientHeight*.8,behavior:"smooth"})};
}
function renderSign(){var s=document.getElementById("obSign");if(s)s.innerHTML=signHTML()}
function toSign(){var s=document.getElementById("obSign");if(s)setTimeout(function(){s.scrollIntoView({behavior:"smooth",block:"start"})},60)}
function openOb(sign){if(ob.hidden){ob.hidden=false;document.body.classList.add("ob-open");renderOb()}else renderSign();if(sign)toSign()}
function closeOb(){ob.hidden=true;document.body.classList.remove("ob-open")}
function finish(){LS.set("onboarded","1");closeOb();if(!LS.get("langChosen"))openLp(true)}
function validEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)}
ob.addEventListener("click",function(e){
  var b=e.target.closest("[data-act]");if(!b)return;var a=b.dataset.act;
  if(a==="down"){document.getElementById("obFeat").scrollIntoView({behavior:"smooth"});return}
  if(a==="guest"||a==="continue"){finish();return}
  if(a==="google"){emit("tilawa:signin");return}
  if(a==="resend"){st.form="email";st.error="";renderSign();return}
  if(a==="send"){
    var email=(document.getElementById("obEmail").value||"").trim(),name=(document.getElementById("obName").value||"").trim();
    st.email=email;if(name)LS.set("pendingName",name);
    if(!validEmail(email)){st.error=t("obBadEmail");renderSign();return}
    st.error="";st.busy=true;renderSign();emit("tilawa:emaillink",{email:email,name:name});return}
  if(a==="paste"){var link=(document.getElementById("obPaste").value||"").trim();if(!link)return;st.error="";emit("tilawa:pastelink",{email:st.sentTo||st.email,link:link});return}
  if(a==="confirm"){var em=(document.getElementById("obConfirm").value||"").trim();if(!validEmail(em)){st.error=t("obBadEmail");renderSign();return}st.email=em;st.error="";emit("tilawa:confirmemail",{email:em});return}
});
ob.addEventListener("keydown",function(e){if(e.key==="Enter"&&e.target.tagName==="INPUT"){var b=e.target.closest(".ob-sign-card").querySelector(".ob-btn.primary");if(b){e.preventDefault();b.click()}}});

/* ---------- language chooser ---------- */
function renderLpList(q){
  q=(q||"").trim().toLowerCase();var cur=T.getLang();
  var list=LANGS.filter(function(l){return !q||l.native.toLowerCase().indexOf(q)>=0||l.en.toLowerCase().indexOf(q)>=0||l.code===q});
  document.getElementById("lpList").innerHTML=list.map(function(l){var on=l.code===cur&&!lpFirst;
    return '<button class="lp-item'+(on?' on':'')+'" data-code="'+esc(l.code)+'"><span class="lp-n" dir="'+esc(l.dir)+'">'+esc(l.native)+'</span><span class="lp-e">'+esc(l.en)+'</span>'+(on?I.check:'')+'</button>'}).join("")||'<div class="state">'+esc(t("noRes"))+'</div>';
}
function openLp(first){
  lpFirst=!!first;lp.dir=T.dir();
  lp.innerHTML='<div class="lp-box"><div class="lp-head"><div class="lp-ic">'+I.globe+'</div><h2>'+esc(t("lpTitle"))+'</h2><p>'+esc(t("lpSub"))+'</p>'+
    '<div class="lp-search">'+I.search+'<input id="lpQ" type="search" autocomplete="off" placeholder="'+esc(t("lpSearch"))+'"></div></div>'+
    '<div class="lp-list" id="lpList"></div>'+(first?'':'<button class="lp-close" data-act="close" aria-label="Close">×</button>')+'</div>';
  lp.hidden=false;document.body.classList.add("ob-open");renderLpList("");
  document.getElementById("lpQ").addEventListener("input",function(e){renderLpList(e.target.value)});
}
function closeLp(){lp.hidden=true;if(ob.hidden)document.body.classList.remove("ob-open")}
lp.addEventListener("click",function(e){
  if(e.target===lp&&!lpFirst){closeLp();return}
  var c=e.target.closest("[data-act=close]");if(c){closeLp();return}
  var b=e.target.closest("[data-code]");if(!b)return;
  var code=b.dataset.code;LS.set("langChosen","1");closeLp();
  Promise.resolve(T.setLang(code)).then(function(){emit("tilawa:langchosen",{code:code})});
});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!lp.hidden&&!lpFirst)closeLp()});

/* ---------- events from the app and from sync.js ---------- */
window.addEventListener("tilawa:langpicker",function(){openLp(false)});
window.addEventListener("tilawa:showsignin",function(){st.form=st.form==="sent"?"sent":"email";openOb(true)});
window.addEventListener("tilawa:needemail",function(){st.form="confirm";st.error="";openOb(true)});
window.addEventListener("tilawa:linkerror",function(){st.error=t("obLinkErr");if(st.form!=="confirm")st.form=st.sentTo?"sent":"email";openOb(true)});
window.addEventListener("tilawa:emaillink-result",function(e){
  var d=e.detail||{};st.busy=false;
  if(d.ok){st.form="sent";st.sentTo=d.email;st.error=""}
  else st.error=/invalid-email/.test(d.code||"")?t("obBadEmail"):t("signInErr")+(d.code?" ("+d.code+")":"");
  if(!ob.hidden)renderSign();
});
window.addEventListener("tilawa:authchange",function(e){
  var A=e.detail||T.authState(),uid=A.user?A.user.uid:null;
  if(A.configured!==prevConfigured){prevConfigured=A.configured;if(!ob.hidden)renderSign()}
  if(uid&&uid!==prevUser){prevUser=uid;
    if(!ob.hidden){renderSign();setTimeout(finish,900)}
    else{LS.set("onboarded","1");if(!LS.get("langChosen")&&lp.hidden)openLp(true)}
  }else if(!uid&&prevUser){prevUser=null}
});
window.addEventListener("tilawa:langchange",function(){if(!ob.hidden)renderOb()});

/* ---------- first visit ---------- */
if(!LS.get("onboarded"))openOb(false);
else if(!LS.get("langChosen"))openLp(true);
})();

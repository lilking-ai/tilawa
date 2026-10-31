/* Tilawa - welcome page you scroll through, the profile panel (with sign-in), and the language chooser.
   Classic script: talks to app.js through window.Tilawa and to sync.js through window events. */
(function(){
"use strict";
var T=window.Tilawa; if(!T) return;
var LANGS=window.TILAWA_LANGS||[];
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
var LS={get:function(k){try{return localStorage.getItem("tilawa."+k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem("tilawa."+k,v)}catch(e){}}};
function emit(n,d){window.dispatchEvent(new CustomEvent(n,{detail:d}))}
function t(k){return T.t(k)}
function svg(p,w){return '<svg width="'+(w||20)+'" height="'+(w||20)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'}
var I={
 star:svg('<path d="M12 2l2.6 4.2L19 4.9l-1.3 4.5L22 12l-4.3 2.6 1.3 4.5-4.4-1.3L12 22l-2.6-4.2L5 19.1l1.3-4.5L2 12l4.3-2.6L5 4.9l4.4 1.3z"/><circle cx="12" cy="12" r="3.2"/>',38),
 mic:svg('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0014 0M12 17v5"/>'),
 globe:svg('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20"/>'),
 chat:svg('<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1.1-4.6A8 8 0 1121 12z"/>'),
 bookmark:svg('<path d="M6 2h12a1 1 0 011 1v19l-7-4.5L5 22V3a1 1 0 011-1z"/>'),
 heart:svg('<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 000-7.8z"/>'),
 moon:svg('<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>'),
 user:svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',26),
 down:svg('<path d="M6 9l6 6 6-6"/>'),
 chev:svg('<path d="M9 6l6 6-6 6"/>',18),
 x:svg('<path d="M18 6L6 18M6 6l12 12"/>'),
 mail:svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',28),
 check:svg('<path d="M5 12l5 5 9-10"/>',26),
 search:svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',16),
 google:'<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>'
};
var st={form:"email",email:LS.get("emailForSignIn")||"",sentTo:"",error:"",busy:false};
var prevUser=null,prevConfigured=false,lpFirst=false;

var ob=document.createElement("div");ob.id="ob";ob.className="ob";ob.hidden=true;ob.setAttribute("role","dialog");ob.setAttribute("aria-modal","true");
var lp=document.createElement("div");lp.id="lp";lp.className="lp";lp.hidden=true;lp.setAttribute("role","dialog");lp.setAttribute("aria-modal","true");
var pfScrim=document.createElement("div");pfScrim.className="sh-scrim pf-scrim";
var pf=document.createElement("aside");pf.id="profile";pf.className="pf";pf.setAttribute("aria-label","Profile");
document.body.appendChild(ob);document.body.appendChild(lp);document.body.appendChild(pfScrim);document.body.appendChild(pf);

// the profile button sits at the end of the top bar, like most apps
var acct=document.getElementById("acctBtn"),setBtn=document.getElementById("settingsBtn");
if(acct&&setBtn&&setBtn.parentNode)setBtn.parentNode.insertBefore(acct,setBtn.nextSibling);

/* ---------- sign-in form (welcome page and profile) ---------- */
function signHTML(P){
  var A=T.authState();
  var err=st.error?'<div class="ob-err" role="alert">'+esc(st.error)+'</div>':'';
  function wrap(h){return P?'<div class="pf-sign">'+h+'</div>':'<div class="ob-sign-card">'+h+'</div>'}
  if(A.user&&!P) return '<div class="ob-sign-card"><div class="ob-sent"><div class="ob-ic">'+I.check+'</div><h2>'+esc(t("obSignedIn"))+'</h2></div><button class="ob-btn primary" data-act="continue">'+esc(t("obStart"))+'</button></div>';
  if(st.form==="confirm") return wrap('<h2>'+esc(t("obConfirmEmail"))+'</h2>'+err+
    '<label class="ob-field"><input data-f="confirm" type="email" inputmode="email" autocomplete="email" placeholder="'+esc(t("obEmail"))+'" value="'+esc(st.email)+'"></label>'+
    '<button class="ob-btn primary" data-act="confirm">'+esc(t("obPasteBtn"))+'</button>');
  if(st.form==="sent") return wrap('<div class="ob-sent"><div class="ob-ic">'+I.mail+'</div><p>'+esc(t("obSent")).replace("{email}","<b>"+esc(st.sentTo)+"</b>")+'</p></div>'+err+
    '<button class="ob-btn ghost" data-act="resend">'+esc(t("obResend"))+'</button>'+
    '<div class="ob-paste"><b>'+esc(t("obPasteTitle"))+'</b><label class="ob-field"><input data-f="paste" type="url" inputmode="url" autocomplete="off" placeholder="'+esc(t("obPaste"))+'"></label>'+
    '<button class="ob-btn primary" data-act="paste">'+esc(t("obPasteBtn"))+'</button></div>');
  return wrap((P?'':'<h2>'+esc(t("obSignTitle"))+'</h2><p class="sub">'+esc(t("obSignSub"))+'</p>')+err+
    '<label class="ob-field"><input data-f="name" type="text" autocomplete="name" placeholder="'+esc(t("obName"))+'" value="'+esc(LS.get("pendingName")||"")+'"></label>'+
    '<label class="ob-field"><input data-f="email" type="email" inputmode="email" autocomplete="email" placeholder="'+esc(t("obEmail"))+'" value="'+esc(st.email)+'"></label>'+
    '<button class="ob-btn primary" data-act="send"'+(st.busy?' disabled':'')+'>'+esc(st.busy?t("obSending"):t("obSend"))+'</button>'+
    '<div class="ob-or">'+esc(t("obOr"))+'</div>'+
    '<button class="ob-btn ghost" data-act="google">'+I.google+esc(t("obGoogle"))+'</button>'+
    (P?'':'<button class="ob-link" data-act="guest">'+esc(t("obGuest"))+'</button>'));
}

/* ---------- welcome page ---------- */
function renderOb(){
  ob.dir=T.dir();
  var feats=[["mic","obF1"],["globe","obF2"],["chat","obF3"],["bookmark","obF4"]].map(function(f){
    return '<div class="ob-card"><div class="ob-ic">'+I[f[0]]+'</div><h3>'+esc(t(f[1]+"Title"))+'</h3><p>'+esc(t(f[1]))+'</p></div>'}).join("");
  ob.innerHTML='<div class="ob-progress"><span id="obBar"></span></div>'+
   '<div class="ob-scroll" id="obScroll" tabindex="-1">'+
    '<section class="ob-hero"><div class="ob-logo">'+I.star+'</div><h1>Tilawa <span>تلاوة</span></h1><p class="ob-tag">'+esc(t("obTag"))+'</p>'+
     '<div class="ob-bism">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div><button class="ob-cue" data-act="down">'+esc(t("obScroll"))+I.down+'</button></section>'+
    '<section class="ob-feats" id="obFeat">'+feats+'</section>'+
    '<section class="ob-sign" id="obSign">'+signHTML(false)+'</section>'+
    '<footer class="ob-foot">Tilawa</footer></div>'+
   '<button class="ob-down" id="obDown" aria-label="'+esc(t("obScroll"))+'">'+I.down+'</button>';
  var sc=document.getElementById("obScroll"),bar=document.getElementById("obBar"),down=document.getElementById("obDown");
  function onScroll(){var max=sc.scrollHeight-sc.clientHeight;var p=max>0?sc.scrollTop/max:1;bar.style.width=(p*100)+"%";down.classList.toggle("hide",p>0.92)}
  sc.addEventListener("scroll",onScroll,{passive:true});onScroll();
  down.onclick=function(){sc.scrollBy({top:sc.clientHeight*.8,behavior:"smooth"})};
}
function refresh(){var s=document.getElementById("obSign");if(s&&!ob.hidden)s.innerHTML=signHTML(false);if(pfOpen())renderPf()}
function toSign(){var s=document.getElementById("obSign");if(s)setTimeout(function(){s.scrollIntoView({behavior:"smooth",block:"start"})},60)}
function openOb(sign){if(ob.hidden){ob.hidden=false;document.body.classList.add("ob-open");renderOb()}else refresh();if(sign)toSign()}
function closeOb(){ob.hidden=true;document.body.classList.remove("ob-open");if(location.hash==="#welcome")history.replaceState(null,"",location.pathname+location.search)}
function finish(){LS.set("onboarded","1");closeOb();if(!LS.get("langChosen"))openLp(true)}
function validEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)}

/* ---------- profile ---------- */
function pfOpen(){return pf.classList.contains("open")}
function row(act,icon,label,right){return '<button class="pf-row" data-act="'+act+'"><span class="ic">'+icon+'</span><span class="lbl">'+esc(label)+'</span>'+(right||"")+'</button>'}
function renderPf(){
  var A=T.authState(),u=A.user,P=T.profileInfo(),chev='<span class="chev">'+I.chev+'</span>',top;
  pf.dir=T.dir();
  if(u){
    var initial=esc(String(u.displayName||u.email||"?").charAt(0).toUpperCase());
    top='<div class="pf-card pf-user"><div class="pf-av">'+(u.photoURL?'<img src="'+esc(u.photoURL)+'" alt="" referrerpolicy="no-referrer">':initial)+'</div>'+
      '<div class="pf-who"><b>'+esc(u.displayName||u.email||"")+'</b>'+(u.displayName&&u.email?'<span>'+esc(u.email)+'</span>':'')+
      '<span class="pf-sync '+esc(A.sync||"ok")+'">'+esc(A.sync==="busy"?t("syncing"):A.sync==="err"?t("syncErr"):t("synced"))+'</span></div></div>';
  }else{
    top='<div class="pf-card"><div class="pf-guest"><div class="pf-av">'+I.user+'</div><div><b>'+esc(t("prGuest"))+'</b><span>'+esc(t("prSignedOut"))+'</span></div></div>'+signHTML(true)+'</div>';
  }
  pf.innerHTML='<div class="pf-head"><b>'+esc(t("profile"))+'</b><button class="iconbtn" data-act="pfclose" aria-label="Close">'+I.x+'</button></div>'+
    '<div class="pf-body">'+top+
    '<div class="pf-label">'+esc(t("prSettings"))+'</div><div class="pf-list">'+
      row("lang",I.globe,t("langLabel"),'<span class="val">'+esc(P.langNative)+'</span>'+chev)+
      row("theme",I.moon,t("prDark"),'<span class="switch'+(P.theme==="dark"?" on":"")+'" role="switch" aria-checked="'+(P.theme==="dark")+'"></span>')+
      row("bookmarks",I.bookmark,t("bookmarks"),'<span class="val">'+P.bookmarks+'</span>'+chev)+
      row("favs",I.heart,t("favorites"),'<span class="val">'+P.favs+'</span>'+chev)+
      row("sheikh",I.chat,t("shTitle"),chev)+
    '</div>'+
    (u?'<div class="pf-list"><button class="pf-row danger" data-act="signout">'+esc(t("signOut"))+'</button></div>':'')+
    '<p class="pf-about"><b>'+esc(t("prAbout"))+'</b><br>'+esc(t("prAboutText"))+'</p></div>';
}
function openPf(){if(st.form!=="sent"&&st.form!=="confirm")st.form="email";renderPf();pf.classList.add("open");pfScrim.classList.add("open")}
function closePf(){pf.classList.remove("open");pfScrim.classList.remove("open")}
pfScrim.addEventListener("click",closePf);

/* ---------- shared click handling ---------- */
function fv(root,f){var el=root.querySelector('[data-f="'+f+'"]');return el?(el.value||"").trim():""}
function onAct(e){
  var root=e.currentTarget,b=e.target.closest("[data-act]");if(!b||!root.contains(b))return;var a=b.dataset.act;
  if(a==="down"){document.getElementById("obFeat").scrollIntoView({behavior:"smooth"});return}
  if(a==="guest"||a==="continue"){finish();return}
  if(a==="google"){if(!T.authState().configured){st.error=t("obSoon");refresh();return}emit("tilawa:signin");return}
  if(a==="resend"){st.form="email";st.error="";refresh();return}
  if(a==="send"){
    var email=fv(root,"email"),name=fv(root,"name");st.email=email;if(name)LS.set("pendingName",name);
    if(!validEmail(email)){st.error=t("obBadEmail");refresh();return}
    if(!T.authState().configured){st.error=t("obSoon");refresh();return}
    st.error="";st.busy=true;refresh();emit("tilawa:emaillink",{email:email,name:name});return}
  if(a==="paste"){var link=fv(root,"paste");if(!link)return;st.error="";emit("tilawa:pastelink",{email:st.sentTo||st.email,link:link});return}
  if(a==="confirm"){var em=fv(root,"confirm");if(!validEmail(em)){st.error=t("obBadEmail");refresh();return}st.email=em;st.error="";emit("tilawa:confirmemail",{email:em});return}
  if(a==="pfclose"){closePf();return}
  if(a==="lang"){openLp(false);return}
  if(a==="theme"){T.toggleTheme();renderPf();return}
  if(a==="bookmarks"){closePf();T.showBookmarks();return}
  if(a==="favs"){closePf();T.showFavs();return}
  if(a==="sheikh"){closePf();var sb=document.getElementById("sheikhBtn");if(sb)sb.click();return}
  if(a==="signout"){emit("tilawa:signout");return}
}
function onKey(e){if(e.key==="Enter"&&e.target.tagName==="INPUT"){var c=e.target.closest(".ob-sign-card,.pf-sign");var b=c&&c.querySelector(".ob-btn.primary");if(b){e.preventDefault();b.click()}}}
ob.addEventListener("click",onAct);pf.addEventListener("click",onAct);
ob.addEventListener("keydown",onKey);pf.addEventListener("keydown",onKey);

/* ---------- language chooser ---------- */
function renderLpList(q){
  q=(q||"").trim().toLowerCase();var cur=T.getLang();
  var list=LANGS.filter(function(l){return !q||l.native.toLowerCase().indexOf(q)>=0||l.en.toLowerCase().indexOf(q)>=0||l.code===q});
  document.getElementById("lpList").innerHTML=list.map(function(l){var on=l.code===cur&&!lpFirst;
    return '<button class="lp-item'+(on?' on':'')+'" data-code="'+esc(l.code)+'"><span class="lp-n" dir="'+esc(l.dir)+'">'+esc(l.native)+'</span><span class="lp-e">'+esc(l.en)+'</span>'+(on?I.check.replace(/width="26" height="26"/,'width="18" height="18"'):'')+'</button>'}).join("")||'<div class="state">'+esc(t("noRes"))+'</div>';
}
function openLp(first){
  lpFirst=!!first;lp.dir=T.dir();
  lp.innerHTML='<div class="lp-box"><div class="lp-head"><h2>'+esc(t("lpTitle"))+'</h2><p>'+esc(t("lpSub"))+'</p>'+
    '<div class="lp-search">'+I.search+'<input id="lpQ" type="search" autocomplete="off" placeholder="'+esc(t("lpSearch"))+'"></div></div>'+
    '<div class="lp-list" id="lpList"></div>'+(first?'':'<button class="lp-close" data-act="close" aria-label="Close">'+I.x+'</button>')+'</div>';
  lp.hidden=false;document.body.classList.add("ob-open");renderLpList("");
  document.getElementById("lpQ").addEventListener("input",function(e){renderLpList(e.target.value)});
}
function closeLp(){lp.hidden=true;if(ob.hidden)document.body.classList.remove("ob-open")}
lp.addEventListener("click",function(e){
  if(e.target===lp&&!lpFirst){closeLp();return}
  if(e.target.closest("[data-act=close]")){closeLp();return}
  var b=e.target.closest("[data-code]");if(!b)return;
  var code=b.dataset.code;LS.set("langChosen","1");closeLp();
  Promise.resolve(T.setLang(code)).then(function(){emit("tilawa:langchosen",{code:code})});
});
document.addEventListener("keydown",function(e){
  if(e.key!=="Escape")return;
  if(!lp.hidden&&!lpFirst)closeLp();else if(pfOpen())closePf();
});

/* ---------- events from the app and from sync.js ---------- */
window.addEventListener("tilawa:profile",function(){pfOpen()?closePf():openPf()});
window.addEventListener("tilawa:showsignin",function(){openPf()});
window.addEventListener("tilawa:langpicker",function(){openLp(false)});
window.addEventListener("tilawa:needemail",function(){st.form="confirm";st.error="";openOb(true)});
window.addEventListener("tilawa:linkerror",function(){st.error=t("obLinkErr");if(st.form!=="confirm")st.form=st.sentTo?"sent":"email";if(pfOpen())refresh();else openOb(true)});
window.addEventListener("tilawa:emaillink-result",function(e){
  var d=e.detail||{};st.busy=false;
  if(d.ok){st.form="sent";st.sentTo=d.email;st.error=""}
  else st.error=/invalid-email/.test(d.code||"")?t("obBadEmail"):t("signInErr")+(d.code?" ("+d.code+")":"");
  refresh();
});
window.addEventListener("tilawa:authchange",function(e){
  var A=e.detail||T.authState(),uid=A.user?A.user.uid:null;
  if(A.configured!==prevConfigured){prevConfigured=A.configured;refresh()}
  if(uid&&uid!==prevUser){prevUser=uid;st.form="email";st.error="";
    if(!ob.hidden){refresh();setTimeout(finish,900)}
    else{LS.set("onboarded","1");if(pfOpen())renderPf();if(!LS.get("langChosen")&&lp.hidden)openLp(true)}
  }else if(!uid&&prevUser){prevUser=null;if(pfOpen())renderPf()}
  else if(uid&&pfOpen())renderPf();
});
window.addEventListener("tilawa:langchange",function(){if(!ob.hidden)renderOb();if(pfOpen())renderPf()});
window.addEventListener("hashchange",function(){if(location.hash==="#welcome")openOb(true)});

/* ---------- first visit ---------- */
if(location.hash==="#welcome")openOb(true);
else if(!LS.get("onboarded"))openOb(false);
else if(!LS.get("langChosen"))openLp(true);
})();

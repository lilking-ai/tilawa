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
I.arch='<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true"><path stroke-width="1.5" d="M5 22.5V11.2c0-3.7 3.1-6.5 7-8.8 3.9 2.3 7 5.1 7 8.8v11.3"/><path stroke-width="1" d="M8.6 22.5V11.8c0-2.2 1.5-3.9 3.4-5.2 1.9 1.3 3.4 3 3.4 5.2v10.7"/></svg>';
/* mode: "signup" | "login" | "forgot" | "resetsent" */
var st={mode:LS.get("hadAccount")?"login":"signup",email:"",sentTo:"",error:"",busy:false,showPw:false,acted:false};
var prevUser=null,prevConfigured=false,lpFirst=false,gateShown=false;
var SS={get:function(k){try{return sessionStorage.getItem("tilawa."+k)}catch(e){return null}},set:function(k,v){try{sessionStorage.setItem("tilawa."+k,v)}catch(e){}}};

var ob=document.createElement("div");ob.id="ob";ob.className="ob";ob.hidden=true;ob.setAttribute("role","dialog");ob.setAttribute("aria-modal","true");
var lp=document.createElement("div");lp.id="lp";lp.className="lp";lp.hidden=true;lp.setAttribute("role","dialog");lp.setAttribute("aria-modal","true");
var pfScrim=document.createElement("div");pfScrim.className="sh-scrim pf-scrim";
var pf=document.createElement("aside");pf.id="profile";pf.className="pf";pf.setAttribute("aria-label","Profile");
document.body.appendChild(ob);document.body.appendChild(lp);document.body.appendChild(pfScrim);document.body.appendChild(pf);

// the profile button sits at the end of the top bar, like most apps
var acct=document.getElementById("acctBtn"),setBtn=document.getElementById("settingsBtn");
if(acct&&setBtn&&setBtn.parentNode)setBtn.parentNode.insertBefore(acct,setBtn.nextSibling);

/* ---------- sign-in form: Log in / Sign up / Forgot password (welcome page and profile) ---------- */
function field(f,type,ph,val,ac,extra){return '<label class="ob-field'+(extra||"")+'"><input data-f="'+f+'" type="'+type+'"'+(type==="email"?' inputmode="email"':'')+' autocomplete="'+ac+'" placeholder="'+esc(ph)+'" aria-label="'+esc(ph)+'" value="'+esc(val||"")+'">'}
function pwField(ph,ac){return field("password",st.showPw?"text":"password",ph,"",ac," pw")+'<button type="button" class="pw-toggle" data-act="pwshow">'+esc(st.showPw?t("authHide"):t("authShow"))+'</button></label>'}
function signHTML(P){
  var A=T.authState(),m=st.mode;
  var err=st.error?'<div class="ob-err" role="alert">'+esc(st.error)+'</div>':'';
  function wrap(h){return P?'<div class="pf-sign">'+h+'</div>':'<div class="ob-sign-card">'+h+'</div>'}
  if(A.user&&!P) return '<div class="ob-sign-card"><div class="ob-sent"><div class="ob-ic">'+I.check+'</div><h2>'+esc(t("obSignedIn"))+'</h2></div><button class="ob-btn primary" data-act="continue">'+esc(t("obStart"))+'</button></div>';
  if(m==="resetsent") return wrap('<div class="ob-sent"><div class="ob-ic">'+I.mail+'</div><p>'+esc(t("authResetSent")).replace("{email}","<b>"+esc(st.sentTo)+"</b>")+'</p></div>'+
    '<button class="ob-btn primary" data-act="tologin">'+esc(t("authBack"))+'</button>');
  if(m==="forgot") return wrap('<h2>'+esc(t("authResetTitle"))+'</h2><p class="sub">'+esc(t("authResetSub"))+'</p>'+err+
    field("email","email",t("obEmail"),st.email,"email")+'</label>'+
    '<button class="ob-btn primary" data-act="reset"'+(st.busy?' disabled':'')+'>'+esc(st.busy?t("authWait"):t("authResetBtn"))+'</button>'+
    '<button class="ob-link" data-act="tologin">'+esc(t("authBack"))+'</button>');
  var up=m==="signup";
  var tabs='<div class="auth-tabs" role="tablist"><button type="button" role="tab" aria-selected="'+!up+'" class="'+(up?'':'on')+'" data-act="tologin">'+esc(t("authLogin"))+'</button>'+
    '<button type="button" role="tab" aria-selected="'+up+'" class="'+(up?'on':'')+'" data-act="tosignup">'+esc(t("authSignup"))+'</button></div>';
  var head=P?'':'<h2>'+esc(t(up?"authSignupTitle":"authLoginTitle"))+'</h2><p class="sub">'+esc(t(up?"authSignupSub":"authLoginSub"))+'</p>';
  var body=up
    ? field("name","text",t("obName"),LS.get("pendingName")||"","name")+'</label>'+field("email","email",t("obEmail"),st.email,"email")+'</label>'+pwField(t("authPassword"),"new-password")+'<p class="pw-hint">'+esc(t("authWeak"))+'</p>'+
      '<button class="ob-btn primary" data-act="signup"'+(st.busy?' disabled':'')+'>'+esc(st.busy?t("authWait"):t("authCreate"))+'</button>'
    : field("email","email",t("obEmail"),st.email,"email")+'</label>'+pwField(t("authPassword"),"current-password")+
      '<button type="button" class="auth-forgot" data-act="toforgot">'+esc(t("authForgot"))+'</button>'+
      '<button class="ob-btn primary" data-act="login"'+(st.busy?' disabled':'')+'>'+esc(st.busy?t("authWait"):t("authLogin"))+'</button>';
  return wrap(tabs+head+err+body+
    (P?'':'<button class="ob-link" data-act="guest">'+esc(t("obGuest"))+'</button>'));
}
function authErr(code){
  code=String(code||"").replace("auth/","");
  if(/invalid-credential|wrong-password|user-not-found|invalid-login/.test(code))return t("authWrong");
  if(code==="email-already-in-use")return t("authInUse");
  if(code==="weak-password")return t("authWeak");
  if(code==="invalid-email")return t("obBadEmail");
  if(code==="missing-password")return t("authNoPw");
  if(code==="too-many-requests")return t("authTooMany");
  if(code==="network-request-failed")return t("authOffline");
  if(code==="operation-not-allowed"||code==="configuration-not-found")return t("obSoon");
  return t("signInErr")+(code?" ("+code+")":"");
}

/* ---------- welcome page ---------- */
function renderOb(){
  ob.dir=T.dir();
  var feats=[["mic","obF1"],["globe","obF2"],["chat","obF3"],["bookmark","obF4"]].map(function(f){
    return '<div class="ob-card"><div class="ob-ic">'+I[f[0]]+'</div><h3>'+esc(t(f[1]+"Title"))+'</h3><p>'+esc(t(f[1]))+'</p></div>'}).join("");
  ob.innerHTML='<div class="ob-progress"><span id="obBar"></span></div>'+
   '<div class="ob-scroll" id="obScroll" tabindex="-1">'+
    '<section class="ob-hero ob-top"><div class="ob-logo">'+I.arch+'</div><h1>Tilawa <span>تلاوة</span></h1><p class="ob-tag">'+esc(t("obTag"))+'</p></section>'+
    '<section class="ob-sign" id="obSign">'+signHTML(false)+'</section>'+
    '<section class="ob-feats" id="obFeat">'+feats+'</section>'+
    '<footer class="ob-foot">Tilawa</footer></div>'+
   '<button class="ob-down" id="obDown" aria-label="'+esc(t("obScroll"))+'">'+I.down+'</button>';
  var sc=document.getElementById("obScroll"),bar=document.getElementById("obBar"),down=document.getElementById("obDown");
  function onScroll(){var max=sc.scrollHeight-sc.clientHeight;var p=max>0?sc.scrollTop/max:1;bar.style.width=(p*100)+"%";down.classList.toggle("hide",p>0.92)}
  sc.addEventListener("scroll",onScroll,{passive:true});onScroll();
  down.onclick=function(){sc.scrollBy({top:sc.clientHeight*.8,behavior:"smooth"})};
}
function refresh(){var s=document.getElementById("obSign");if(s&&!ob.hidden)s.innerHTML=signHTML(false);if(pfOpen())renderPf()}
function toSign(){var s=document.getElementById("obSign");if(s)setTimeout(function(){s.scrollIntoView({behavior:"smooth",block:"start"})},60)}
function openOb(sign){SS.set("gate","1");if(ob.hidden){ob.hidden=false;document.body.classList.add("ob-open");renderOb()}else refresh();if(sign)toSign()}
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
      '<div class="pf-who"><b>'+esc(u.displayName||u.email||"")+'</b>'+(window.TilawaEarly&&TilawaEarly.isEarly()?'<span class="ea-tag">✦ '+esc(t("eaBadge"))+'</span>':'')+(u.displayName&&u.email?'<span>'+esc(u.email)+'</span>':'')+
      '<span class="pf-sync '+esc(A.sync||"ok")+'">'+esc(A.sync==="busy"?t("syncing"):A.sync==="err"?t("syncErr"):t("synced"))+'</span></div></div>';
  }else{
    top='<div class="pf-card"><div class="pf-guest"><div class="pf-av">'+I.user+'</div><div><b>'+esc(t("prGuest"))+'</b>'+(window.TilawaEarly&&TilawaEarly.isEarly()?'<span class="ea-tag">✦ '+esc(t("eaBadge"))+'</span>':'')+'<span>'+esc(t("prSignedOut"))+'</span></div></div>'+signHTML(true)+'</div>';
  }
  pf.innerHTML='<div class="pf-head"><b>'+esc(t("profile"))+'</b><button class="iconbtn" data-act="pfclose" aria-label="Close">'+I.x+'</button></div>'+
    '<div class="pf-body">'+top+
    '<div class="pf-label">'+esc(t("prSettings"))+'</div><div class="pf-list">'+
      row("lang",I.globe,t("langLabel"),'<span class="val">'+esc(P.langNative)+'</span>'+chev)+
      row("theme",I.moon,t("prDark"),'<span class="switch'+(P.theme==="dark"?" on":"")+'" role="switch" aria-checked="'+(P.theme==="dark")+'"></span>')+
      row("bookmarks",I.bookmark,t("bookmarks"),'<span class="val">'+P.bookmarks+'</span>'+chev)+
      row("favs",I.heart,t("favorites"),'<span class="val">'+P.favs+'</span>'+chev)+
      row("sheikh",I.chat,t("shTitle"),chev)+
      (window.TilawaEarly&&TilawaEarly.isEarly()?row("skin",I.star.replace(/width="38" height="38"/,'width="20" height="20"'),t("eaSkin"),'<span class="switch'+(TilawaEarly.skinOn()?" on":"")+'" role="switch" aria-checked="'+TilawaEarly.skinOn()+'"></span>'):'')+
    '</div>'+
    (u?'<div class="pf-list"><button class="pf-row danger" data-act="signout">'+esc(t("signOut"))+'</button></div>':'')+
    '<p class="pf-about"><b>'+esc(t("prAbout"))+'</b><br>'+esc(t("prAboutText"))+'</p></div>';
}
function openPf(){if(st.mode==="resetsent")st.mode="login";st.error="";renderPf();pf.classList.add("open");pfScrim.classList.add("open")}
function closePf(){pf.classList.remove("open");pfScrim.classList.remove("open")}
pfScrim.addEventListener("click",closePf);

/* ---------- shared click handling ---------- */
function fv(root,f){var el=root.querySelector('[data-f="'+f+'"]');return el?(el.value||"").trim():""}
function onAct(e){
  var root=e.currentTarget,b=e.target.closest("[data-act]");if(!b||!root.contains(b))return;var a=b.dataset.act;
  if(a==="down"){document.getElementById("obFeat").scrollIntoView({behavior:"smooth"});return}
  if(a==="guest"||a==="continue"){finish();return}
  if(a==="google"){if(!T.authState().configured){st.error=t("obSoon");refresh();return}st.acted=true;emit("tilawa:signin");return}
  if(a==="tologin"||a==="tosignup"||a==="toforgot"){var keep=fv(root,"email");if(keep)st.email=keep;st.mode=a.slice(2);st.error="";st.busy=false;refresh();focusFirst(root);return}
  if(a==="pwshow"){var pv=fv(root,"password");st.showPw=!st.showPw;var em0=fv(root,"email"),nm0=fv(root,"name");if(em0)st.email=em0;if(nm0)LS.set("pendingName",nm0);refresh();var pe=root.querySelector('[data-f="password"]');if(pe){pe.value=pv;pe.focus()}return}
  if(a==="signup"||a==="login"||a==="reset"){
    var email=fv(root,"email"),pw=(root.querySelector('[data-f="password"]')||{}).value||"",name=fv(root,"name");
    st.email=email;if(name)LS.set("pendingName",name);
    if(!validEmail(email)){st.error=t("obBadEmail");refresh();return}
    if(a!=="reset"&&!pw){st.error=t("authNoPw");refresh();return}
    if(a==="signup"&&pw.length<6){st.error=t("authWeak");refresh();return}
    if(!T.authState().configured){st.error=t("obSoon");refresh();return}
    st.error="";st.busy=true;st.acted=true;refresh();
    emit(a==="signup"?"tilawa:pwsignup":a==="login"?"tilawa:pwlogin":"tilawa:pwreset",{email:email,password:pw,name:name});return}
  if(a==="pfclose"){closePf();return}
  if(a==="lang"){openLp(false);return}
  if(a==="theme"){T.toggleTheme();renderPf();return}
  if(a==="skin"){TilawaEarly.setSkin(!TilawaEarly.skinOn());renderPf();return}
  if(a==="bookmarks"){closePf();T.showBookmarks();return}
  if(a==="favs"){closePf();T.showFavs();return}
  if(a==="sheikh"){closePf();var sb=document.getElementById("sheikhBtn");if(sb)sb.click();return}
  if(a==="signout"){emit("tilawa:signout");return}
}
function onKey(e){if(e.key==="Enter"&&e.target.tagName==="INPUT"){var c=e.target.closest(".ob-sign-card,.pf-sign");var b=c&&c.querySelector(".ob-btn.primary");if(b){e.preventDefault();b.click()}}}
function focusFirst(root){setTimeout(function(){var c=root.querySelector(".ob-sign-card input,.pf-sign input");if(c&&window.innerWidth>700)c.focus()},30)}
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
window.addEventListener("tilawa:auth-result",function(e){
  var d=e.detail||{};st.busy=false;
  if(d.ok){st.error="";if(d.mode==="reset"){st.mode="resetsent";st.sentTo=d.email}}
  else{st.acted=false;st.error=d.code?authErr(d.code):"";if(d.code&&/email-already-in-use/.test(d.code))st.mode="login"}
  refresh();
});
window.addEventListener("tilawa:authchange",function(e){
  var A=e.detail||T.authState(),uid=A.user?A.user.uid:null;
  if(A.configured!==prevConfigured){prevConfigured=A.configured;refresh()}
  if(uid&&uid!==prevUser){prevUser=uid;LS.set("hadAccount","1");st.mode="login";st.error="";st.busy=false;
    if(!ob.hidden){if(st.acted){refresh();setTimeout(finish,900)}else finish()}
    else{LS.set("onboarded","1");if(pfOpen())renderPf();if(!LS.get("langChosen")&&lp.hidden)openLp(true)}
    st.acted=false;
  }else if(!uid&&prevUser){prevUser=null;if(pfOpen())renderPf()}
  else if(uid&&pfOpen())renderPf();
  /* signed out: the sign-in screen waits under the opening animation every time the app opens (once per page load) */
  if(A.configured&&A.ready&&!uid&&!gateShown&&ob.hidden&&lp.hidden&&!pfOpen()){gateShown=true;openOb(false)}
});
window.addEventListener("tilawa:langchange",function(){if(!ob.hidden)renderOb();if(pfOpen())renderPf()});
window.addEventListener("hashchange",function(){if(location.hash==="#welcome")openOb(true)});

/* ---------- first visit ---------- */
if(location.hash==="#welcome")openOb(true);
else if(!LS.get("onboarded"))openOb(false);
else if(!LS.get("langChosen"))openLp(true);
})();

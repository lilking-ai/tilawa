/* Tilawa - recitation checker.
   Listens with the browser's speech recognition (Arabic), compares what it heard with the verse word by word,
   and marks each word: correct, wrong (with what was heard) or missed. Classic script; uses window.Tilawa. */
(function(){
"use strict";
var T=window.Tilawa; if(!T) return;
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function t(k){return T.t(k)}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function svg(p,w){return '<svg width="'+(w||20)+'" height="'+(w||20)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'}
var I={mic:svg('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0014 0M12 17v5"/>',30),
  stop:'<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  x:svg('<path d="M18 6L6 18M6 6l12 12"/>'),play:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
  retry:svg('<path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8"/><path d="M3 3v5h5"/>',16),next:svg('<path d="M9 6l6 6-6 6"/>',16),chat:svg('<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1.1-4.6A8 8 0 1121 12z"/>',16)};

/* ---------- text helpers ---------- */
function norm(s){
  return String(s).replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g,"")
    .replace(/[إأآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه")
    .replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/ء/g,"").replace(/[^ء-ي]/g,"");
}
function lev(a,b){var m=a.length,n=b.length;if(!m)return n;if(!n)return m;var p=[],c,i,j;for(j=0;j<=n;j++)p[j]=j;
  for(i=1;i<=m;i++){c=[i];for(j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
function sim(a,b){if(a===b)return 1;var L=Math.max(a.length,b.length);return L?1-lev(a,b)/L:1}
/* Align expected words E with heard words H (both normalised). Returns per-expected status and extra heard words. */
function align(E,H){
  var m=E.length,n=H.length,i,j,D=[],P=[];
  for(i=0;i<=m;i++){D[i]=[];P[i]=[];for(j=0;j<=n;j++){
    if(!i&&!j){D[0][0]=0;continue}
    var best=Infinity,how="";
    if(i&&j){var s=sim(E[i-1],H[j-1]);var c=D[i-1][j-1]+(s>=0.72?0:1);if(c<best){best=c;how=s>=0.72?"ok":"sub"}}
    if(i&&D[i-1][j]+1<best){best=D[i-1][j]+1;how="del"}
    if(j&&D[i][j-1]+0.8<best){best=D[i][j-1]+0.8;how="ins"}
    D[i][j]=best;P[i][j]=how}}
  var st=new Array(m),extra=[];i=m;j=n;
  while(i>0||j>0){var h=P[i][j];
    if(h==="ok"){st[i-1]={s:"ok",heard:H[j-1]};i--;j--}
    else if(h==="sub"){st[i-1]={s:"wrong",heard:H[j-1]};i--;j--}
    else if(h==="del"){st[i-1]={s:"missed"};i--}
    else{extra.unshift(H[j-1]);j--}}
  return {st:st,extra:extra};
}

/* ---------- verse text (standard spelling with harakat, good for matching speech) ---------- */
var cache={};
function getSurah(n){
  if(cache[n])return cache[n];
  cache[n]=fetch("https://api.alquran.cloud/v1/surah/"+n+"/quran-simple").then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()})
  .then(function(j){
    var v=j.data.ayahs.map(function(a){return String(a.text).replace(/^﻿/,"").trim()});
    if(n!==1&&n!==9&&v.length){var w=v[0].split(/\s+/);if(w.slice(0,4).map(norm).join(" ")==="بسم الله الرحمن الرحيم"&&w.length>4)v[0]=w.slice(4).join(" ")}
    return v;
  }).catch(function(e){delete cache[n];throw e});
  return cache[n];
}
function tokens(verse){
  return verse.split(/\s+/).filter(Boolean).map(function(tok){var k=norm(tok);return {t:tok,k:k,word:k.length>0}});
}

/* ---------- UI ---------- */
var rc=document.createElement("div");rc.className="rc";rc.id="recite";rc.hidden=true;rc.setAttribute("role","dialog");rc.setAttribute("aria-modal","true");
document.body.appendChild(rc);
var S={surah:1,idx:0,count:0,verses:null,toks:[],words:[],state:"idle",heard:"",res:null,err:"",rec:null,stopTimer:0};

function wordsHTML(){
  var wi=0,res=S.res;
  return S.toks.map(function(tk){
    if(!tk.word)return '<span class="rc-mk">'+esc(tk.t)+'</span>';
    var r=res&&res.st[wi],cls="rc-w"+(r?" "+r.s:""),title=r&&r.s==="wrong"&&r.heard?' title="'+esc(t("rcHeard"))+': '+esc(r.heard)+'"':'';
    wi++;return '<span class="'+cls+'"'+title+'>'+esc(tk.t)+'</span>';
  }).join(" ");
}
function resultHTML(){
  if(S.state!=="done"||!S.res)return "";
  var st=S.res.st,total=st.length,ok=st.filter(function(x){return x.s==="ok"}).length;
  if(!S.heard.trim())return '<div class="rc-sum warn">'+esc(t("rcNothing"))+'</div>';
  if(ok===total&&!S.res.extra.length)return '<div class="rc-sum good">'+esc(t("rcGreat"))+'</div>';
  var items=[],wi=0;
  S.toks.forEach(function(tk){if(!tk.word)return;var r=st[wi++];
    if(r.s==="wrong")items.push('<li class="wrong">'+esc(t("rcWrong")).replace("{heard}",'<b dir="rtl">'+esc(r.heard)+'</b>').replace("{word}",'<b dir="rtl">'+esc(tk.t)+'</b>')+'</li>');
    else if(r.s==="missed")items.push('<li class="missed">'+esc(t("rcMissed"))+': <b dir="rtl">'+esc(tk.t)+'</b></li>')});
  if(S.res.extra.length)items.push('<li class="extra">'+esc(t("rcExtra"))+': <b dir="rtl">'+esc(S.res.extra.join(" "))+'</b></li>');
  return '<div class="rc-sum"><b>'+esc(t("rcScore")).replace("{n}",ok).replace("{total}",total)+'</b><div class="rc-bar"><span style="width:'+Math.round(ok/total*100)+'%"></span></div><ul>'+items.join("")+'</ul></div>';
}
function render(){
  rc.dir=T.dir();
  var listening=S.state==="listening",done=S.state==="done";
  var status=S.err?S.err:listening?t("rcListening"):done?"":t("rcStart");
  rc.innerHTML='<div class="rc-box">'+
    '<div class="rc-head"><div><b>'+esc(t("rcTitle"))+'</b><span>'+esc(T.surahName(S.surah))+' · '+esc(t("verse"))+' '+(S.idx+1)+' / '+S.count+'</span></div>'+
    '<button class="iconbtn" data-act="close" aria-label="Close">'+I.x+'</button></div>'+
    '<div class="rc-scroll">'+
    (S.verses?'<div class="rc-verse" dir="rtl" lang="ar">'+wordsHTML()+'</div>':'<div class="state"><div class="spinner"></div></div>')+
    '<div class="rc-legend"><span class="ok">'+esc(t("rcLegendOk"))+'</span><span class="wrong">'+esc(t("rcLegendWrong"))+'</span><span class="missed">'+esc(t("rcLegendMissed"))+'</span></div>'+
    (S.heard?'<div class="rc-heard"><span>'+esc(t("rcHeard"))+'</span><p dir="rtl" lang="ar">'+esc(S.heard)+'</p></div>':'')+
    resultHTML()+'</div>'+
    '<div class="rc-foot">'+
    (done?'<div class="rc-actions"><button class="ob-btn ghost" data-act="listen">'+I.play+esc(t("rcListen"))+'</button>'+
        (S.res&&S.res.st.some(function(x){return x.s!=="ok"})&&S.heard.trim()?'<button class="ob-btn ghost" data-act="ask">'+I.chat+esc(t("rcAskSheikh"))+'</button>':'')+
        '<div class="rc-row"><button class="ob-btn ghost" data-act="retry">'+I.retry+esc(t("rcRetry"))+'</button>'+
        (S.idx+1<S.count?'<button class="ob-btn primary" data-act="next">'+esc(t("rcNext"))+I.next+'</button>':'')+'</div></div>'
      :'<button class="rc-mic'+(listening?' on':'')+'" data-act="mic" aria-label="'+esc(listening?t("rcTapStop"):t("rcStart"))+'">'+(listening?I.stop:I.mic)+'</button>'+
       '<div class="rc-status'+(S.err?' err':'')+'">'+esc(status)+'</div>')+
    '<p class="rc-note">'+esc(t("rcNote"))+'</p></div></div>';
}
function setVerse(i){
  stopRec(true);S.idx=i;S.state="idle";S.heard="";S.res=null;S.err="";
  S.toks=S.verses?tokens(S.verses[i]||""):[];S.words=S.toks.filter(function(x){return x.word}).map(function(x){return x.k});
  render();
}
function openRc(n,i){
  S.surah=n;S.count=T.ayahCount(n);S.verses=null;S.idx=i||0;S.state="idle";S.heard="";S.res=null;S.err="";
  rc.hidden=false;document.body.classList.add("ob-open");render();
  getSurah(n).then(function(v){if(S.surah!==n)return;S.verses=v;S.count=v.length;setVerse(Math.min(S.idx,v.length-1))})
    .catch(function(){S.err=t("loadErr");render()});
}
function closeRc(){stopRec(true);rc.hidden=true;document.body.classList.remove("ob-open")}

/* ---------- listening ---------- */
function liveMark(final){
  var H=norm(S.heard)?S.heard.split(/\s+/).map(norm).filter(Boolean):[];
  var a=align(S.words,H);
  if(!final){ /* only judge words up to the last one we've matched so far */
    var last=-1;a.st.forEach(function(r,k){if(r.s!=="missed")last=k});
    a.st=a.st.map(function(r,k){return k>last?{s:""}:r});
  }
  S.res=a;
  var v=rc.querySelector(".rc-verse");if(v)v.innerHTML=wordsHTML();
  return a;
}
function startRec(){
  if(!SR){S.err=t("rcNoSupport");render();return}
  S.err="";S.heard="";S.res=null;S.state="listening";render();
  var rec=new SR();S.rec=rec;
  rec.lang="ar-SA";rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=1;
  rec.onresult=function(ev){
    var txt="",fin=true;
    for(var k=0;k<ev.results.length;k++){txt+=ev.results[k][0].transcript+" ";if(!ev.results[k].isFinal)fin=false}
    S.heard=txt.trim();
    var h=rc.querySelector(".rc-heard p");
    if(h)h.textContent=S.heard;else{var sc=rc.querySelector(".rc-scroll");if(sc){var d=document.createElement("div");d.className="rc-heard";d.innerHTML='<span>'+esc(t("rcHeard"))+'</span><p dir="rtl" lang="ar"></p>';d.querySelector("p").textContent=S.heard;sc.appendChild(d)}}
    var a=liveMark(false);
    clearTimeout(S.stopTimer);
    var reachedEnd=a.st.length&&a.st[a.st.length-1].s!==""&&a.st[a.st.length-1].s!=="missed";
    if(reachedEnd&&fin)S.stopTimer=setTimeout(function(){stopRec(false)},900);
  };
  rec.onerror=function(ev){
    if(ev.error==="not-allowed"||ev.error==="service-not-allowed")S.err=t("rcNoMic");
    else if(ev.error==="no-speech")S.err=t("rcNothing");
    else if(ev.error!=="aborted")S.err=t("audioErr");
  };
  rec.onend=function(){if(S.rec!==rec)return;S.rec=null;finish()};
  try{rec.start()}catch(e){S.err=t("rcNoSupport");S.state="idle";render()}
}
function stopRec(silent){
  clearTimeout(S.stopTimer);
  var r=S.rec;if(!r)return;
  if(silent){S.rec=null;try{r.abort()}catch(e){}}else{try{r.stop()}catch(e){}}
}
function finish(){
  if(S.state!=="listening")return;
  if(S.err&&!S.heard){S.state="idle";render();return}
  liveMark(true);S.state="done";render();
}

/* ---------- actions ---------- */
rc.addEventListener("click",function(e){
  if(e.target===rc){closeRc();return}
  var b=e.target.closest("[data-act]");if(!b)return;var a=b.dataset.act;
  if(a==="close")closeRc();
  else if(a==="mic"){if(S.state==="listening")stopRec(false);else startRec()}
  else if(a==="retry")setVerse(S.idx);
  else if(a==="next"){if(S.idx+1<S.count)setVerse(S.idx+1)}
  else if(a==="listen")T.playVerse(S.surah,S.idx);
  else if(a==="ask"){
    var list=[],wi=0;
    S.toks.forEach(function(tk){if(!tk.word)return;var r=S.res.st[wi++];
      if(r.s==="wrong")list.push("said \""+r.heard+"\" instead of \""+tk.t+"\"");else if(r.s==="missed")list.push("missed \""+tk.t+"\"")});
    if(S.res.extra.length)list.push("added \""+S.res.extra.join(" ")+"\"");
    var text=t("shAskMistakes").replace("{surah}",T.surahName(S.surah)).replace("{ref}",S.surah+":"+(S.idx+1)).replace("{list}",list.join("; "));
    closeRc();
    window.dispatchEvent(new CustomEvent("tilawa:sheikhsay",{detail:{text:text,extra:"The correct verse "+S.surah+":"+(S.idx+1)+" is: "+S.verses[S.idx]+" | What the speech recognition heard: "+S.heard}}));
  }
});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!rc.hidden)closeRc()});
window.addEventListener("tilawa:recite",function(e){var d=e.detail||{};openRc(d.surah||1,d.ayah||0)});
window.addEventListener("tilawa:closeall",function(){if(!rc.hidden)closeRc()});
window.TilawaRecite={align:align,norm:norm};
})();

/* Tilawa - prayer times for your city (aladhan.com, local calculation method chosen automatically)
   and the athan at each salah time. The athan plays while Tilawa is open; web apps can't play sound when closed.
   Classic script: talks to app.js through window.Tilawa. */
(function(){
"use strict";
var T=window.Tilawa; if(!T) return;
function t(k){return T.t(k)}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
var LS={get:function(k,d){try{var v=localStorage.getItem("tilawa."+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
        set:function(k,v){try{localStorage.setItem("tilawa."+k,JSON.stringify(v))}catch(e){}}};
function svg(p,w){return '<svg width="'+(w||20)+'" height="'+(w||20)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
var I={
  moon:svg('<path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"/>'),
  x:svg('<path d="M18 6L6 18M6 6l12 12"/>'),
  pin:svg('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',18),
  bell:svg('<path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a1.9 1.9 0 003.4 0"/>',18),
  bellOff:svg('<path d="M8.7 3.3A6 6 0 0118 8c0 3 .6 4.9 1.3 6.1M17 17H3s3-1 3-8c0-.8.1-1.5.4-2.2M10.3 20a1.9 1.9 0 003.4 0M3 3l18 18"/>',18),
  play:svg('<path d="M7 5l12 7-12 7z"/>',16), stop:svg('<rect x="6" y="6" width="12" height="12" rx="1.5"/>',16),
  loc:svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/>',18)
};
var PRAYERS=["Fajr","Dhuhr","Asr","Maghrib","Isha"], ROWS=["Fajr","Sunrise","Dhuhr","Asr","Maghrib","Isha"];
var AR={Fajr:"الفجر",Sunrise:"الشروق",Dhuhr:"الظهر",Asr:"العصر",Maghrib:"المغرب",Isha:"العشاء"};
var VOICES=[{src:"athan/athan-1.mp3"},{src:"athan/athan-2.mp3"}];
var REGIONS="AE SA QA KW BH OM YE IQ JO SY LB PS EG SD LY TN DZ MA MR SO DJ ET ER KE TZ UG NG GH SN ML NE TD CM GM GN SL CI BF TR IR AF PK IN BD LK MV NP MM TH MY SG ID BN PH CN JP KR MN KZ UZ KG TJ TM AZ GE AM RU UA BY PL DE FR GB IE NL BE LU CH AT IT ES PT SE NO DK FI IS EE LV LT CZ SK HU RO BG GR CY MT AL XK BA RS ME MK HR SI MD US CA MX GT HN SV NI CR PA CU DO JM TT BR AR CL CO PE VE EC BO PY UY AU NZ FJ ZA NA BW ZW ZM MZ MW MG MU KM SC RW BI CD CG GA GQ AO BJ TG LR GW CV ST".split(" ");

/* ---------- state ---------- */
var P=LS.get("prayer",{});            // {mode:"city"|"geo", city, country, lat, lng, athan:true, voice:0, off:{Fajr:false,...}}
if(P.athan==null)P.athan=true; if(!P.off)P.off={}; if(P.voice==null)P.voice=0;
var days=[], meta=null, loading=false, err="", editing=false, playing=null, lastRender=0;
function save(){LS.set("prayer",P)}
function hasLoc(){return P.mode==="geo"?(P.lat!=null&&P.lng!=null):!!(P.city&&P.country)}
function locKey(){return P.mode==="geo"?"g:"+(+P.lat).toFixed(2)+","+(+P.lng).toFixed(2):"c:"+P.country+":"+String(P.city).trim().toLowerCase()}
function regionName(code){try{return new Intl.DisplayNames([T.getLang(),"en"],{type:"region"}).of(code)||code}catch(e){return code}}
function guessRegion(){var m=(navigator.language||"").match(/-([A-Z]{2})$/i);return m?m[1].toUpperCase():"AE"}
function arName(k){return T.getLang()==="ar"?"":'<span class="pt-ar">'+AR[k]+'</span>'}
function locLabel(){return P.mode==="geo"?t("ptMyLoc"):(P.city+", "+regionName(P.country))}

/* ---------- data: a month at a time, cached on the device ---------- */
function monthUrl(y,m){
  var base="https://api.aladhan.com/v1/";
  if(P.mode==="geo")return base+"calendar/"+y+"/"+m+"?latitude="+encodeURIComponent(P.lat)+"&longitude="+encodeURIComponent(P.lng)+"&iso8601=true";
  return base+"calendarByCity/"+y+"/"+m+"?city="+encodeURIComponent(P.city)+"&country="+encodeURIComponent(P.country)+"&iso8601=true";
}
function getMonth(y,m){
  var ck="prayerCal|"+locKey()+"|"+y+"-"+m, c=LS.get(ck,null);
  if(c&&c.days&&c.days.length)return Promise.resolve(c);
  return fetch(monthUrl(y,m)).then(function(r){return r.json().then(function(j){
    if(!r.ok||j.code!==200||!Array.isArray(j.data)){var e=new Error("bad");e.notFound=r.status===400;throw e}
    var out={meta:{tz:j.data[0].meta.timezone,method:(j.data[0].meta.method||{}).name||""},
      days:j.data.map(function(d){var o={date:d.date.gregorian.date};ROWS.forEach(function(k){o[k]=String(d.timings[k]).split(" ")[0]});return o})};
    LS.set(ck,out);return out})});
}
function load(){
  if(!hasLoc())return Promise.resolve();
  loading=true;err="";render();
  var now=new Date(),y=now.getFullYear(),m=now.getMonth()+1,ny=m===12?y+1:y,nm=m===12?1:m+1;
  return Promise.all([getMonth(y,m),getMonth(ny,nm).catch(function(){return {days:[]}})]).then(function(r){
    meta=r[0].meta;days=r[0].days.concat(r[1].days);loading=false;render();updateChip();
  }).catch(function(e){loading=false;err=e&&e.notFound?t("ptNotFound"):t("ptOffline");if(e&&e.notFound)editing=true;render()});
}

/* ---------- times ---------- */
function events(){ // every prayer from today onwards, as real moments in time
  var out=[];days.forEach(function(d){ROWS.forEach(function(k){var at=new Date(d[k]);if(!isNaN(at))out.push({k:k,at:at,date:d.date})})});
  return out.sort(function(a,b){return a.at-b.at});
}
function locDate(at){try{return new Intl.DateTimeFormat("en-GB",{timeZone:meta.tz,day:"2-digit",month:"2-digit",year:"numeric"}).format(at).replace(/\//g,"-")}catch(e){return ""}}
function fmt(at){try{return new Intl.DateTimeFormat(T.getLang(),{hour:"numeric",minute:"2-digit",timeZone:meta&&meta.tz}).format(at)}catch(e){return at.toTimeString().slice(0,5)}}
function today(){var ev=events(),key=locDate(new Date());return ev.filter(function(e){return e.date===key})}
function next(){var now=Date.now();return events().filter(function(e){return e.k!=="Sunrise"&&e.at.getTime()>now})[0]||null}
function left(ms){var mins=Math.max(0,Math.round(ms/60000)),h=Math.floor(mins/60),m=mins%60;
  return h?t("ptHM").replace("{h}",h).replace("{m}",m):t("ptM").replace("{m}",m)}

/* ---------- the panel ---------- */
var scrim=document.createElement("div");scrim.className="sh-scrim pt-scrim";
var panel=document.createElement("aside");panel.id="prayer";panel.className="pf pt";panel.setAttribute("aria-label","Prayer times");
document.body.appendChild(scrim);document.body.appendChild(panel);
function isOpen(){return panel.classList.contains("open")}
function open(){render();panel.classList.add("open");scrim.classList.add("open");if(hasLoc()&&!days.length&&!loading)load()}
function close(){panel.classList.remove("open");scrim.classList.remove("open")}
scrim.addEventListener("click",close);

function formHTML(){
  var cur=P.country||guessRegion();
  var opts=REGIONS.map(function(c){return {c:c,n:regionName(c)}}).sort(function(a,b){return a.n.localeCompare(b.n,T.getLang())})
    .map(function(o){return '<option value="'+o.c+'"'+(o.c===cur?" selected":"")+'>'+esc(o.n)+'</option>'}).join("");
  return '<div class="pf-card pt-form"><p class="pt-intro">'+esc(t("ptPick"))+'</p>'+
    (err?'<div class="ob-err" role="alert">'+esc(err)+'</div>':'')+
    '<label class="pt-lbl">'+esc(t("ptCountry"))+'<select data-f="country">'+opts+'</select></label>'+
    '<label class="pt-lbl">'+esc(t("ptCity"))+'<input data-f="city" type="text" autocomplete="address-level2" placeholder="'+esc(t("ptCityPh"))+'" value="'+esc(P.mode==="city"?P.city||"":"")+'"></label>'+
    '<button class="ob-btn primary" data-act="savecity">'+esc(t("ptSave"))+'</button>'+
    ('geolocation' in navigator?'<button class="ob-btn ghost pt-geo" data-act="geo">'+I.loc+esc(t("ptUseLoc"))+'</button>':'')+
    (hasLoc()?'<button class="ob-link" data-act="cancel">'+esc(t("ptCancel"))+'</button>':'')+'</div>';
}
function render(){
  lastRender=Date.now();panel.dir=T.dir();
  var body;
  if(!hasLoc()||editing) body=formHTML();
  else if(loading&&!days.length) body='<div class="pt-wait"><div class="spinner"></div></div>';
  else if(err&&!days.length) body='<div class="pf-card"><div class="ob-err" role="alert">'+esc(err)+'</div><button class="ob-btn primary" data-act="retry">'+esc(t("ptRetry"))+'</button><button class="ob-link" data-act="change">'+esc(t("ptChange"))+'</button></div>';
  else{
    var n=next(),list=today(),nowMs=Date.now();
    var hero=n?'<div class="pt-hero"><div class="pt-loc">'+I.pin+'<span>'+esc(locLabel())+'</span><button class="pt-change" data-act="change">'+esc(t("ptChange"))+'</button></div>'+
      '<div class="pt-next-l">'+esc(t("ptNextLbl"))+'</div><div class="pt-next">'+arName(n.k)+'<b>'+esc(t("pt"+n.k))+'</b></div>'+
      '<div class="pt-at"><span>'+esc(fmt(n.at))+'</span> · <span class="pt-cd">'+esc(t("ptIn").replace("{time}",left(n.at-nowMs)))+'</span></div></div>':'';
    var rows=list.map(function(e){
      var isNext=n&&e.k===n.k&&e.at.getTime()===n.at.getTime(),past=e.at.getTime()<=nowMs,pr=PRAYERS.indexOf(e.k)>=0,on=pr&&P.athan&&!P.off[e.k];
      return '<div class="pt-row'+(isNext?' next':'')+(past?' past':'')+'"><span class="pt-n"><b>'+esc(t("pt"+e.k))+'</b>'+arName(e.k)+'</span>'+
        '<span class="pt-t">'+esc(fmt(e.at))+'</span>'+
        (pr?'<button class="pt-bell'+(on?' on':'')+'" data-act="bell" data-k="'+e.k+'" aria-pressed="'+on+'" aria-label="'+esc(t("ptAthan")+" – "+t("pt"+e.k))+'">'+(on?I.bell:I.bellOff)+'</button>':'<span class="pt-bell-sp"></span>')+'</div>';
    }).join("");
    body=hero+'<div class="pf-list pt-list">'+rows+'</div>'+
      '<div class="pf-label">'+esc(t("ptAthan"))+'</div><div class="pf-list">'+
        '<button class="pf-row" data-act="athan"><span class="ic">'+I.bell+'</span><span class="lbl">'+esc(t("ptAthanOn"))+'</span><span class="switch'+(P.athan?" on":"")+'" role="switch" aria-checked="'+!!P.athan+'"></span></button>'+
        '<div class="pf-row pt-voices"><span class="lbl">'+esc(t("ptVoice"))+'</span>'+VOICES.map(function(v,i){return '<button class="pt-v'+(P.voice===i?' on':'')+'" data-act="voice" data-i="'+i+'">'+(i+1)+'</button>'}).join("")+
          '<button class="pt-listen" data-act="'+(playing?"stop":"listen")+'">'+(playing?I.stop:I.play)+'<span>'+esc(playing?t("ptStop"):t("ptTest"))+'</span></button></div>'+
      '</div><p class="pt-note">'+esc(t("ptKeepOpen"))+'</p>'+
      (meta&&meta.method?'<p class="pt-note">'+esc(t("ptMethod").replace("{method}",meta.method))+'</p>':'');
  }
  panel.innerHTML='<div class="pf-head"><b>'+esc(t("ptTitle"))+'</b><button class="iconbtn" data-act="close" aria-label="Close">'+I.x+'</button></div><div class="pf-body">'+body+'</div>';
}
function fv(f){var el=panel.querySelector('[data-f="'+f+'"]');return el?(el.value||"").trim():""}
panel.addEventListener("click",function(e){
  var b=e.target.closest("[data-act]");if(!b)return;var a=b.dataset.act;
  if(a==="close"){close();return}
  if(a==="change"){editing=true;err="";render();return}
  if(a==="cancel"){editing=false;err="";render();return}
  if(a==="retry"){load();return}
  if(a==="savecity"){var city=fv("city"),country=fv("country");if(!city){err=t("ptCityPh");render();return}
    P.mode="city";P.city=city;P.country=country;delete P.lat;delete P.lng;save();editing=false;days=[];meta=null;load();return}
  if(a==="geo"){err=t("ptLocating");render();
    navigator.geolocation.getCurrentPosition(function(pos){P.mode="geo";P.lat=+pos.coords.latitude.toFixed(3);P.lng=+pos.coords.longitude.toFixed(3);save();editing=false;days=[];meta=null;load()},
      function(){err=t("ptLocErr");render()},{timeout:15000,maximumAge:3600000});return}
  if(a==="bell"){var k=b.dataset.k;if(!P.athan){P.athan=true;P.off={};P.off[k]=false;PRAYERS.forEach(function(x){if(x!==k)P.off[x]=true})}else P.off[k]=!P.off[k];save();askNotify();render();return}
  if(a==="athan"){P.athan=!P.athan;save();if(P.athan)askNotify();render();return}
  if(a==="voice"){P.voice=+b.dataset.i;save();if(playing)stopAthan();render();return}
  if(a==="listen"){playAthan(null);return}
  if(a==="stop"){stopAthan();return}
});
panel.addEventListener("keydown",function(e){if(e.key==="Enter"&&e.target.matches('[data-f="city"]')){e.preventDefault();var s=panel.querySelector('[data-act=savecity]');if(s)s.click()}});

/* ---------- the athan ---------- */
var athan=new Audio();athan.preload="none";
athan.addEventListener("ended",function(){playing=null;hideBanner();if(isOpen())render()});
// Phones only let a page play sound later if it has played sound after a tap: "unlock" on the first tap.
var unlocked=false;
function unlock(){if(unlocked||!P.athan)return;unlocked=true;try{athan.src=VOICES[P.voice].src;athan.muted=true;var p=athan.play();if(p&&p.then)p.then(function(){athan.pause();athan.currentTime=0;athan.muted=false}).catch(function(){athan.muted=false;unlocked=false})}catch(e){unlocked=false}}
document.addEventListener("click",unlock,true);document.addEventListener("touchend",unlock,true);
function playAthan(k){
  try{T.pauseAudio&&T.pauseAudio()}catch(e){}
  athan.src=VOICES[P.voice].src;athan.muted=false;athan.currentTime=0;playing=k||"test";
  var p=athan.play();if(p&&p.catch)p.catch(function(){playing=null;if(isOpen())render()});
  if(isOpen())render();
}
function stopAthan(){athan.pause();athan.currentTime=0;playing=null;hideBanner();if(isOpen())render()}
function askNotify(){try{if("Notification" in window&&Notification.permission==="default")Notification.requestPermission()}catch(e){}}

/* banner shown at prayer time, with a stop button */
var banner=document.createElement("div");banner.className="pt-banner";banner.hidden=true;banner.setAttribute("role","alert");document.body.appendChild(banner);
function showBanner(k,at){
  banner.dir=T.dir();
  banner.innerHTML='<span class="pt-ar">'+AR[k]+'</span><div class="pt-bt"><b>'+esc(t("ptNow").replace("{prayer}",t("pt"+k)))+'</b><span>'+esc(fmt(at))+' · '+esc(locLabel())+'</span></div>'+
    '<button class="pt-bstop" data-act="bstop">'+(playing?I.stop:I.x)+'<span>'+esc(playing?t("ptStop"):t("ptClose"))+'</span></button>';
  banner.hidden=false;
}
function hideBanner(){banner.hidden=true}
banner.addEventListener("click",function(e){if(e.target.closest("[data-act=bstop]")){stopAthan();hideBanner()}});

/* every 15 seconds: is it salah time? */
function tick(){
  if(!days.length||!meta)return;
  var now=Date.now(),played=LS.get("prayerPlayed",{}),changed=false;
  events().forEach(function(e){
    if(PRAYERS.indexOf(e.k)<0)return;var at=e.at.getTime(),key=e.date+"|"+e.k;
    if(now>=at&&now-at<3*60000&&!played[key]){
      played[key]=1;changed=true;
      var athanOn=P.athan&&!P.off[e.k];
      if(athanOn)playAthan(e.k);
      showBanner(e.k,e.at);
      try{if(document.hidden&&"Notification" in window&&Notification.permission==="granted")new Notification(t("ptNow").replace("{prayer}",t("pt"+e.k)),{body:fmt(e.at)+" · "+locLabel(),tag:key,icon:"icons/icon-192.png"})}catch(err){}
    }
  });
  if(changed){var ks=Object.keys(played).slice(-30),keep={};ks.forEach(function(k){keep[k]=1});LS.set("prayerPlayed",keep)}
  // new day or new month: reload; keep the countdown fresh
  var last=days[days.length-1];if(last&&new Date(last.Isha).getTime()<now)load();
  if(isOpen()&&!editing&&Date.now()-lastRender>25000)render();
  updateChip();
}
setInterval(tick,15000);
document.addEventListener("visibilitychange",function(){if(!document.hidden){tick();if(hasLoc()&&!days.length)load()}});

/* next-prayer chip in the top bar (wider screens; phones use the tab bar) */
var chip=document.createElement("button");chip.className="pill pt-chip";chip.id="prayerBtn";chip.type="button";
var hdr=document.getElementById("langBtn");if(hdr&&hdr.parentNode)hdr.parentNode.insertBefore(chip,hdr);
chip.addEventListener("click",function(){isOpen()?close():open()});
function updateChip(){
  var n=hasLoc()&&days.length?next():null;
  chip.innerHTML=I.moon+'<span>'+(n?esc(t("pt"+n.k))+" "+esc(fmt(n.at)):esc(t("tabPrayer")))+'</span>';
  chip.setAttribute("aria-label",t("ptTitle"));
}

window.addEventListener("tilawa:prayer",function(){isOpen()?close():open()});
window.addEventListener("tilawa:closeall",close);
window.addEventListener("tilawa:langchange",function(){updateChip();if(isOpen())render()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&isOpen())close()});
window.TilawaPrayer={open:open,close:close,isOpen:isOpen,_tick:tick,_state:function(){return {P:P,days:days,meta:meta}}};
updateChip();
if(hasLoc())load();
})();

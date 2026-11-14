/* Tilawa - opening animation ("تلاوة", by Yaqub) and the bottom tab bar on phones. Classic script. */
(function(){
"use strict";
/* ---------- opening animation: once each time the app is opened ---------- */
var sp=document.getElementById("splash");
if(sp){
  var seen=false;try{seen=sessionStorage.getItem("tilawa.splash")==="1";sessionStorage.setItem("tilawa.splash","1")}catch(e){}
  var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(seen){sp.remove()}
  else{
    var gone=false;
    var hide=function(){if(gone)return;gone=true;sp.classList.add("out");setTimeout(function(){sp.remove()},600)};
    sp.addEventListener("click",hide);
    setTimeout(hide,reduce?900:3000);
  }
}
var T=window.Tilawa; if(!T) return;
function t(k){return T.t(k)}
function svg(p){return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'}
var tabs=[
  {id:"read",k:"tabRead",i:svg('<path d="M2 5.5C4.5 4 8 4 12 6c4-2 7.5-2 10-.5V19c-2.5-1.5-6-1.5-10 .5-4-2-7.5-2-10-.5z"/><path d="M12 6v13.5"/>')},
  {id:"surahs",k:"surahs",i:svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>')},
  {id:"reciters",k:"reciters",i:svg('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0014 0M12 17v5"/>')},
  {id:"sheikh",k:"tabSheikh",i:svg('<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1.1-4.6A8 8 0 1121 12z"/>')},
  {id:"profile",k:"profile",i:svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>')}
];
var bar=document.createElement("nav");bar.className="tabbar";bar.setAttribute("aria-label","Tabs");
document.body.appendChild(bar);document.body.classList.add("has-tabbar");
function render(){
  bar.innerHTML=tabs.map(function(x){return '<button type="button" data-tab="'+x.id+'"><span class="ti">'+x.i+'</span><span class="tl">'+t(x.k)+'</span></button>'}).join("");
  sync();
}
function isOpen(id){var el=document.getElementById(id);return !!el&&el.classList.contains("open")}
function sync(){
  var cur=isOpen("profile")?"profile":isOpen("sheikh")?"sheikh":isOpen("right")?"reciters":isOpen("left")?"surahs":"read";
  bar.querySelectorAll("[data-tab]").forEach(function(b){b.classList.toggle("on",b.dataset.tab===cur)});
}
function closeAll(except){
  if(except!=="surahs"&&except!=="reciters")T.closeDrawers();
  if(except!=="sheikh"&&isOpen("sheikh"))window.dispatchEvent(new CustomEvent("tilawa:sheikh"));
  if(except!=="profile"&&isOpen("profile"))window.dispatchEvent(new CustomEvent("tilawa:profile"));
}
bar.addEventListener("click",function(e){
  var b=e.target.closest("[data-tab]");if(!b)return;var id=b.dataset.tab;
  if(id==="read"){closeAll();}
  else if(id==="surahs"){closeAll("surahs");T.closeDrawers();T.openSurahs();}
  else if(id==="reciters"){closeAll("reciters");T.closeDrawers();T.openReciters();}
  else if(id==="sheikh"){closeAll("sheikh");if(!isOpen("sheikh"))window.dispatchEvent(new CustomEvent("tilawa:sheikh"));}
  else if(id==="profile"){closeAll("profile");if(!isOpen("profile"))window.dispatchEvent(new CustomEvent("tilawa:profile"));}
  setTimeout(sync,30);
});
if("MutationObserver" in window){
  var mo=new MutationObserver(sync);
  ["left","right"].forEach(function(id){var el=document.getElementById(id);if(el)mo.observe(el,{attributes:true,attributeFilter:["class"]})});
  /* panels are created by other scripts; watch them once they exist */
  var watch=function(){["sheikh","profile"].forEach(function(id){var el=document.getElementById(id);if(el&&!el.dataset.tw){el.dataset.tw="1";mo.observe(el,{attributes:true,attributeFilter:["class"]})}})};
  watch();setTimeout(watch,500);setTimeout(watch,2000);
}
window.addEventListener("tilawa:langchange",render);
render();
})();

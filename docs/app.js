(function(){
"use strict";
/* ---------- static data ---------- */
const EN_NAMES="Al-Faatiha|Al-Baqara|Aal-i-Imraan|An-Nisaa|Al-Maaida|Al-An'aam|Al-A'raaf|Al-Anfaal|At-Tawba|Yunus|Hud|Yusuf|Ar-Ra'd|Ibrahim|Al-Hijr|An-Nahl|Al-Israa|Al-Kahf|Maryam|Taa-Haa|Al-Anbiyaa|Al-Hajj|Al-Muminoon|An-Noor|Al-Furqaan|Ash-Shu'araa|An-Naml|Al-Qasas|Al-Ankaboot|Ar-Room|Luqman|As-Sajda|Al-Ahzaab|Saba|Faatir|Yaseen|As-Saaffaat|Saad|Az-Zumar|Ghafir|Fussilat|Ash-Shura|Az-Zukhruf|Ad-Dukhaan|Al-Jaathiya|Al-Ahqaf|Muhammad|Al-Fath|Al-Hujuraat|Qaaf|Adh-Dhaariyat|At-Tur|An-Najm|Al-Qamar|Ar-Rahmaan|Al-Waaqia|Al-Hadid|Al-Mujaadila|Al-Hashr|Al-Mumtahana|As-Saff|Al-Jumu'a|Al-Munaafiqoon|At-Taghaabun|At-Talaaq|At-Tahrim|Al-Mulk|Al-Qalam|Al-Haaqqa|Al-Ma'aarij|Nooh|Al-Jinn|Al-Muzzammil|Al-Muddaththir|Al-Qiyaama|Al-Insaan|Al-Mursalaat|An-Naba|An-Naazi'aat|Abasa|At-Takwir|Al-Infitaar|Al-Mutaffifin|Al-Inshiqaaq|Al-Burooj|At-Taariq|Al-A'laa|Al-Ghaashiya|Al-Fajr|Al-Balad|Ash-Shams|Al-Lail|Ad-Dhuhaa|Ash-Sharh|At-Tin|Al-Alaq|Al-Qadr|Al-Bayyina|Az-Zalzala|Al-Aadiyaat|Al-Qaari'a|At-Takaathur|Al-Asr|Al-Humaza|Al-Fil|Quraish|Al-Maa'un|Al-Kawthar|Al-Kaafiroon|An-Nasr|Al-Masad|Al-Ikhlaas|Al-Falaq|An-Naas".split("|");
const AR_NAMES="الفاتحة|البقرة|آل عمران|النساء|المائدة|الأنعام|الأعراف|الأنفال|التوبة|يونس|هود|يوسف|الرعد|إبراهيم|الحجر|النحل|الإسراء|الكهف|مريم|طه|الأنبياء|الحج|المؤمنون|النور|الفرقان|الشعراء|النمل|القصص|العنكبوت|الروم|لقمان|السجدة|الأحزاب|سبأ|فاطر|يس|الصافات|ص|الزمر|غافر|فصلت|الشورى|الزخرف|الدخان|الجاثية|الأحقاف|محمد|الفتح|الحجرات|ق|الذاريات|الطور|النجم|القمر|الرحمن|الواقعة|الحديد|المجادلة|الحشر|الممتحنة|الصف|الجمعة|المنافقون|التغابن|الطلاق|التحريم|الملك|القلم|الحاقة|المعارج|نوح|الجن|المزمل|المدثر|القيامة|الإنسان|المرسلات|النبأ|النازعات|عبس|التكوير|الانفطار|المطففين|الانشقاق|البروج|الطارق|الأعلى|الغاشية|الفجر|البلد|الشمس|الليل|الضحى|الشرح|التين|العلق|القدر|البينة|الزلزلة|العاديات|القارعة|التكاثر|العصر|الهمزة|الفيل|قريش|الماعون|الكوثر|الكافرون|النصر|المسد|الإخلاص|الفلق|الناس".split("|");
const COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
const MEDINAN=new Set([2,3,4,5,8,9,13,22,24,33,47,48,49,55,57,58,59,60,61,62,63,64,65,66,76,98,99,110]);
const START=[0];for(let i=0;i<114;i++)START.push(START[i]+COUNTS[i]); // START[n-1] = ayahs before surah n
const MEANINGS={};
const TRANSLATIONS=[
  ["en.sahih","English — Saheeh International"],["en.pickthall","English — Pickthall"],["en.yusufali","English — Yusuf Ali"],
  ["ar.muyassar","العربية — التفسير الميسر"],["ar.jalalayn","العربية — تفسير الجلالين"],
  ["fr.hamidullah","Français — Hamidullah"],["es.cortes","Español — Cortés"],["de.aburida","Deutsch — Abu Rida"],
  ["tr.diyanet","Türkçe — Diyanet"],["ur.jalandhry","اردو — جالندہری"],["id.indonesian","Indonesia — Kemenag"],
  ["ms.basmeih","Melayu — Basmeih"],["bn.bengali","বাংলা — Muhiuddin Khan"],["ru.kuliev","Русский — Кулиев"],["fa.ansarian","فارسی — انصاریان"]
];
const VERSE_RECITERS=[
  ["ar.alafasy","Mishary Rashid Alafasy","مشاري راشد العفاسي"],["ar.abdulbasitmurattal","Abdul Basit (Murattal)","عبد الباسط عبد الصمد (مرتل)"],
  ["ar.abdurrahmaansudais","Abdurrahmaan As-Sudais","عبد الرحمن السديس"],["ar.husary","Mahmoud Khalil Al-Husary","محمود خليل الحصري"],
  ["ar.husarymujawwad","Al-Husary (Mujawwad)","الحصري (مجود)"],["ar.minshawi","Mohamed Siddiq Al-Minshawi","محمد صديق المنشاوي"],
  ["ar.mahermuaiqly","Maher Al-Muaiqly","ماهر المعيقلي"],["ar.saoodshuraym","Saood Ash-Shuraym","سعود الشريم"],
  ["ar.shaatree","Abu Bakr Ash-Shaatree","أبو بكر الشاطري"],["ar.hudhaify","Ali Al-Hudhaify","علي الحذيفي"],
  ["ar.muhammadayyoub","Muhammad Ayyoub","محمد أيوب"],["ar.ahmedajamy","Ahmed Al-Ajamy","أحمد العجمي"],
  ["ar.abdullahbasfar","Abdullah Basfar","عبد الله بصفر"],["ar.hanirifai","Hani Ar-Rifai","هاني الرفاعي"],["ar.muhammadjibreel","Muhammad Jibreel","محمد جبريل"]
];
const I18N={
  en:{surahs:"Surahs",reciters:"Reciters",all:"All",favorites:"Favorites",searchSurah:"Search surah or number",searchRec:"Search reciters",
    translation:"Translation",layout:"Reading layout",withTr:"With translation",mushaf:"Mushaf flow",fontSize:"Arabic font size",
    verseReciter:"Verse-by-verse reciter (tap a verse)",follow:"Auto-scroll to playing verse",on:"On",off:"Off",
    meccan:"Meccan",medinan:"Medinan",ayahs:"verses",playSurah:"Play surah",playVerses:"Play verse by verse",
    pickReciter:"Choose a reciter",notAvail:"This recitation doesn't include this surah — pick another riwayah or reciter.",
    loading:"Loading…",loadErr:"Couldn't load. Check your internet connection.",retry:"Retry",noFav:"Star reciters to keep them here.",
    noRes:"No matches",prev:"Previous",next:"Next",verse:"Verse",audioErr:"Couldn't play this audio. Try another reciter.",
    surahMode:"Full surah",verseMode:"Verse",tapHint:"Tap any verse to hear it",ready:"Select a surah and press play",recs:"reciters",riwayat:"recitations",
    repeatOn:"Repeat on",repeatOff:"Repeat off",autoOn:"Autoplay next: on",autoOff:"Autoplay next: off",
    bookmarks:"Bookmarks",noBm:"Tap the bookmark icon on any verse to save it here.",bmAdded:"Bookmark saved",bmRemoved:"Bookmark removed",
    signIn:"Sign in",signOut:"Sign out",synced:"Favorites, bookmarks and settings are synced to your account.",syncing:"Syncing…",
    syncErr:"Couldn't sync right now — changes are kept on this device and will sync later.",signInErr:"Sign-in failed. Please try again.",welcome:"Signed in — your data now syncs"},
  ar:{surahs:"السور",reciters:"القرّاء",all:"الكل",favorites:"المفضلة",searchSurah:"ابحث باسم السورة أو رقمها",searchRec:"ابحث عن قارئ",
    translation:"الترجمة / التفسير",layout:"طريقة العرض",withTr:"مع الترجمة",mushaf:"عرض المصحف",fontSize:"حجم الخط",
    verseReciter:"قارئ الآيات (اضغط على آية)",follow:"التمرير التلقائي للآية",on:"تشغيل",off:"إيقاف",
    meccan:"مكية",medinan:"مدنية",ayahs:"آية",playSurah:"تشغيل السورة",playVerses:"تشغيل آية آية",
    pickReciter:"اختر قارئًا",notAvail:"هذه الرواية لا تحتوي على هذه السورة — اختر رواية أو قارئًا آخر.",
    loading:"جارٍ التحميل…",loadErr:"تعذر التحميل. تحقق من اتصالك بالإنترنت.",retry:"إعادة المحاولة",noFav:"أضف القرّاء إلى المفضلة بالضغط على النجمة.",
    noRes:"لا توجد نتائج",prev:"السابقة",next:"التالية",verse:"آية",audioErr:"تعذر تشغيل الصوت. جرّب قارئًا آخر.",
    surahMode:"السورة كاملة",verseMode:"آية",tapHint:"اضغط على أي آية لسماعها",ready:"اختر سورة واضغط تشغيل",recs:"قارئ",riwayat:"روايات",
    repeatOn:"التكرار مفعّل",repeatOff:"التكرار متوقف",autoOn:"التشغيل التلقائي للتالي: مفعّل",autoOff:"التشغيل التلقائي للتالي: متوقف",
    bookmarks:"العلامات",noBm:"اضغط على أيقونة العلامة بجانب أي آية لحفظها هنا.",bmAdded:"تم حفظ العلامة",bmRemoved:"تم حذف العلامة",
    signIn:"تسجيل الدخول",signOut:"تسجيل الخروج",synced:"المفضلة والعلامات والإعدادات متزامنة مع حسابك.",syncing:"جارٍ المزامنة…",
    syncErr:"تعذرت المزامنة الآن — التغييرات محفوظة على هذا الجهاز وستتم مزامنتها لاحقًا.",signInErr:"فشل تسجيل الدخول. حاول مرة أخرى.",welcome:"تم تسجيل الدخول — بياناتك تتزامن الآن"}
};
const ICON={
  play:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
  pause:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
  star:'<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.6 7.2.7-5.4 4.9 1.6 7.1L12 17.6 5.6 21.3l1.6-7.1L1.8 9.3 9 8.6z"/></svg>',
  starO:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l3 6.6 7.2.7-5.4 4.9 1.6 7.1L12 17.6 5.6 21.3l1.6-7.1L1.8 9.3 9 8.6z"/></svg>',
  sun:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>',
  mic:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0014 0M12 17v5"/></svg>',
  list:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  bm:'<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h12a1 1 0 011 1v19l-7-4.5L5 22V3a1 1 0 011-1z"/></svg>',
  bmO:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2h12a1 1 0 011 1v19l-7-4.5L5 22V3a1 1 0 011-1z"/></svg>',
  x:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  google:'<svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>',
  chevL:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>',
  chevR:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>',
  pattern:'<svg class="pattern" width="100%" height="100%"><defs><pattern id="pt" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M24 2l6 10 12 0-6 10 6 10-12 0-6 10-6-10-12 0 6-10-6-10 12 0z" fill="none" stroke="currentColor" stroke-width="1.2"/></pattern></defs><rect width="100%" height="100%" fill="url(#pt)"/></svg>'
};

/* ---------- state ---------- */
// Keys that sync to the user's Firebase account (theme & font size stay per-device)
const SYNC_SETTINGS=["lang","tr","layout","follow","verseEd","speed","repeat","auto","reciterId","moshafId"];
const SYNC_KEYS=new Set([...SYNC_SETTINGS,"favs","bookmarks","surah"]);
let applyingRemote=false,changeTimer=null;
function emitChange(){if(applyingRemote)return;clearTimeout(changeTimer);changeTimer=setTimeout(()=>window.dispatchEvent(new CustomEvent("tilawa:change")),700)}
const store={get(k,d){try{const v=localStorage.getItem("tilawa."+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem("tilawa."+k,JSON.stringify(v))}catch(e){}if(SYNC_KEYS.has(k))emitChange()}};
const S={
  lang:store.get("lang",(navigator.language||"").startsWith("ar")?"ar":"en"),
  theme:store.get("theme",matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"),
  qs:store.get("qs",0),tr:store.get("tr","en.sahih"),layout:store.get("layout","cards"),follow:store.get("follow",true),
  surah:store.get("surah",1),reciterId:store.get("reciterId",null),moshafId:store.get("moshafId",null),
  favs:new Set(store.get("favs",[])),verseEd:store.get("verseEd","ar.alafasy"),
  speed:store.get("speed",1),repeat:store.get("repeat",false),auto:store.get("auto",true),
  bookmarks:store.get("bookmarks",[]),leftTab:"surahs",navigated:false,
  auth:{configured:false,user:null,sync:"ok"},
  recTab:"all",recQuery:"",surahQuery:"",expanded:null,
  reciters:[],recState:"loading",text:null,textState:"loading",
  mode:"surah",ayahIdx:-1,playingSurah:null
};
const textCache=new Map(),verseCache=new Map(),recCache={};
const $=id=>document.getElementById(id);
const t=k=>(I18N[S.lang]||I18N.en)[k]||k;
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const arNum=n=>String(n).replace(/\d/g,d=>"٠١٢٣٤٥٦٧٨٩"[d]);
const locNum=n=>S.lang==="ar"?arNum(n):String(n);
const fmt=s=>{if(!isFinite(s))return"0:00";s=Math.floor(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=String(s%60).padStart(2,"0");return h?`${h}:${String(m).padStart(2,"0")}:${x}`:`${m}:${x}`};
const surahName=n=>S.lang==="ar"?"سورة "+AR_NAMES[n-1]:EN_NAMES[n-1];
const normAr=s=>String(s).replace(/[ً-ٰٟۖ-ۭـ]/g,"").replace(/[إأآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").toLowerCase();
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove("show"),2600)}

async function getJSON(url,ms=20000){
  const c=new AbortController();const tm=setTimeout(()=>c.abort(),ms);
  try{const r=await fetch(url,{signal:c.signal});if(!r.ok)throw new Error("HTTP "+r.status);return await r.json()}
  finally{clearTimeout(tm)}
}

/* ---------- data loading ---------- */
function stripBasmala(n,txt){
  txt=String(txt).replace(/^﻿/,"").trim();
  if(n===1||n===9)return txt;
  if(normAr(txt).startsWith("بسم")){const w=txt.split(/\s+/);if(w.length>4)return w.slice(4).join(" ")}
  return txt;
}
async function loadText(n){
  const key=n+"|"+S.tr;
  if(textCache.has(key))return textCache.get(key);
  let res;
  try{
    const j=await getJSON(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,${S.tr}`);
    const [a,b]=j.data;
    if(a.englishNameTranslation)MEANINGS[n]=a.englishNameTranslation;
    res={ar:a.ayahs.map(x=>stripBasmala(n,x.text)),tr:b.ayahs.map(x=>x.text),trDir:b.edition&&b.edition.direction==="rtl"?"rtl":"ltr"};
  }catch(e){
    // fallback: quran.com (Arabic + Saheeh International)
    const v=await getJSON(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${n}`);
    let tr=[];
    try{const tj=await getJSON(`https://api.quran.com/api/v4/quran/translations/20?chapter_number=${n}`);
      tr=tj.translations.map(x=>String(x.text).replace(/<sup[^>]*>.*?<\/sup>/g,"").replace(/<[^>]+>/g,""))}catch(_){}
    res={ar:v.verses.map(x=>stripBasmala(n,x.text_uthmani)),tr,trDir:"ltr"};
  }
  textCache.set(key,res);return res;
}
async function loadReciters(){
  const lang=S.lang==="ar"?"ar":"eng";
  if(recCache[lang]){S.reciters=recCache[lang];S.recState="ok";return}
  S.recState="loading";renderReciters();
  try{
    const j=await getJSON(`https://mp3quran.net/api/v3/reciters?language=${lang}`);
    const list=(j.reciters||[]).filter(r=>r.moshaf&&r.moshaf.length).map(r=>({
      id:r.id,name:String(r.name||"").trim(),
      moshaf:r.moshaf.map(m=>({id:m.id,name:String(m.name||"").trim(),server:String(m.server||"").replace(/\/?$/,"/"),total:m.surah_total,set:new Set(String(m.surah_list||"").split(",").map(Number).filter(Boolean))}))
    }));
    list.sort((a,b)=>a.name.localeCompare(b.name,S.lang==="ar"?"ar":"en"));
    recCache[lang]=list;S.reciters=list;S.recState="ok";
    if(S.reciterId==null||!list.find(r=>r.id===S.reciterId)){
      const def=list.find(r=>/afasy|العفاسي/i.test(r.name))||list[0];
      if(def){S.reciterId=def.id;S.moshafId=def.moshaf[0].id}
    }
    const r=curReciter();if(r&&!r.moshaf.find(m=>m.id===S.moshafId))S.moshafId=r.moshaf[0].id;
    if(S.expanded==null)S.expanded=S.reciterId;
  }catch(e){S.recState="err"}
}
async function loadVerseAudio(n){
  const key=n+"|"+S.verseEd;
  if(verseCache.has(key))return verseCache.get(key);
  let urls;
  try{const j=await getJSON(`https://api.alquran.cloud/v1/surah/${n}/${S.verseEd}`);urls=j.data.ayahs.map(a=>a.audio||(a.audioSecondary&&a.audioSecondary[0]))}
  catch(e){urls=Array.from({length:COUNTS[n-1]},(_,i)=>`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${START[n-1]+i+1}.mp3`)}
  verseCache.set(key,urls);return urls;
}
const curReciter=()=>S.reciters.find(r=>r.id===S.reciterId);
const curMoshaf=()=>{const r=curReciter();return r&&r.moshaf.find(m=>m.id===S.moshafId)};
const hasSurah=n=>{const m=curMoshaf();return !!m&&m.set.has(n)};

/* ---------- render: chrome ---------- */
function applyChrome(){
  document.documentElement.dataset.theme=S.theme;
  document.documentElement.lang=S.lang;
  document.documentElement.dir=S.lang==="ar"?"rtl":"ltr";
  document.documentElement.style.setProperty("--qs",S.qs?S.qs+"px":"");
  if(!S.qs)document.documentElement.style.removeProperty("--qs");
  $("themeBtn").innerHTML=S.theme==="dark"?ICON.sun:ICON.moon;
  $("langBtn").textContent=S.lang==="ar"?"English":"العربية";
  document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=t(el.dataset.i18n));
  $("surahSearch").placeholder=t("searchSurah");$("recSearch").placeholder=t("searchRec");
  $("trSel").innerHTML=TRANSLATIONS.map(([v,l])=>`<option value="${v}"${v===S.tr?" selected":""}>${esc(l)}</option>`).join("");
  $("verseSel").innerHTML=VERSE_RECITERS.map(([v,e,a])=>`<option value="${v}"${v===S.verseEd?" selected":""}>${esc(S.lang==="ar"?a:e)}</option>`).join("");
  $("layCards").classList.toggle("on",S.layout==="cards");$("layFlow").classList.toggle("on",S.layout==="flow");
  $("followOn").classList.toggle("on",S.follow);$("followOff").classList.toggle("on",!S.follow);
  $("speedBtn").textContent=S.speed+"×";
  $("repeatBtn").classList.toggle("on",S.repeat);$("repeatBtn").title=S.repeat?t("repeatOn"):t("repeatOff");
  $("autoBtn").classList.toggle("on",S.auto);$("autoBtn").title=S.auto?t("autoOn"):t("autoOff");
  $("tabAll").classList.toggle("on",S.recTab==="all");$("tabFav").classList.toggle("on",S.recTab==="fav");
  renderAccount();
}

/* ---------- render: surah list ---------- */
function renderSurahs(){
  const q=S.surahQuery.trim(),nq=normAr(q).replace(/[-'\s]/g,"");
  let html="",c=0;
  for(let n=1;n<=114;n++){
    if(q){const hay=(n+" "+EN_NAMES[n-1]+" "+normAr(AR_NAMES[n-1])+" "+(MEANINGS[n]||"")).toLowerCase().replace(/[-'\s]/g,"");
      if(!(String(n)===q||hay.includes(nq)))continue}
    c++;
    const type=MEDINAN.has(n)?t("medinan"):t("meccan");
    html+=`<button class="s-item${n===S.surah?" on":""}" data-s="${n}"><span class="num">${locNum(n)}</span><span class="s-main"><b>${esc(S.lang==="ar"?AR_NAMES[n-1]:EN_NAMES[n-1])}</b><span class="muted">${type} · ${locNum(COUNTS[n-1])} ${t("ayahs")}</span></span>${S.lang==="ar"?"":`<span class="s-ar">${AR_NAMES[n-1]}</span>`}</button>`;
  }
  $("surahList").innerHTML=html||`<div class="state">${t("noRes")}</div>`;
  if($("surahCount"))$("surahCount").textContent=locNum(c);
}

/* ---------- render: reciters ---------- */
function renderReciters(){
  const el=$("recList");
  if(S.recState==="loading"){el.innerHTML=`<div class="state"><div class="spinner"></div>${t("loading")}</div>`;$("recCount").textContent="";return}
  if(S.recState==="err"){el.innerHTML=`<div class="state">${t("loadErr")}<br><br><button class="btn ghost" id="recRetry">${t("retry")}</button></div>`;$("recCount").textContent="";return}
  const q=normAr(S.recQuery.trim());
  let list=S.reciters;
  if(S.recTab==="fav")list=list.filter(r=>S.favs.has(r.id));
  if(q)list=list.filter(r=>normAr(r.name).includes(q)||r.moshaf.some(m=>normAr(m.name).includes(q)));
  $("recCount").textContent=locNum(S.reciters.length)+" "+t("recs");
  if(!list.length){el.innerHTML=`<div class="state">${S.recTab==="fav"&&!q?t("noFav"):t("noRes")}</div>`;return}
  el.innerHTML=list.map(r=>{
    const on=r.id===S.reciterId,open=S.expanded===r.id;
    const initial=esc((r.name.replace(/^(al-|ال)/i,"")[0]||"?").toUpperCase());
    const sub=r.moshaf.length>1?`${locNum(r.moshaf.length)} ${t("riwayat")}`:esc(r.moshaf[0].name);
    let ms="";
    if(open&&r.moshaf.length>1)ms=`<div class="moshafs">${r.moshaf.map(m=>`<button class="m-btn${on&&m.id===S.moshafId?" on":""}" data-r="${r.id}" data-m="${m.id}"><span>${esc(m.name)}</span><span>${locNum(m.total||m.set.size)}</span></button>`).join("")}</div>`;
    return `<div class="r-item${on?" on":""}"><div class="r-row"><span class="avatar">${initial}</span><button class="r-name" data-r="${r.id}"><b>${esc(r.name)}</b><span class="muted">${sub}</span></button><button class="star${S.favs.has(r.id)?" on":""}" data-fav="${r.id}" aria-label="Favorite">${S.favs.has(r.id)?ICON.star:ICON.starO}</button></div>${ms}</div>`;
  }).join("");
}

/* ---------- bookmarks ---------- */
const bmKey=(n,i)=>n+":"+(i+1);
const isBm=(n,i)=>S.bookmarks.includes(bmKey(n,i));
const bmBtn=(n,i)=>`<button class="bm${isBm(n,i)?" on":""}" data-bm="${i}" aria-label="${t("bookmarks")}">${isBm(n,i)?ICON.bm:ICON.bmO}</button>`;
function toggleBm(n,i){
  const k=bmKey(n,i),had=S.bookmarks.includes(k);
  S.bookmarks=had?S.bookmarks.filter(x=>x!==k):[k,...S.bookmarks];
  store.set("bookmarks",S.bookmarks);toast(had?t("bmRemoved"):t("bmAdded"));
  const b=document.querySelector(`#a${i} .bm`);if(b&&S.surah===n)b.outerHTML=bmBtn(n,i);
  renderBookmarks();
}
function renderBookmarks(){
  $("bmCount").textContent=S.bookmarks.length?locNum(S.bookmarks.length):"";
  const el=$("bmList");
  if(!S.bookmarks.length){el.innerHTML=`<div class="state">${t("noBm")}</div>`;return}
  el.innerHTML=S.bookmarks.map(k=>{const [n,a]=k.split(":").map(Number);if(!(n>=1&&n<=114))return"";
    return `<div class="b-item"><span class="num">${locNum(n)}</span><button class="s-main" data-go="${k}"><b>${esc(surahName(n))}</b><span class="muted">${t("verse")} ${locNum(a)} · ${locNum(n)}:${locNum(a)}</span></button><button class="x" data-unbm="${k}" aria-label="Remove">${ICON.x}</button></div>`}).join("");
}
function setLeftTab(tab){
  S.leftTab=tab;$("tabSurahs").classList.toggle("on",tab==="surahs");$("tabBm").classList.toggle("on",tab==="bm");
  $("surahList").hidden=tab!=="surahs";$("surahSearchWrap").hidden=tab!=="surahs";$("bmList").hidden=tab!=="bm";
  if(tab==="bm")renderBookmarks();
}

/* ---------- render: reader ---------- */
function renderReader(){
  const n=S.surah,el=$("reader");
  const type=MEDINAN.has(n)?t("medinan"):t("meccan");
  const rec=curReciter(),avail=hasSurah(n);
  const meaning=MEANINGS[n]&&S.lang!=="ar"?` · ${esc(MEANINGS[n])}`:"";
  let head=`<section class="banner">${ICON.pattern}<h1>سورة ${AR_NAMES[n-1]}</h1><h2>${esc(S.lang==="ar"?"":EN_NAMES[n-1])}</h2>
    <div class="meta">${locNum(n)} · ${type} · ${locNum(COUNTS[n-1])} ${t("ayahs")}${meaning}</div>
    <div class="actions"><button class="btn primary" id="playSurahBtn"${rec&&!avail?" disabled":""}>${ICON.play}${t("playSurah")}</button>
    <button class="btn ghost" id="playVersesBtn">${ICON.list}${t("playVerses")}</button></div>
    ${rec&&!avail&&S.recState==="ok"?`<div class="notice">${t("notAvail")}</div>`:""}</section>`;
  if(S.textState==="loading"){el.innerHTML=head+`<div class="state"><div class="spinner"></div>${t("loading")}</div>`;bindReader();return}
  if(S.textState==="err"){el.innerHTML=head+`<div class="state">${t("loadErr")}<br><br><button class="btn ghost" id="txtRetry">${t("retry")}</button></div>`;bindReader();return}
  const d=S.text;
  let body=(n!==1&&n!==9)?`<div class="bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>`:"";
  body+=`<div class="toolbar"><span>${t("tapHint")}</span><div class="grp"><select class="sel" id="trSel2" aria-label="${t("translation")}">${TRANSLATIONS.map(([v,l])=>`<option value="${v}"${v===S.tr?" selected":""}>${esc(l)}</option>`).join("")}</select></div></div>`;
  const playing=i=>S.mode==="ayah"&&S.playingSurah===n&&S.ayahIdx===i;
  if(S.layout==="flow"){
    body+=`<div class="flow">${d.ar.map((a,i)=>`<span class="v${playing(i)?" playing":""}" data-a="${i}" id="a${i}">${esc(a)} <span class="marker">${arNum(i+1)}</span></span> `).join("")}</div>`;
  }else{
    body+=d.ar.map((a,i)=>`<div class="ayah${playing(i)?" playing":""}" data-a="${i}" id="a${i}" role="button" tabindex="0"><div class="ayah-top"><span class="key">${locNum(n)}:${locNum(i+1)}</span><span class="right"><span class="playico">${ICON.play}</span>${bmBtn(n,i)}</span></div><div class="q">${esc(a)} <span class="marker">${arNum(i+1)}</span></div>${d.tr[i]?`<div class="tr${d.trDir==="rtl"?" rtl":""}" dir="${d.trDir}">${esc(d.tr[i])}</div>`:""}</div>`).join("");
  }
  const prevB=n>1?`<button class="btn ghost" data-s="${n-1}">${S.lang==="ar"?ICON.chevR:ICON.chevL}${esc(surahName(n-1))}</button>`:"<span></span>";
  const nextB=n<114?`<button class="btn ghost" data-s="${n+1}">${esc(surahName(n+1))}${S.lang==="ar"?ICON.chevL:ICON.chevR}</button>`:"<span></span>";
  body+=`<div class="navfoot">${prevB}${nextB}</div>`;
  el.innerHTML=head+body;bindReader();
}
function bindReader(){
  const ps=$("playSurahBtn");if(ps)ps.onclick=()=>playSurah(S.surah);
  const pv=$("playVersesBtn");if(pv)pv.onclick=()=>playAyah(S.surah,0);
  const rr=$("txtRetry");if(rr)rr.onclick=()=>openSurah(S.surah,{keepScroll:true});
  const ts=$("trSel2");if(ts)ts.onchange=e=>setTranslation(e.target.value);
}
function markPlaying(){
  document.querySelectorAll("#reader [data-a].playing").forEach(x=>x.classList.remove("playing"));
  if(S.mode==="ayah"&&S.playingSurah===S.surah&&S.ayahIdx>=0){
    const el=$("a"+S.ayahIdx);if(el){el.classList.add("playing");if(S.follow)el.scrollIntoView({block:"center",behavior:"smooth"})}
  }
}

/* ---------- navigation ---------- */
async function openSurah(n,opt={}){
  n=Math.max(1,Math.min(114,n));
  if(!opt.initial)S.navigated=true;
  S.surah=n;store.set("surah",n);
  S.textState="loading";S.text=null;
  renderSurahs();renderReader();closeDrawers();
  if(!opt.keepScroll)$("main").scrollTop=0;
  const active=document.querySelector(".s-item.on");if(active)active.scrollIntoView({block:"nearest"});
  try{const d=await loadText(n);if(S.surah!==n)return;S.text=d;S.textState="ok"}
  catch(e){if(S.surah!==n)return;S.textState="err"}
  renderReader();renderSurahs();
  if(opt.scrollTo!=null){
    if(S.layout==="flow"){S.layout="cards";renderReader()}
    const el=$("a"+opt.scrollTo);if(el){el.scrollIntoView({block:"center"});el.classList.add("flash")}
  }else if(S.mode==="ayah"&&S.playingSurah===n)markPlaying();
}
async function setTranslation(v){S.tr=v;store.set("tr",v);applyChrome();await openSurah(S.surah,{keepScroll:true});}

/* ---------- audio ---------- */
const audio=new Audio();audio.preload="auto";
function setPlayIcon(){const p=!audio.paused&&!audio.ended;$("playBtn").innerHTML=p?ICON.pause:ICON.play;$("playBtn").setAttribute("aria-label",p?"Pause":"Play")}
async function start(url){
  audio.src=url;audio.playbackRate=S.speed;
  try{await audio.play()}catch(e){if(e&&e.name!=="AbortError")toast(t("audioErr"))}
  setPlayIcon();updateNP();
}
function playSurah(n){
  const r=curReciter(),m=curMoshaf();
  if(!r||!m){toast(t("pickReciter"));openRight();return}
  if(!m.set.has(n)){toast(t("notAvail"));return}
  S.mode="surah";S.playingSurah=n;S.ayahIdx=-1;markPlaying();
  start(m.server+String(n).padStart(3,"0")+".mp3");
}
async function playAyah(n,i){
  S.mode="ayah";S.playingSurah=n;S.ayahIdx=i;
  if(S.surah!==n)await openSurah(n);
  markPlaying();updateNP();
  const urls=await loadVerseAudio(n);
  if(S.mode!=="ayah"||S.playingSurah!==n||S.ayahIdx!==i)return;
  if(!urls[i]){toast(t("audioErr"));return}
  start(urls[i]);
}
function nextAvail(n,dir){const m=curMoshaf();for(let k=n+dir;k>=1&&k<=114;k+=dir){if(!m||m.set.has(k))return k}return null}
function next(){
  if(S.mode==="ayah"&&S.playingSurah){const n=S.playingSurah;if(S.ayahIdx+1<COUNTS[n-1])return playAyah(n,S.ayahIdx+1);if(n<114)return playAyah(n+1,0);return}
  const k=nextAvail(S.playingSurah||S.surah,1);if(k){openSurah(k);playSurah(k)}
}
function prev(){
  if(audio.currentTime>3&&S.mode==="surah"){audio.currentTime=0;return}
  if(S.mode==="ayah"&&S.playingSurah){const n=S.playingSurah;if(S.ayahIdx>0)return playAyah(n,S.ayahIdx-1);if(n>1)return playAyah(n-1,COUNTS[n-2]-1);return}
  const k=nextAvail(S.playingSurah||S.surah,-1);if(k){openSurah(k);playSurah(k)}
}
function togglePlay(){
  if(!audio.src){S.mode==="ayah"?playAyah(S.surah,0):playSurah(S.surah);return}
  if(audio.paused)audio.play().catch(()=>toast(t("audioErr")));else audio.pause();
}
audio.addEventListener("play",setPlayIcon);audio.addEventListener("pause",setPlayIcon);
audio.addEventListener("ended",()=>{
  setPlayIcon();
  if(S.repeat){audio.currentTime=0;audio.play().catch(()=>{});return}
  if(S.mode==="ayah"){
    const n=S.playingSurah;
    if(S.ayahIdx+1<COUNTS[n-1])playAyah(n,S.ayahIdx+1);
    else if(S.auto&&n<114)playAyah(n+1,0);
    return;
  }
  if(S.auto)next();
});
audio.addEventListener("error",()=>{if(audio.src)toast(t("audioErr"));setPlayIcon()});
audio.addEventListener("timeupdate",()=>{
  const d=audio.duration,c=audio.currentTime;
  $("tCur").textContent=fmt(c);$("tDur").textContent=fmt(d);
  if(!seeking&&isFinite(d)&&d>0){const v=c/d*1000;$("seek").value=v;$("seek").style.setProperty("--p",v/10+"%")}
});
audio.addEventListener("loadedmetadata",()=>{$("tDur").textContent=fmt(audio.duration)});
let seeking=false;
$("seek").addEventListener("input",e=>{seeking=true;e.target.style.setProperty("--p",e.target.value/10+"%");if(isFinite(audio.duration))$("tCur").textContent=fmt(e.target.value/1000*audio.duration)});
$("seek").addEventListener("change",e=>{seeking=false;if(isFinite(audio.duration))audio.currentTime=e.target.value/1000*audio.duration});

function updateNP(){
  const n=S.playingSurah||S.surah;
  $("npDisc").textContent=arNum(n);
  const badge=S.mode==="ayah"&&S.playingSurah?`<span class="modebadge">${t("verseMode")} ${locNum(S.ayahIdx+1)}</span>`:"";
  $("npTitle").innerHTML=esc(surahName(n))+badge;
  let sub;
  if(S.mode==="ayah"&&S.playingSurah){const v=VERSE_RECITERS.find(x=>x[0]===S.verseEd);sub=v?(S.lang==="ar"?v[2]:v[1]):""}
  else{const r=curReciter(),m=curMoshaf();sub=r?r.name+(m&&r.moshaf.length>1?" · "+m.name:""):(S.recState==="loading"?t("loading"):t("pickReciter"))}
  $("npSub").textContent=audio.src?sub:(sub||t("ready"));
  if("mediaSession" in navigator){
    try{navigator.mediaSession.metadata=new MediaMetadata({title:surahName(n)+(S.mode==="ayah"&&S.playingSurah?" — "+t("verse")+" "+(S.ayahIdx+1):""),artist:sub,album:"Tilawa"})}catch(e){}
  }
}
if("mediaSession" in navigator){
  try{
    navigator.mediaSession.setActionHandler("play",()=>audio.play());
    navigator.mediaSession.setActionHandler("pause",()=>audio.pause());
    navigator.mediaSession.setActionHandler("previoustrack",prev);
    navigator.mediaSession.setActionHandler("nexttrack",next);
  }catch(e){}
}

/* ---------- drawers & popover ---------- */
function openLeft(){$("left").classList.add("open");$("scrim").classList.add("open")}
function openRight(){if(matchMedia("(max-width:900px)").matches){$("right").classList.add("open");$("scrim").classList.add("open")}else $("recSearch").focus()}
function closeDrawers(){$("left").classList.remove("open");$("right").classList.remove("open");$("scrim").classList.remove("open")}
$("openLeft").onclick=openLeft;$("openRight").onclick=openRight;$("scrim").onclick=closeDrawers;
$("settingsBtn").onclick=e=>{e.stopPropagation();$("settings").classList.toggle("open")};
document.addEventListener("click",e=>{if(!$("settings").contains(e.target)&&e.target!==$("settingsBtn"))$("settings").classList.remove("open")});

/* ---------- events ---------- */
$("surahList").addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(b)openSurah(+b.dataset.s)});
$("reader").addEventListener("click",e=>{
  const s=e.target.closest("[data-s]");if(s){openSurah(+s.dataset.s);return}
  const bm=e.target.closest("[data-bm]");if(bm){e.stopPropagation();toggleBm(S.surah,+bm.dataset.bm);return}
  const a=e.target.closest("[data-a]");if(a&&S.textState==="ok")playAyah(S.surah,+a.dataset.a);
});
$("reader").addEventListener("keydown",e=>{if(e.target.closest&&e.target.closest("[data-bm]"))return;const a=e.target.closest&&e.target.closest("[data-a]");if(a&&(e.key==="Enter"||e.key===" ")){e.preventDefault();playAyah(S.surah,+a.dataset.a)}});
$("recList").addEventListener("click",e=>{
  if(e.target.closest("#recRetry")){init.reciters();return}
  const f=e.target.closest("[data-fav]");
  if(f){const id=+f.dataset.fav;S.favs.has(id)?S.favs.delete(id):S.favs.add(id);store.set("favs",[...S.favs]);renderReciters();return}
  const m=e.target.closest("[data-m]");
  if(m){selectReciter(+m.dataset.r,+m.dataset.m);return}
  const r=e.target.closest("[data-r]");
  if(r){const id=+r.dataset.r,rec=S.reciters.find(x=>x.id===id);if(!rec)return;
    if(rec.moshaf.length>1){S.expanded=S.expanded===id?-1:id;renderReciters();return}
    selectReciter(id,rec.moshaf[0].id)}
});
function selectReciter(rid,mid){
  S.reciterId=rid;S.moshafId=mid;S.expanded=rid;store.set("reciterId",rid);store.set("moshafId",mid);
  renderReciters();renderReader();
  if(hasSurah(S.surah)){closeDrawers();playSurah(S.surah)}else{toast(t("notAvail"));updateNP()}
}
$("surahSearch").addEventListener("input",e=>{S.surahQuery=e.target.value;renderSurahs()});
$("recSearch").addEventListener("input",e=>{S.recQuery=e.target.value;renderReciters()});
$("tabAll").onclick=()=>{S.recTab="all";applyChrome();renderReciters()};
$("tabFav").onclick=()=>{S.recTab="fav";applyChrome();renderReciters()};
$("themeBtn").onclick=()=>{S.theme=S.theme==="dark"?"light":"dark";store.set("theme",S.theme);applyChrome()};
$("langBtn").onclick=async()=>{S.lang=S.lang==="ar"?"en":"ar";store.set("lang",S.lang);applyChrome();renderSurahs();renderBookmarks();renderReader();updateNP();await loadReciters();renderReciters();renderReader();updateNP()};
$("trSel").onchange=e=>setTranslation(e.target.value);
$("verseSel").onchange=e=>{S.verseEd=e.target.value;store.set("verseEd",S.verseEd);if(S.mode==="ayah"&&S.playingSurah)playAyah(S.playingSurah,Math.max(0,S.ayahIdx))};
$("layCards").onclick=()=>{S.layout="cards";store.set("layout",S.layout);applyChrome();renderReader();markPlaying()};
$("layFlow").onclick=()=>{S.layout="flow";store.set("layout",S.layout);applyChrome();renderReader();markPlaying()};
const baseQs=()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--qs"))||32;
$("fsUp").onclick=()=>{S.qs=Math.min(64,Math.round(baseQs()+3));store.set("qs",S.qs);applyChrome()};
$("fsDown").onclick=()=>{S.qs=Math.max(18,Math.round(baseQs()-3));store.set("qs",S.qs);applyChrome()};
$("fsReset").onclick=()=>{S.qs=0;store.set("qs",0);applyChrome()};
$("followOn").onclick=()=>{S.follow=true;store.set("follow",true);applyChrome()};
$("followOff").onclick=()=>{S.follow=false;store.set("follow",false);applyChrome()};
$("playBtn").onclick=togglePlay;$("nextBtn").onclick=next;$("prevBtn").onclick=prev;
const SPEEDS=[0.75,1,1.25,1.5,2];
$("speedBtn").onclick=()=>{S.speed=SPEEDS[(SPEEDS.indexOf(S.speed)+1)%SPEEDS.length];audio.playbackRate=S.speed;store.set("speed",S.speed);applyChrome()};
$("repeatBtn").onclick=()=>{S.repeat=!S.repeat;store.set("repeat",S.repeat);applyChrome();toast(S.repeat?t("repeatOn"):t("repeatOff"))};
$("autoBtn").onclick=()=>{S.auto=!S.auto;store.set("auto",S.auto);applyChrome();toast(S.auto?t("autoOn"):t("autoOff"))};
document.addEventListener("keydown",e=>{
  if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(e.code==="Space"&&!e.target.closest("[data-a]")){e.preventDefault();togglePlay()}
  else if(e.key==="ArrowRight"&&e.altKey)next();else if(e.key==="ArrowLeft"&&e.altKey)prev();
});
window.addEventListener("hashchange",()=>{const m=/^#surah-(\d+)$/.exec(location.hash);if(m&&+m[1]!==S.surah)openSurah(+m[1])});

/* ---------- bookmarks & left tabs ---------- */
$("tabSurahs").onclick=()=>setLeftTab("surahs");
$("tabBm").onclick=()=>setLeftTab("bm");
$("bmList").addEventListener("click",e=>{
  const x=e.target.closest("[data-unbm]");
  if(x){S.bookmarks=S.bookmarks.filter(k=>k!==x.dataset.unbm);store.set("bookmarks",S.bookmarks);renderBookmarks();if(S.textState==="ok")renderReader();return}
  const g=e.target.closest("[data-go]");
  if(g){const [n,a]=g.dataset.go.split(":").map(Number);openSurah(n,{scrollTo:a-1})}
});

/* ---------- account (Firebase Auth UI; logic lives in sync.js) ---------- */
function renderAccount(){
  const A=S.auth,btn=$("acctBtn");
  btn.hidden=!A.configured;
  if(!A.configured)return;
  if(A.user){
    btn.classList.add("signed");
    const photo=A.user.photoURL?`<img src="${esc(A.user.photoURL)}" alt="" referrerpolicy="no-referrer">`:`<span class="avatar" style="width:24px;height:24px;font-size:12px">${esc((A.user.displayName||A.user.email||"?")[0].toUpperCase())}</span>`;
    btn.innerHTML=photo+`<span class="hide-m">${esc((A.user.displayName||"").split(" ")[0]||A.user.email||"")}</span>`;
    $("acctImg").src=A.user.photoURL||"";$("acctImg").hidden=!A.user.photoURL;
    $("acctName").textContent=A.user.displayName||"";$("acctEmail").textContent=A.user.email||"";
    $("syncDot").className="dot"+(A.sync==="busy"?" busy":A.sync==="err"?" err":"");
    $("syncText").textContent=A.sync==="busy"?t("syncing"):A.sync==="err"?t("syncErr"):t("synced");
  }else{
    btn.classList.remove("signed");btn.innerHTML=ICON.google+`<span>${t("signIn")}</span>`;
    $("acctPop").classList.remove("open");
  }
}
$("acctBtn").onclick=e=>{
  e.stopPropagation();
  if(!S.auth.user){window.dispatchEvent(new CustomEvent("tilawa:signin"));return}
  $("settings").classList.remove("open");$("acctPop").classList.toggle("open");
};
$("signOutBtn").onclick=()=>{$("acctPop").classList.remove("open");window.dispatchEvent(new CustomEvent("tilawa:signout"))};
document.addEventListener("click",e=>{if(!$("acctPop").contains(e.target)&&!$("acctBtn").contains(e.target))$("acctPop").classList.remove("open")});

/* Public bridge used by sync.js (Firebase). The app works fully without it. */
window.Tilawa={
  snapshot(){
    const settings={};SYNC_SETTINGS.forEach(k=>{if(S[k]!==undefined&&S[k]!==null)settings[k]=S[k]});
    return {favs:[...S.favs],bookmarks:S.bookmarks.slice(),settings,last:{surah:S.surah}};
  },
  apply(d,{first=false}={}){
    if(!d)return;
    applyingRemote=true;
    try{
      const oldLang=S.lang,oldTr=S.tr;
      if(Array.isArray(d.favs)){S.favs=new Set(d.favs.map(Number));store.set("favs",[...S.favs])}
      if(Array.isArray(d.bookmarks)){S.bookmarks=d.bookmarks.filter(k=>/^\d+:\d+$/.test(k));store.set("bookmarks",S.bookmarks)}
      if(d.settings)SYNC_SETTINGS.forEach(k=>{if(k in d.settings&&d.settings[k]!=null){S[k]=d.settings[k];store.set(k,S[k])}});
      audio.playbackRate=S.speed;
      applyChrome();renderSurahs();renderBookmarks();
      if(S.lang!==oldLang)loadReciters().then(()=>{renderReciters();renderReader();updateNP()});
      else renderReciters();
      const goTo=first&&!S.navigated&&d.last&&d.last.surah&&d.last.surah!==S.surah?d.last.surah:null;
      if(goTo)openSurah(goTo,{initial:true});
      else if(S.tr!==oldTr)openSurah(S.surah,{keepScroll:true,initial:true});
      else{const top=$("main").scrollTop;renderReader();$("main").scrollTop=top}
      updateNP();
    }finally{applyingRemote=false}
  },
  setAuth(patch){Object.assign(S.auth,patch);renderAccount()},
  toast:k=>toast(t(k))
};
window.dispatchEvent(new CustomEvent("tilawa:ready"));

/* ---------- init ---------- */
const init={
  async reciters(){await loadReciters();renderReciters();renderReader();updateNP()},
  async meta(){try{const j=await getJSON("https://api.alquran.cloud/v1/surah");j.data.forEach(s=>MEANINGS[s.number]=s.englishNameTranslation);renderSurahs();if(S.textState!=="loading")renderReader()}catch(e){}}
};
const hm=/^#surah-(\d+)$/.exec(location.hash);if(hm)S.surah=Math.max(1,Math.min(114,+hm[1]));
applyChrome();setPlayIcon();renderSurahs();updateNP();
renderBookmarks();
openSurah(S.surah,{initial:true});init.reciters();init.meta();
})();

/* Cinematic Motion Studio — DOM presentation only. */
(()=>{
`use strict`;
const app=document.getElementById(`app`);
const main=app?.querySelector(`.main`);
const nav=document.getElementById(`nav`);
const topbar=main?.querySelector(`.topbar`);
if(!app||!main||!nav||!topbar)return;
const reduced=()=>matchMedia(`(prefers-reduced-motion: reduce)`).matches||document.body.classList.contains(`no-motion`);
const motion=()=>!reduced();
const fine=()=>matchMedia(`(hover:hover) and (pointer:fine)`).matches;
const page=()=>[...main.querySelectorAll(`.page.active`)].find(e=>!e.classList.contains(`hidden`));
const routes=[...nav.querySelectorAll(`a[data-page]`)].map(a=>({key:a.dataset.page,label:a.querySelector(`span:last-child`)?.textContent.trim()||a.title||a.dataset.page}));
const bg=document.createElement(`div`);
bg.className=`cmBackdrop`;
bg.setAttribute(`aria-hidden`,`true`);
bg.innerHTML=`<span class="cmGrid"></span><span class="cmAura cmAuraA"></span><span class="cmAura cmAuraB"></span><span class="cmStars"></span>`;
main.prepend(bg);
const progress=document.createElement(`div`);
progress.className=`cmScrollProgress`;
progress.setAttribute(`aria-hidden`,`true`);
document.body.append(progress);
let scrollFrame=0;
function paintProgress(){
 if(scrollFrame)return;
 scrollFrame=requestAnimationFrame(()=>{
  scrollFrame=0;
  progress.style.transform=`scaleX(${Math.max(0,Math.min(1,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)))})`;
 });
}
window.addEventListener(`scroll`,paintProgress,{passive:true});
window.addEventListener(`resize`,paintProgress,{passive:true});
const intro=document.createElement(`section`);
intro.className=`cmIntro`;
intro.setAttribute(`aria-label`,`مقدمة الصفحة الحالية`);
intro.innerHTML=`<div class="cmIntroCopy"><div class="cmOverline"><span class="cmLiveDot" aria-hidden="true"></span><span id="cmSection">راتبي / الرئيسية</span><i aria-hidden="true"></i><small>FINANCIAL OS</small></div><h2 id="cmIntroTitle">مساحتك المالية</h2><p id="cmIntroSubtitle">كل قرار مالي يبدأ بصورة اوضح</p></div><div class="cmOrbitStage" aria-hidden="true"><div class="cmOrbit cmOrbitOne"></div><div class="cmOrbit cmOrbitTwo"></div><div class="cmOrbit cmOrbitThree"></div><div class="cmOrbitCenter"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="32" cy="32" r="15"/><path d="M32 7v50M7 32h50"/></svg></div></div>`;
topbar.after(intro);
const head=intro.querySelector(`#cmIntroTitle`);
const desc=intro.querySelector(`#cmIntroSubtitle`);
const trail=intro.querySelector(`#cmSection`);
let current=``;
let built=false;
function buildBento(){
 if(built)return;
 const home=document.getElementById(`dailyHome`);
 const dashboard=document.getElementById(`dashboardPage`);
 const hero=home?.querySelector(`.scrollDock:has(.dailyHero)`)||home?.querySelector(`.dailyHero`);
 const planning=home?.querySelector(`.planning-launch`);
 const metrics=dashboard?.querySelector(`.heroGrid`);
 const quick=metrics?.querySelector(`.quickColumn`);
 if(!home||!hero||!planning||!metrics||!quick)return;
 const stage=document.createElement(`section`);
 stage.id=`cmStage`;
 stage.className=`cmStage`;
 stage.setAttribute(`aria-label`,`لوحة اليوم المالي`);
 const feature=document.createElement(`div`);
 feature.className=`cmFeature`;
 const aside=document.createElement(`div`);
 aside.className=`cmAside`;
 hero.before(stage);
 stage.append(feature,aside);
 feature.append(hero);
 aside.append(planning,quick);
 const details=document.createElement(`section`);
 details.className=`cmMonthDetail`;
 details.setAttribute(`aria-label`,`ملخص الشهر`);
 stage.after(details);
 details.append(metrics);
 built=true;
 observeReveal();
}
buildBento();
window.addEventListener(`load`,buildBento);
const glider=document.createElement(`div`);
glider.className=`cmNavigationGlider`;
glider.setAttribute(`aria-hidden`,`true`);
nav.prepend(glider);
function syncGlider(){
 if(innerWidth<=760){glider.style.opacity=`0`;return}
 const active=nav.querySelector(`a[data-page].active`)||nav.querySelector(`a[aria-current="page"]`);
 if(!active||!active.getClientRects().length){glider.style.opacity=`0`;return}
 const r=active.getBoundingClientRect();
 const parent=nav.getBoundingClientRect();
 glider.style.height=`${r.height}px`;
 glider.style.width=`${r.width}px`;
 glider.style.transform=`translate3d(${r.left-parent.left+nav.scrollLeft}px,${r.top-parent.top+nav.scrollTop}px,0)`;
 glider.style.opacity=`1`;
}
const navResize=new ResizeObserver(syncGlider);
navResize.observe(nav);
nav.addEventListener(`scroll`,syncGlider,{passive:true});
window.addEventListener(`resize`,syncGlider,{passive:true});
window.addEventListener(`load`,syncGlider);
requestAnimationFrame(syncGlider);
function updateIntro(){
 const active=page();
 if(!active)return;
 const key=active.id.replace(/Page$/,``);
 const name=routes.find(r=>r.key===key)?.label||active.querySelector(`.sectionHead h1,.sectionHead h2`)?.textContent.trim()||`الرئيسية`;
 trail.textContent=`راتبي / ${name}`;
 head.textContent=key===`dashboard`?(document.getElementById(`welcomeTitle`)?.textContent.trim()||`يومك المالي`):name;
 desc.textContent=key===`dashboard`?(document.getElementById(`welcomeSubtitle`)?.textContent.trim()||`مساحتك المالية`):(active.querySelector(`.sectionHead p`)?.textContent.trim()||`بياناتك المالية في مكان واحد`);
 document.body.dataset.cmRoute=key;
 if(current===key)return;
 current=key;
 if(motion()){
  head.animate([{opacity:0,clipPath:`inset(0 0 90% 0)`,transform:`translateY(28px)`,filter:`blur(9px)`},{opacity:1,clipPath:`inset(0 0 0 0)`,transform:`translateY(0)`,filter:`blur(0)`}],{duration:800,easing:`cubic-bezier(.16,1,.3,1)`});
  desc.animate([{opacity:0,transform:`translateY(15px)`},{opacity:1,transform:`translateY(0)`}],{duration:520,delay:125,fill:`both`,easing:`cubic-bezier(.16,1,.3,1)`});
 }
 requestAnimationFrame(syncGlider);
}
let pageAnimations=[];
function enterPage(){
 const active=page();
 if(!active||!motion())return;
 pageAnimations.forEach(animation=>animation.cancel());
 pageAnimations=[];
 const elements=[...active.querySelectorAll(`.sectionHead,.cmStage,.cmMonthDetail,.panel,.quickCard,.accountCard,.categoryCard,.reportTabs,.txList`)]
  .filter(el=>el.getClientRects().length&&!el.closest(`.cmStage .panel,.cmStage .quickCard,.cmMonthDetail .panel`)).slice(0,11);
 elements.forEach((el,i)=>{
  pageAnimations.push(el.animate([
   {opacity:.24,transform:`translateY(${20+i*2}px) scale(.983)`,filter:`blur(6px)`},
   {opacity:1,transform:`translateY(0) scale(1)`,filter:`blur(0)`}
  ],{duration:560+i*24,delay:Math.min(360,i*44),easing:`cubic-bezier(.16,1,.3,1)`}));
 });
}
let wipe;
function sweep(){
 if(!motion())return;
 wipe?.remove();
 wipe=document.createElement(`div`);
 wipe.className=`cmWipe`;
 wipe.setAttribute(`aria-hidden`,`true`);
 main.append(wipe);
 const layer=wipe;
 layer.animate([
  {opacity:0,clipPath:`inset(0 100% 0 0)`},
  {opacity:.75,clipPath:`inset(0 0 0 0)`,offset:.36},
  {opacity:0,clipPath:`inset(0 0 0 100%)`}
 ],{duration:590,easing:`cubic-bezier(.3,.7,.18,1)`}).finished.catch(()=>{}).then(()=>layer.remove());
}
updateIntro();
window.addEventListener(`salary:page`,()=>{
 updateIntro();sweep();
 requestAnimationFrame(()=>{enterPage();observeReveal();paintProgress()});
});
window.addEventListener(`popstate`,()=>requestAnimationFrame(updateIntro));
let observerScheduled=false;
new MutationObserver(records=>{
 if(!records.some(r=>r.target.classList?.contains(`page`)))return;
 if(observerScheduled)return;
 observerScheduled=true;
 queueMicrotask(()=>{observerScheduled=false;updateIntro()});
}).observe(main,{subtree:true,attributes:true,attributeFilter:[`class`]});
const seen=new WeakSet();
const reveal=typeof IntersectionObserver===`function`?new IntersectionObserver(entries=>{
 entries.forEach(entry=>{
  if(!entry.isIntersecting)return;
  reveal.unobserve(entry.target);
  if(seen.has(entry.target)||!motion())return;
  seen.add(entry.target);
  entry.target.animate([{opacity:.55,filter:`blur(4px)`,transform:`translateY(25px)`},{opacity:1,filter:`blur(0)`,transform:`translateY(0)`}],{duration:580,easing:`cubic-bezier(.16,1,.3,1)`});
 });
},{threshold:.06,rootMargin:`0px 0px -12px 0px`}):null;
function observeReveal(){
 if(!reveal)return;
 const active=page();if(!active)return;
 [...active.querySelectorAll(`.decisionGrid>.panel,.settingsGrid>.settingCard,.accountCard,.categoryCard,.sectionHead,.cmMonthDetail .balanceHero`)].slice(0,60).forEach(el=>{
  if(el.dataset.cmObserved)return;
  el.dataset.cmObserved=`1`;reveal.observe(el);
 });
}
const amounts=new Map();
for(const id of [`dailyBalance`,`heroBalance`,`liquidityTotal`,`incomeTotal`,`expenseTotal`,`projectedBalance`]){
 const node=document.getElementById(id);
 if(node)amounts.set(id,node.textContent.trim());
}
function highlightValues(){
 for(const [id,old] of amounts){
  const el=document.getElementById(id);if(!el)continue;
  const value=el.textContent.trim();
  if(value!==old&&motion()&&value)el.animate([{filter:`brightness(1)`},{filter:`brightness(1.6)`,offset:.4},{filter:`brightness(1)`}],{duration:500});
  amounts.set(id,value);
 }
}
window.addEventListener(`salary:render`,()=>requestAnimationFrame(()=>{buildBento();updateIntro();syncGlider();highlightValues();observeReveal()}));
requestAnimationFrame(()=>{enterPage();observeReveal();paintProgress()});
let spotFrame=0;
main.addEventListener(`pointermove`,event=>{
 if(!fine()||!motion()||event.pointerType!==`mouse`)return;
 const el=event.target.closest(`.cmFeature .dailyHero,.cmAside .quickCard,.cmMonthDetail .balanceHero,.page .panel,.page .accountCard,.page .categoryCard`);
 if(!el)return;
 const x=event.clientX,y=event.clientY;
 cancelAnimationFrame(spotFrame);
 spotFrame=requestAnimationFrame(()=>{
  if(!el.isConnected)return;
  const r=el.getBoundingClientRect();
  el.style.setProperty(`--cm-x`,`${((x-r.left)/Math.max(1,r.width)*100).toFixed(1)}%`);
  el.style.setProperty(`--cm-y`,`${((y-r.top)/Math.max(1,r.height)*100).toFixed(1)}%`);
 });
},{passive:true});
const dialogMotion=new MutationObserver(records=>{
 if(!motion())return;
 records.forEach(record=>{
  const modal=record.target;
  if(!(modal instanceof HTMLElement)||!modal.classList.contains(`modal`)||modal.classList.contains(`hidden`))return;
  const card=modal.querySelector(`.modalCard`);
  card?.animate([{opacity:.2,transform:`translateY(25px) scale(.97)`,filter:`blur(8px)`},{opacity:1,transform:`translateY(0) scale(1)`,filter:`blur(0)`}],{duration:460,easing:`cubic-bezier(.16,1,.3,1)`});
 });
});
document.querySelectorAll(`.modal`).forEach(modal=>dialogMotion.observe(modal,{attributes:true,attributeFilter:[`class`]}));
document.addEventListener(`pointerdown`,event=>{
 if(!motion())return;
 const btn=event.target.closest(`.btn,.circleBtn,.sidebar a[data-page],.topActions button,.reportTabs button`);
 if(!btn||btn.disabled)return;
 const r=btn.getBoundingClientRect();
 if(!r.width)return;
 if(getComputedStyle(btn).position===`static`)btn.style.position=`relative`;
 const dot=document.createElement(`span`);
 dot.className=`cmRipple`;
 dot.style.left=`${event.clientX-r.left}px`;
 dot.style.top=`${event.clientY-r.top}px`;
 btn.append(dot);
 dot.addEventListener(`animationend`,()=>dot.remove(),{once:true});
 setTimeout(()=>dot.remove(),700);
},{passive:true});
document.documentElement.classList.add(`cmMotionReady`);
})();
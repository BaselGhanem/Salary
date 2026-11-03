(()=>{
`use strict`;
const app=document.getElementById(`app`);
const nav=document.getElementById(`nav`);
const topActions=document.querySelector(`.topbar .topActions`);
const greeting=document.querySelector(`.topbar .greeting`);
if(!app||!nav||!topActions||!greeting)return;
const motion=()=>window.matchMedia(`(prefers-reduced-motion: reduce)`).matches||document.body.classList.contains(`no-motion`);
const icons={
 chevron:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>`,
 search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg>`
};
const pages=[...nav.querySelectorAll(`a[data-page]`)].map(node=>({node,key:node.dataset.page,name:node.querySelector(`span:last-child`)?.textContent.trim()||node.getAttribute(`title`)||node.dataset.page}));
/* Keep every existing sidebar destination available in the mobile More sheet. */
const moreGrid=document.querySelector(`#mobileMore .moreMenuGrid`);
if(moreGrid){
 for(const entry of pages){
   if(moreGrid.querySelector(`[data-go="${entry.key}"]`))continue;
   const a=document.createElement(`a`);
   a.className=`menuLink`;
   a.href=`?page=${encodeURIComponent(entry.key)}`;
   a.dataset.go=entry.key;
   const symbol=document.createElement(`span`);symbol.className=`menuIcon`;
   symbol.innerHTML=entry.node.querySelector(`.ico`)?.innerHTML||`<span aria-hidden="true">◉</span>`;
   const label=document.createElement(`span`);label.textContent=entry.name;
   a.append(symbol,label);moreGrid.append(a);
 }
}
const crumb=document.createElement(`div`);
crumb.id=`atelierRouteCrumb`;
crumb.setAttribute(`aria-live`,`polite`);
crumb.innerHTML=`<span>مساحتك المالية</span><span aria-hidden="true">/</span><span class="current">الرئيسية</span>`;
greeting.prepend(crumb);
const getActive=()=>[...app.querySelectorAll(`main .page.active`)].find(p=>!p.classList.contains(`hidden`))||null;
const activeKey=()=>getActive()?.id.replace(/Page$/,``)||new URLSearchParams(location.search).get(`page`)||`dashboard`;
let lastPage=``;
function updateRoute(){
 const key=activeKey();
 const label=pages.find(p=>p.key===key)?.name||getActive()?.querySelector(`.sectionHead h1,.sectionHead h2`)?.textContent.trim()||`الرئيسية`;
 const current=crumb.querySelector(`.current`);
 if(current&&current.textContent!==label)current.textContent=label;
 for(const entry of pages){
   const active=entry.key===key;
   entry.node.classList.toggle(`active`,active);
   if(active)entry.node.setAttribute(`aria-current`,`page`);
   else entry.node.removeAttribute(`aria-current`);
 }
 if(lastPage!==key){
   lastPage=key;
   const active=getActive();
   if(active)active.setAttribute(`aria-label`,label);
 }
}
updateRoute();
const routeObserver=new MutationObserver(records=>{
 if(records.some(record=>record.target.classList?.contains(`page`)))updateRoute();
});
routeObserver.observe(app,{subtree:true,attributes:true,attributeFilter:[`class`]});
window.addEventListener(`popstate`,updateRoute);
window.addEventListener(`salary:render`,updateRoute);
const skip=document.createElement(`a`);
skip.id=`atelierSkip`;
skip.href=`#current-content`;
skip.textContent=`تخطي التنقل والوصول للمحتوى`;
skip.addEventListener(`click`,event=>{
 event.preventDefault();
 const target=!app.classList.contains(`hidden`)?getActive():document.getElementById(`passwordInput`);
 if(!target)return;
 if(target.classList?.contains(`page`)){
   target.setAttribute(`tabindex`,`-1`);
   target.focus({preventScroll:true});
   target.scrollIntoView({block:`start`,behavior:motion()?`auto`:`smooth`});
 }else target.focus();
});
document.body.prepend(skip);
const brand=document.querySelector(`.sidebar .brand`);
if(brand){
 const collapse=document.createElement(`button`);
 collapse.id=`atelierCollapse`;
 collapse.type=`button`;
 collapse.setAttribute(`aria-controls`,`nav`);
 collapse.innerHTML=icons.chevron;
 brand.append(collapse);
 const storageKey=`ratibi.workspace.sidebar.compact.v1`;
 let compact=false;
 try{compact=localStorage.getItem(storageKey)===`1`}catch{}
 function setCompact(value){
   compact=!!value;
   app.classList.toggle(`atelier-collapsed`,compact);
   collapse.setAttribute(`aria-expanded`,String(!compact));
   collapse.setAttribute(`aria-label`,compact?`توسيع القائمة الجانبية`:`طي القائمة الجانبية`);
   collapse.title=compact?`توسيع القائمة`:`طي القائمة`;
 }
 setCompact(compact);
 collapse.addEventListener(`click`,()=>{
   setCompact(!compact);
   try{localStorage.setItem(storageKey,compact?`1`:`0`)}catch{}
 });
}
const searchBtn=document.createElement(`button`);
searchBtn.id=`atelierSearchBtn`;
searchBtn.type=`button`;
searchBtn.setAttribute(`aria-haspopup`,`dialog`);
searchBtn.innerHTML=icons.search+`<span>انتقل الى صفحة</span><kbd>Ctrl K</kbd>`;
topActions.prepend(searchBtn);
const palette=document.createElement(`div`);
palette.id=`atelierPalette`;
palette.hidden=true;
palette.innerHTML=`<section class="palettePanel" role="dialog" aria-modal="true" aria-labelledby="atelierPaletteTitle"><div class="paletteHead"><strong id="atelierPaletteTitle">التنقل السريع</strong><button class="paletteClose" type="button" aria-label="اغلاق البحث">×</button></div><input class="paletteInput" type="search" autocomplete="off" aria-label="ابحث عن صفحة" placeholder="ابحث عن صفحة او قسم..."><div class="paletteList" role="list"></div><div class="paletteFooter">اكتب اسم الصفحة ثم اضغط Enter · Esc للاغلاق</div></section>`;
document.body.append(palette);
const input=palette.querySelector(`.paletteInput`);
const results=palette.querySelector(`.paletteList`);
const closeBtn=palette.querySelector(`.paletteClose`);
let previousFocus=null;
function renderResults(){
 const value=input.value.trim().toLocaleLowerCase(`ar`);
 const matching=pages.filter(item=>(item.name+` `+item.key).toLocaleLowerCase(`ar`).includes(value));
 results.replaceChildren();
 if(!matching.length){
   const empty=document.createElement(`p`);
   empty.className=`paletteEmpty`;
   empty.textContent=`ما في صفحات مطابقة للبحث`;
   results.append(empty);
   return;
 }
 for(const entry of matching){
   const button=document.createElement(`button`);
   button.type=`button`;
   button.className=`paletteLink`;
   button.setAttribute(`role`,`listitem`);
   const name=document.createElement(`span`);
   name.textContent=entry.name;
   const hint=document.createElement(`span`);
   hint.textContent=entry.key===activeKey()?`الصفحة الحالية`:`انتقال`;
   button.append(name,hint);
   button.addEventListener(`click`,()=>{
     closePalette(false);
     entry.node.click();
     requestAnimationFrame(()=>{
       const title=getActive()?.querySelector(`.sectionHead h1,.sectionHead h2`);
       if(title){title.tabIndex=-1;title.focus({preventScroll:true})}
     });
   });
   results.append(button);
 }
}
function openPalette(){
 if(!palette.hidden||app.classList.contains(`hidden`)||document.querySelector(`.modal:not(.hidden)`))return;
 previousFocus=document.activeElement;
 palette.hidden=false;
 document.body.classList.add(`atelier-palette-open`);
 searchBtn.setAttribute(`aria-expanded`,`true`);
 input.value=``;
 renderResults();
 input.focus();
}
function closePalette(restore=true){
 if(palette.hidden)return;
 palette.hidden=true;
 document.body.classList.remove(`atelier-palette-open`);
 searchBtn.setAttribute(`aria-expanded`,`false`);
 if(restore&&previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
}
searchBtn.addEventListener(`click`,openPalette);
closeBtn.addEventListener(`click`,()=>closePalette());
input.addEventListener(`input`,renderResults);
input.addEventListener(`keydown`,event=>{
 if(event.key===`Enter`){
   const first=results.querySelector(`.paletteLink`);
   if(first){event.preventDefault();first.click()}
 }
 if(event.key===`ArrowDown`){
   const first=results.querySelector(`.paletteLink`);
   if(first){event.preventDefault();first.focus()}
 }
});
palette.addEventListener(`click`,event=>{if(event.target===palette)closePalette()});
document.addEventListener(`keydown`,event=>{
 if((event.ctrlKey||event.metaKey)&&event.key.toLocaleLowerCase()===`k`){
   if(event.target.closest?.(`input,textarea,[contenteditable="true"]`))return;
   event.preventDefault();
   palette.hidden?openPalette():closePalette();
   return;
 }
 if(palette.hidden)return;
 if(event.key===`Escape`){event.preventDefault();closePalette();return}
 if(event.key===`Tab`){
   const focusable=[...palette.querySelectorAll(`input,button:not([disabled])`)].filter(el=>el.getClientRects().length);
   const first=focusable[0],last=focusable[focusable.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 }
 if(event.key===`ArrowDown`||event.key===`ArrowUp`){
   if(document.activeElement.classList.contains(`paletteLink`)){
     const items=[...results.querySelectorAll(`.paletteLink`)];
     const index=items.indexOf(document.activeElement);
     const next=items[index+(event.key===`ArrowDown`?1:-1)];
     if(next){event.preventDefault();next.focus()}
     else if(event.key===`ArrowUp`){event.preventDefault();input.focus()}
   }
 }
});
})();
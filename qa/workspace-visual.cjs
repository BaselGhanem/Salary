const fs=require(`node:fs`),path=require(`node:path`),http=require(`node:http`),assert=require(`node:assert/strict`);
const {chromium}=require(`playwright`);
const root=path.resolve(__dirname,`..`),out=path.join(root,`workspace-screenshots`);
fs.mkdirSync(out,{recursive:true});
const openServer=folder=>new Promise(done=>{
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,`http://localhost`).pathname;
  const file=path.resolve(folder,`.`+(pathname===`/`?`/index.html`:pathname));
  if(!file.startsWith(folder+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(err,bytes)=>{
   if(err){res.writeHead(404).end();return}
   res.setHeader(`Content-Type`,file.endsWith(`.css`)?`text/css`:file.endsWith(`.js`)?`text/javascript`:file.endsWith(`.html`)?`text/html`:`application/octet-stream`);
   res.end(bytes);
  });
 });
 server.listen(0,`127.0.0.1`,()=>done({server,url:`http://127.0.0.1:`+server.address().port}));
});
(async()=>{
 const before=await openServer(path.join(root,`_baseline`)),after=await openServer(root),browser=await chromium.launch();
 const report={scope:`Unauthenticated UI-only preview, never exercises production finances or Firebase`,runs:[]};
 try{
  for(const [version,host] of [[`before`,before],[`after`,after]]){
   for(const viewport of [{name:`desktop`,width:1440,height:900},{name:`mobile`,width:390,height:844}]){
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},isMobile:viewport.name===`mobile`,hasTouch:viewport.name===`mobile`,reducedMotion:`reduce`});
    const page=await context.newPage();
    await page.route(`**/*`,route=>{
     const url=route.request().url();
     return url.startsWith(host.url)?route.continue():route.fulfill({status:204,body:``});
    });
    await page.goto(host.url+`/index.html`,{waitUntil:`domcontentloaded`});
    await page.evaluate(()=>{
     document.getElementById(`loader`)?.remove();
     document.getElementById(`app`)?.classList.add(`hidden`);
     document.getElementById(`auth`)?.classList.remove(`hidden`);
    });
    await page.screenshot({path:path.join(out,[version,viewport.name,`login`].join(`-`)+`.png`),animations:`disabled`});
    await page.evaluate(()=>{
     document.getElementById(`auth`)?.classList.add(`hidden`);
     document.getElementById(`app`)?.classList.remove(`hidden`);
     document.querySelectorAll(`main .page`).forEach(el=>el.classList.toggle(`active`,el.id===`dashboardPage`));
     document.getElementById(`salaryUpdateNotice`)?.remove();
    });
    await page.screenshot({path:path.join(out,[version,viewport.name,`dashboard-shell`].join(`-`)+`.png`),animations:`disabled`,fullPage:true});
    let cinematic=null;
    if(version===`after`){
     assert.equal(await page.locator(`#cmIntroTitle`).count(),1);
     assert.equal(await page.locator(`#cmStage`).count(),1);
     assert.equal(await page.locator(`#cmStage .cmFeature .dailyHero`).count(),1);
     assert.equal(await page.locator(`#cmStage .cmAside .quickColumn`).count(),1);
     assert.equal(await page.locator(`.cmMonthDetail .heroGrid`).count(),1);
     cinematic=await page.evaluate(()=>({
       background:!!document.querySelector(`.cmBackdrop`),
       navGlider:!!document.querySelector(`.cmNavigationGlider`),
       stageColumns:getComputedStyle(document.querySelector(`#cmStage`)).gridTemplateColumns,
       horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,
       reducedMotion:matchMedia(`(prefers-reduced-motion: reduce)`).matches
     }));
     assert.equal(cinematic.horizontalOverflow,false,`Cinematic dashboard must not overflow viewport`);
     await page.emulateMedia({reducedMotion:`no-preference`});
     await page.evaluate(()=>window.dispatchEvent(new CustomEvent(`salary:page`,{detail:`dashboard`})));
     cinematic.motionActive=await page.locator(`.cmWipe`).count()>0;
     assert.equal(cinematic.motionActive,true,`Page transitions should create animated wipe`);
     await page.emulateMedia({reducedMotion:`reduce`});
    }
    let searchChecked=false,collapsedChecked=false,mobileStoryReachable=false;
    if(version===`after`){
     if(viewport.name===`desktop`){
      await page.locator(`#atelierCollapse`).click();
      collapsedChecked=await page.locator(`#app.atelier-collapsed`).count()===1;
      await page.locator(`#atelierSearchBtn`).click();
      await page.locator(`#atelierPalette .paletteInput`).fill(`التقارير`);
      searchChecked=await page.locator(`#atelierPalette .paletteLink`).count()>0;
     }else mobileStoryReachable=await page.locator(`#mobileMore .moreMenuGrid [data-go="financialStory"]`).count()>0;
    }
    const widths=await page.evaluate(()=>[document.documentElement.scrollWidth,window.innerWidth]);
    report.runs.push({version,viewport:viewport.name,widths,searchChecked,collapsedChecked,mobileStoryReachable,cinematic});
    await context.close();
   }
  }
  /* Motion demo uses a synthetic UI-only session; never writes account data. */
  const demoContext=await browser.newContext({
   viewport:{width:1440,height:900},
   reducedMotion:`no-preference`,
   recordVideo:{dir:out,size:{width:1440,height:900}}
  });
  const demo=await demoContext.newPage();
  await demo.route(`**/*`,route=>{
   const url=route.request().url();
   return url.startsWith(after.url)?route.continue():route.fulfill({status:204,body:``});
  });
  await demo.goto(after.url+`/index.html`,{waitUntil:`domcontentloaded`});
  await demo.evaluate(()=>{
   document.getElementById(`loader`)?.remove();
   document.getElementById(`auth`)?.classList.add(`hidden`);
   document.getElementById(`app`)?.classList.remove(`hidden`);
   document.getElementById(`salaryUpdateNotice`)?.remove();
   document.querySelectorAll(`main .page`).forEach(el=>el.classList.toggle(`active`,el.id===`dashboardPage`));
  });
  await demo.waitForTimeout(1200);
  for(const route of [`transactions`,`reports`,`dashboard`]){
   await demo.evaluate(route=>{
    document.querySelectorAll(`main .page`).forEach(el=>el.classList.toggle(`active`,el.id===route+`Page`));
    document.querySelectorAll(`#nav a[data-page]`).forEach(el=>{
     const selected=el.dataset.page===route;
     el.classList.toggle(`active`,selected);
     if(selected)el.setAttribute(`aria-current`,`page`);else el.removeAttribute(`aria-current`);
    });
    window.dispatchEvent(new CustomEvent(`salary:page`,{detail:route}));
   },route);
   await demo.waitForTimeout(970);
  }
  const video=demo.video();
  await demoContext.close();
  if(video){
   const generated=await video.path();
   fs.renameSync(generated,path.join(out,`cinematic-motion-demo.webm`));
   report.demo=`UI-only motion video, no authenticated financial workflow`;
  }
  report.reference=[];
  for(const vp of [{name:`desktop`,width:1440,height:900},{name:`mobile`,width:390,height:844}]){
   const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},isMobile:vp.name===`mobile`,hasTouch:vp.name===`mobile`,reducedMotion:`reduce`});
   const page=await context.newPage();
   try{
    const response=await page.goto(`https://demo.codeandchill.store/sorvo/`,{waitUntil:`domcontentloaded`,timeout:25000});
    await page.screenshot({path:path.join(out,[`reference`,vp.name].join(`-`)+`.png`),animations:`disabled`});
    const info=await page.evaluate(()=>({title:document.title,heading:document.querySelector(`h1`)?.textContent?.trim()||``,links:[...document.querySelectorAll(`nav a`)].slice(0,14).map(x=>x.textContent.trim()),width:document.documentElement.scrollWidth,viewport:innerWidth}));
    await page.waitForTimeout(1800);
    await page.screenshot({path:path.join(out,[`reference`,vp.name,`settled`].join(`-`)+`.png`),animations:`disabled`});
    if(vp.name===`desktop`){
      try{
        const tab=page.locator(`nav a`).filter({hasText:`Analytics`}).first();
        if(await tab.count()){await tab.click({timeout:4000});await page.waitForTimeout(600);await page.screenshot({path:path.join(out,`reference-desktop-analytics.png`),animations:`disabled`});info.analyticsClicked=true;}
      }catch(error){info.analyticsClickError=String(error).slice(0,220)}
    }
    report.reference.push({viewport:vp.name,httpStatus:response?.status()||null,...info});
   }catch(error){report.reference.push({viewport:vp.name,error:String(error).slice(0,320)})}
   await context.close();
  }
 }finally{
  fs.writeFileSync(path.join(out,`report.json`),JSON.stringify(report,null,2));
  await browser.close();before.server.close();after.server.close();
 }
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

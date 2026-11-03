const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const js=read('cinematic-motion.js');
const css=read('cinematic-motion.css');
const html=read('index.html');
const sw=read('sw.js');

test('motion layer is attached after app logic and existing design',()=>{
 const old=html.indexOf('src="workspace-rebuild.js');
 const current=html.indexOf('src="cinematic-motion.js');
 assert.ok(old>0&&current>old);
 assert.ok(html.indexOf('href="cinematic-motion.css')>html.indexOf('href="workspace-rebuild.css'));
 for(const id of ['dashboardPage','transactionsPage','reportsPage','settingsPage','plannerPage','financialStoryPage','loginForm','accountForm','transactionForm','quickThemeBtn','privacyBtn','heroAccounts','dailyBalance']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
});

test('the entire motion script parses and leaves finance/storage APIs to the original app',()=>{
 assert.doesNotThrow(()=>new vm.Script(js));
 for(const forbidden of ['localStorage.setItem','sessionStorage.setItem','firebase.firestore','SalarySyncCore','months.items']){
  assert.ok(!js.includes(forbidden),forbidden);
 }
 assert.match(js,/salary:page/);
 assert.match(js,/salary:render/);
 assert.match(js,/cmNavigationGlider/);
 assert.match(js,/buildBento/);
 assert.match(js,/prefers-reduced-motion/);
});

test('cinematic design has actual animations, new composition and mobile/reduced-motion support',()=>{
 for(const marker of ['.cmStage','.cmIntro','.cmNavigationGlider','.cmBackdrop','@keyframes cmAuraFloat','@keyframes cmOrbitSpin','@keyframes cmHeroSweep','@keyframes cmRipple','@media(max-width:760px)','prefers-reduced-motion:reduce']){
  assert.ok(css.includes(marker),marker);
 }
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});

test('PWA shell includes new assets under a new cache version',()=>{
 assert.match(sw,/salary-shell-20261103-cinematic-v2/);
 assert.match(sw,/cinematic-motion\.css/);
 assert.match(sw,/cinematic-motion\.js/);
});

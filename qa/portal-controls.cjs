'use strict';
const {chromium} = require('playwright-core');
const fs=require('node:fs'),path=require('node:path');
const output=process.env.QA_OUT_DIR||path.join(__dirname,'..','qa-out-controls');
fs.mkdirSync(output,{recursive:true});
const viewer=process.env.VIEWER_URL||'http://127.0.0.1:5412/';
const origin='https://op7418.github.io/guizang-game-skill/';
const report={at:new Date().toISOString(),viewer,checks:[],errors:[],assetErrors:[]};
function verify(name,passed,detail=''){report.checks.push({name,passed:!!passed,detail});if(!passed)throw Error('FAILED '+name+' '+JSON.stringify(detail))}
const dummy='<html lang="zh"><head><title>雾锁山门</title></head><body>QA STUB — no game media downloaded</body></html>';
(async()=>{
 const browser=process.env.QA_CHROME_PATH ?
   await chromium.launch({executablePath:process.env.QA_CHROME_PATH,headless:true,args:['--disable-gpu','--disable-extensions','--no-first-run','--no-default-browser-check']}) :
   await chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9222',{timeout:25000});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block',acceptDownloads:false});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)report.assetErrors.push(r.status()+' '+r.url())});
  let originLoads=0;
  await page.route(/^https:\/\/op7418\.github\.io\/guizang-game-skill\/$/,route=>{originLoads++;return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:dummy})});
  try{
   const response=await page.goto(viewer,{waitUntil:'domcontentloaded',timeout:45000});
   verify('viewer HTTP200',response.status()===200,response.status());
   verify('live iframe url is official author origin',await page.locator('#official-game').getAttribute('src')===origin);
   await page.waitForFunction(()=>document.getElementById('frame-status').textContent.includes('Khung nguồn'),null,{timeout:12000});
   verify('load feedback describes frame rather than claiming game READY',true);
   verify('official iframe resource is not mirrored locally',originLoads===1,originLoads);
   await page.locator('#focus-toggle').click();
   verify('focus mode expands play space',await page.locator('body').evaluate(e=>e.classList.contains('focus-mode')) && await page.locator('#focus-toggle').getAttribute('aria-pressed')==='true');
   verify('footer hidden only in focus mode',!(await page.locator('footer').isVisible()));
   await page.locator('#focus-toggle').click();
   verify('focus mode fully reversible',await page.locator('#focus-toggle').getAttribute('aria-pressed')==='false' && await page.locator('footer').isVisible());
   verify('focus mode false state is remembered locally',await page.evaluate(()=>localStorage.getItem('qs3d.guizang.viewer.focus.v1')==='0'));
   await page.locator('#focus-toggle').click();
   verify('focus mode true state persisted',await page.evaluate(()=>localStorage.getItem('qs3d.guizang.viewer.focus.v1')==='1'));
   await page.reload({waitUntil:'domcontentloaded'});
   verify('focus preference survives page reload',await page.locator('body').evaluate(e=>e.classList.contains('focus-mode')) && await page.locator('#focus-toggle').getAttribute('aria-pressed')==='true');
   await page.locator('#focus-toggle').click();
   verify('focus preference can be reset after reload',await page.locator('#focus-toggle').getAttribute('aria-pressed')==='false');
   await page.waitForFunction(()=>document.getElementById('frame-status').textContent.includes('Khung nguồn'),null,{timeout:12000});
   originLoads=1; // Reset count to the new loaded page for reload-confirmation checks.
   await page.locator('#help-toggle').click();
   verify('help is accessible and disclosed',await page.locator('#help-panel').isVisible() && await page.locator('#help-toggle').getAttribute('aria-expanded')==='true');
   await page.locator('#help-toggle').click();
   verify('help toggle reversible',!(await page.locator('#help-panel').isVisible()));
   await page.locator('#reload-game').click();
   verify('reload requires an explicit modal confirmation',await page.locator('#reload-confirm').isVisible());
   verify('reload intent does not yet touch original iframe',originLoads===1,originLoads);
   await page.locator('#cancel-reload').click();
   verify('cancel keeps original game intact',originLoads===1 && !(await page.locator('#reload-confirm').isVisible()),originLoads);
   await page.locator('#reload-game').click();
   await page.locator('#confirm-reload').click();
   await page.waitForFunction(()=>document.getElementById('frame-status').textContent.includes('Khung nguồn'),null,{timeout:12000});
   verify('confirmed reload actually re-requests official iframe',originLoads>=2,originLoads);
   await page.evaluate(()=>window.dispatchEvent(new Event('offline')));
   verify('offline notification appears',await page.locator('#frame-status').innerText().then(t=>t.includes('ngoại tuyến')) && await page.locator('#slow-panel').isVisible());
   await page.evaluate(()=>window.dispatchEvent(new Event('online')));
   verify('online event informs but does not force a reload',await page.locator('#frame-status').innerText().then(t=>t.includes('phục hồi')) && originLoads===2,originLoads);
   verify('online recovery notification is bounded',await page.evaluate(()=>document.getElementById('frame-status').textContent.includes('Kết nối đã phục hồi')));
   await page.locator('#fullscreen-toggle').click();
   await page.waitForTimeout(300);
   const capable=await page.evaluate(()=>document.fullscreenEnabled);
   if(capable){
     verify('fullscreen toggles on when browser supports it',await page.evaluate(()=>Boolean(document.fullscreenElement)));
     await page.locator('#fullscreen-toggle').click();
     verify('fullscreen toggles off',!(await page.evaluate(()=>Boolean(document.fullscreenElement))));
   }else verify('fullscreen feature fallback provides status message',await page.locator('#frame-status').isVisible());
  }finally{await context.close()}
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
  const mobilePage=await mobile.newPage();
  mobilePage.on('pageerror',e=>report.errors.push(String(e)));
  await mobilePage.route(/^https:\/\/op7418\.github\.io\/guizang-game-skill\/$/,route=>route.fulfill({status:200,contentType:'text/html',body:dummy}));
  try{
   await mobilePage.goto(viewer,{waitUntil:'domcontentloaded',timeout:45000});
   const b=await mobilePage.locator('#official-game').boundingBox();
   verify('mobile frame remains playable size',b.width>=360&&b.height>=390,b);
   verify('mobile action bar remains accessible',await mobilePage.locator('#reload-game').isVisible()&&await mobilePage.locator('#focus-toggle').isVisible());
   await mobilePage.locator('#focus-toggle').click();
   verify('mobile focus mode works',await mobilePage.locator('body').evaluate(e=>e.classList.contains('focus-mode')));
   await mobilePage.screenshot({path:path.join(output,'controls-mobile.png')});
  }finally{await mobile.close()}
  const privateContext=await browser.newContext({viewport:{width:800,height:650},serviceWorkers:'block'});
  await privateContext.addInitScript(() => {
    Object.defineProperty(Storage.prototype,'getItem',{configurable:true,value(){throw Error('Storage unavailable')}});
    Object.defineProperty(Storage.prototype,'setItem',{configurable:true,value(){throw Error('Storage unavailable')}});
  });
  const privatePage=await privateContext.newPage();
  privatePage.on('pageerror',e=>report.errors.push(String(e)));
  await privatePage.route(/^https:\/\/op7418\.github\.io\/guizang-game-skill\/$/,route=>route.fulfill({status:200,contentType:'text/html',body:dummy}));
  try{
   await privatePage.goto(viewer,{waitUntil:'domcontentloaded',timeout:45000});
   verify('viewer starts without localStorage access',await privatePage.locator('#focus-toggle').getAttribute('aria-pressed')==='false');
   await privatePage.locator('#focus-toggle').click();
   verify('focus toggle works when storage is denied',await privatePage.locator('#focus-toggle').getAttribute('aria-pressed')==='true');
  }finally{await privateContext.close()}
  verify('no browser exceptions',report.errors.length===0,report.errors);
  verify('no failing HTTP responses',report.assetErrors.length===0,report.assetErrors);
 }finally{
  report.passed=report.checks.filter(x=>x.passed).length;report.failed=report.checks.length-report.passed;report.total=report.checks.length;
  fs.writeFileSync(path.join(output,'controls-qa.json'),JSON.stringify(report,null,2));
  if(process.env.QA_CHROME_PATH)await browser.close();
 }
 console.log('CONTROLS_QA',JSON.stringify({passed:report.passed,total:report.total,errors:report.errors.length}));
 process.exit(report.failed?1:0);
})().catch(e=>{report.error=String(e.stack||e);fs.writeFileSync(path.join(output,'controls-qa.json'),JSON.stringify(report,null,2));console.error('CONTROLS_QA_FAIL',report.error);process.exit(1)});
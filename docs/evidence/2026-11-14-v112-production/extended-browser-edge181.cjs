'use strict';
const {chromium}=require('playwright-core'),fs=require('fs');
const url='https://guizang.qs3d.site/',origin='https://op7418.github.io/guizang-game-skill/';
const report={at:new Date().toISOString(),checks:[],errors:[]},stub='<html><title>雾锁山门</title>QA STUB</html>';
const ok=(name,pass,detail)=>{report.checks.push({name,pass:!!pass,detail});if(!pass)throw Error('Failed '+name+' '+JSON.stringify(detail))};
(async()=>{
const browser=await chromium.launch({executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',headless:true,args:['--disable-gpu','--no-first-run','--no-default-browser-check','--disable-extensions','--renderer-process-limit=2']});
try{
const ctx=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});let loads=0;
await ctx.route(origin,r=>{loads++;return r.fulfill({status:200,contentType:'text/html',body:stub})});
const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(String(e)));
try{
const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});ok('viewer 200',response.status()===200,response.status());
await page.waitForFunction(()=>document.querySelector('#frame-status').textContent.includes('Khung nguồn'),null,{timeout:15000});
ok('frame initial load',loads===1,loads);
await page.locator('#reload-game').press('Enter');ok('Enter opens reload dialog',await page.locator('#reload-confirm').isVisible());
await page.keyboard.press('Escape');ok('Escape preserves iframe',loads===1&&!(await page.locator('#reload-confirm').isVisible()),loads);
await ctx.setOffline(true);
await page.waitForFunction(()=>document.querySelector('#frame-status').textContent.includes('ngoại tuyến'),null,{timeout:10000});
ok('real offline browser status',await page.locator('#slow-panel').isVisible());
ok('offline preserves author frame',loads===1,loads);
await ctx.setOffline(false);
await page.waitForFunction(()=>document.querySelector('#frame-status').textContent.includes('phục hồi'),null,{timeout:10000});
ok('real reconnect feedback',await page.locator('#frame-status').isVisible());
ok('reconnect preserves iframe',loads===1,loads);
await page.waitForTimeout(12600);
ok('reconnect status expires',!(await page.locator('#frame-status').isVisible()));
}finally{await ctx.close()}
for(const width of [320,360,390,768,1024,1440]){
const ctx2=await browser.newContext({viewport:{width,height:width<=390?640:800},isMobile:width<=390,hasTouch:width<=390,serviceWorkers:'block'});
const p=await ctx2.newPage();p.on('pageerror',e=>report.errors.push(String(e)));
await p.route(origin,r=>r.fulfill({status:200,contentType:'text/html',body:stub}));
try{
const res=await p.goto(url,{waitUntil:'domcontentloaded',timeout:40000});ok('HTTP '+width,res.status()===200);
const m=await p.evaluate(()=>({w:innerWidth,x:document.documentElement.scrollWidth,h:document.querySelector('#official-game').getBoundingClientRect().height,buttons:[...document.querySelectorAll('.toolstrip button')].map(b=>({left:b.getBoundingClientRect().left,right:b.getBoundingClientRect().right}))}));
ok('no horizontal overflow '+width,m.x<=m.w+1,m);
ok('toolbar fits '+width,m.buttons.every(b=>b.left>=-1&&b.right<=m.w+1),m);
ok('game height '+width,m.h>=280,m);
}finally{await ctx2.close()}
}
ok('zero JS exceptions',report.errors.length===0,report.errors);
}finally{await browser.close()}
report.passed=report.checks.filter(x=>x.pass).length;report.total=report.checks.length;
fs.writeFileSync('C:\\QS3D-QA\\guizang-v112-ux-20261114-out\\extended-network-edge181.json',JSON.stringify(report,null,2));
console.log('EXTENDED_QA_PASS '+report.passed+'/'+report.total);
})().catch(e=>{report.error=String(e.stack||e);report.passed=report.checks.filter(x=>x.pass).length;report.total=report.checks.length;fs.writeFileSync('C:\\QS3D-QA\\guizang-v112-ux-20261114-out\\extended-network-edge181.json',JSON.stringify(report,null,2));console.error('EXTENDED_QA_FAIL '+report.error);process.exit(1)});

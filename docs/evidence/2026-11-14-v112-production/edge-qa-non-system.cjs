'use strict';
// Non-destructive Edge verification: refuses to launch browser under SYSTEM.
// Run using a normal, non-elevated Windows QA account with Playwright Core installed.
// Does not read regular Edge profiles or modify the production application.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const output=path.resolve(process.env.QA_OUT_DIR||process.cwd(),'edge-qa-non-system-result.json');
const result={checkedAt:new Date().toISOString(),target:process.env.QA_VIEWER_URL||'https://guizang.qs3d.site/',checks:[],status:'NOT_STARTED'};
function save(){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n')}
function check(name,pass,details){result.checks.push({name,passed:!!pass,details});if(!pass)throw Error(name+' '+JSON.stringify(details))}
(async()=>{
 const identity=cp.execFileSync('whoami',{encoding:'utf8',timeout:5000}).trim();
 result.principalIsSystem=/^nt authority\\system$/i.test(identity);
 if(result.principalIsSystem){
   result.status='SKIPPED_SYSTEM_CONTEXT';result.reason='Edge previously exited 1002 under NT AUTHORITY\\SYSTEM; use dedicated non-elevated QA user and profile.';
   save();console.log('EDGE_QA_SKIPPED_SYSTEM_CONTEXT');return;
 }
 const {chromium}=require('playwright-core');
 const browser=await chromium.launch({channel:'msedge',headless:true,timeout:25000,args:['--disable-gpu']});
 try{
   const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
   const origin='https://op7418.github.io/guizang-game-skill/';
   let iframeLoads=0;
   await context.route(origin,r=>{iframeLoads++;return r.fulfill({status:200,contentType:'text/html',body:'<html><title>QA iframe stub</title></html>'})});
   try{
     const page=await context.newPage();
     const errors=[];page.on('pageerror',e=>errors.push(String(e)));
     const res=await page.goto(result.target,{waitUntil:'domcontentloaded',timeout:45000});
     check('Edge viewer returns HTTP 200',res.status()===200,res.status());
     check('frame references author origin',await page.locator('#official-game').getAttribute('src')===origin);
     check('iframe fetched once',iframeLoads===1,iframeLoads);
     await page.locator('#reload-game').press('Enter');
     check('keyboard Enter opens confirmation',await page.locator('#reload-confirm').isVisible());
     await page.keyboard.press('Escape');
     check('keyboard Escape cancels without reload',iframeLoads===1 && !(await page.locator('#reload-confirm').isVisible()));
     await context.setOffline(true);
     await page.waitForFunction(()=>document.getElementById('frame-status').textContent.includes('ngoại tuyến'),null,{timeout:10000});
     check('Edge network emulation displays offline state',await page.locator('#slow-panel').isVisible());
     await context.setOffline(false);
     await page.waitForFunction(()=>document.getElementById('frame-status').textContent.includes('phục hồi'),null,{timeout:10000});
     check('reconnect does not silently reload iframe',iframeLoads===1,iframeLoads);
     check('no JavaScript page errors',errors.length===0,errors);
   }finally{await context.close()}
 }finally{await browser.close()}
 result.status='PASS';result.total=result.checks.length;result.passed=result.checks.filter(x=>x.passed).length;
 save();console.log('EDGE_QA_PASS '+result.passed+'/'+result.total);
})().catch(e=>{result.status='FAILED';result.error=String(e.stack||e);result.total=result.checks.length;result.passed=result.checks.filter(x=>x.passed).length;save();console.error('EDGE_QA_FAIL',result.error);process.exitCode=1});

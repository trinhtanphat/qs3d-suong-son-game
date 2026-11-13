'use strict';
const {chromium}=require('playwright-core'),fs=require('node:fs'),path=require('node:path');
const output=process.env.QA_OUT_DIR||path.join(__dirname,'..','qa-out');
fs.mkdirSync(output,{recursive:true});
const viewer=process.env.VIEWER_URL||'http://127.0.0.1:5406/play-original';
const origin='https://op7418.github.io/guizang-game-skill/';
const report={runAt:new Date().toISOString(),viewer,origin,checks:[],errors:[],failedRequests:[]};
function verify(name,passed,detail=''){report.checks.push({name,pass:!!passed,detail});if(!passed)throw Error('QA_FAIL '+name+' '+JSON.stringify(detail))}
async function boot(){
 if(process.env.QA_CHROME_PATH)return chromium.launch({executablePath:process.env.QA_CHROME_PATH,headless:true,args:['--enable-webgl','--use-angle=swiftshader','--no-first-run']});
 return chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9222',{timeout:30000});
}
(async()=>{
 const browser=await boot();
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:false,serviceWorkers:'block'});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(String(e)));
  page.on('requestfailed',r=>report.failedRequests.push(r.url()+' '+r.failure()?.errorText));
  try{
   const res=await page.goto(viewer,{waitUntil:'domcontentloaded',timeout:45000});
   verify('Viewer HTTP 200',res.status()===200,res.status());
   verify('Visible author attribution',await page.getByText('Guizang',{exact:false}).first().isVisible());
   const iframe=page.locator('#official-game');await iframe.waitFor({state:'visible',timeout:20000});
   const size=await iframe.boundingBox();
   verify('Desktop iframe occupies game area',size.width>=1100&&size.height>=600,size);
   verify('Iframe loads only the official source',await iframe.getAttribute('src')===origin);
   const child=await (await iframe.elementHandle()).contentFrame();
   await child.waitForLoadState('domcontentloaded',{timeout:60000});
   const title=await child.title();
   verify('Official frame loaded, not a copy',title.includes('雾锁山门')&&child.url().startsWith(origin),{title,url:child.url()});
   await child.waitForFunction(()=>document.body.classList.contains('ready'),null,{timeout:205000,polling:1500});
   verify('Original title screen reaches READY',await child.locator('#title .go').isVisible());
   const before=await child.evaluate(()=>({canvas:document.querySelectorAll('canvas').length,opacity:getComputedStyle(document.querySelector('#title')).opacity}));
   verify('Original WebGL canvas exists',before.canvas>=1,before);
   const clickX=size.x+size.width*.5,clickY=size.y+size.height*.68;
   await page.mouse.move(clickX,clickY);await page.mouse.click(clickX,clickY,{delay:120});
   await child.waitForFunction(()=>getComputedStyle(document.querySelector('#title')).opacity==='0',null,{timeout:30000});
   verify('Physical mouse click starts original game',true,{x:clickX,y:clickY});
  }finally{await context.close()}
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,acceptDownloads:false,serviceWorkers:'block'});
  const mp=await mobile.newPage();
  try{
   const res=await mp.goto(viewer,{waitUntil:'domcontentloaded',timeout:45000});
   verify('Mobile viewer HTTP200',res.status()===200,res.status());
   const mf=mp.locator('#official-game');await mf.waitFor({state:'visible'});
   const box=await mf.boundingBox();verify('Mobile frame fits playable viewport',box.width>=340&&box.height>=390,box);
   const f=await (await mf.elementHandle()).contentFrame();
   await f.waitForLoadState('domcontentloaded',{timeout:60000});
   verify('Mobile frame hosts the same official game',(await f.title()).includes('雾锁山门'));
  }finally{await mobile.close()}
  verify('No top-level page exceptions',report.errors.length===0,report.errors);
 }finally{
  report.passed=report.checks.filter(c=>c.pass).length;report.failed=report.checks.length-report.passed;report.total=report.checks.length;
  fs.writeFileSync(path.join(output,'official-iframe-qa.json'),JSON.stringify(report,null,2));
  await browser.close();
 }
 console.log('OFFICIAL_EMBED_QA',JSON.stringify({passed:report.passed,total:report.total,errors:report.errors.length,failedRequests:report.failedRequests.length}));
 process.exit(report.failed?1:0);
})().catch(e=>{report.error=String(e.stack||e);fs.writeFileSync(path.join(output,'official-iframe-qa.json'),JSON.stringify(report,null,2));console.error('OFFICIAL_EMBED_QA_FAILED',report.error);process.exit(1)});

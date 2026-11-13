const {chromium}=require('playwright-core');
const fs=require('fs'),path=require('path');
const file='C:\\QS3D-QA\\guizang\\full-playthrough-result.json';
(async()=>{
 const browser=await chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9222',{timeout:25000});
 const context=await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:false,serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 let report={at:new Date().toISOString(),testedUrl:process.env.GAME_URL||'https://guizang.qs3d.site/',mode:'unknown',waves:[],samples:[],error:[],success:false};
 try{
  await page.goto(report.testedUrl,{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>document.documentElement.dataset.ready==='true',{timeout:40000});
  await page.click('#play');
  let wave=-1,waveStart=0,started=Date.now(),lastSample=0,lastAttack=0;
  while(Date.now()-started<130000){
   let s=await page.evaluate(()=>window.__qs3dGame.snapshot());
   if(s.wave!==wave){wave=s.wave;waveStart=Date.now();report.waves.push({wave,whenMs:Date.now()-started,kills:s.kills,health:s.health});console.log('WAVE',JSON.stringify(s))}
   if(s.mode==='victory'||s.mode==='defeat'){report.success=s.mode==='victory';report.mode=s.mode;report.final=s;break}
   const age=(Date.now()-waveStart)/1000;
   // Skills and sword attacks use the SAME exposed controls as the public user-facing buttons.
   if(age>4){
     if(s.health<=65&&s.mana>=30)await page.evaluate(()=>window.__qs3dGame.action('f'));
     else if(s.mana>=65&&age>6)await page.evaluate(()=>window.__qs3dGame.action('e'));
     else if(s.mana>=22&&age>5)await page.evaluate(()=>window.__qs3dGame.action('q'));
     if(Date.now()-lastAttack>400){await page.evaluate(()=>window.__qs3dGame.action('attack'));lastAttack=Date.now()}
   }
   if(s.health<30&&s.mana<30&&age>7)await page.evaluate(()=>window.__qs3dGame.action('dodge'));
   if(Date.now()-lastSample>5000){lastSample=Date.now();report.samples.push({seconds:Math.round((Date.now()-started)/1000),...s});console.log('SAMPLE',JSON.stringify(s))}
   await page.waitForTimeout(280);
  }
  if(report.mode==='unknown'){report.mode='timeout';report.final=await page.evaluate(()=>window.__qs3dGame.snapshot())}
  await page.screenshot({path:'C:\\QS3D-QA\\guizang\\full-playthrough-final.png',timeout:20000});
  report.error=errors;
 }finally{fs.writeFileSync(file,JSON.stringify(report,null,2));try{await context.close()}catch{}}
 console.log('FULL_GAMEPLAY_RESULT',JSON.stringify(report));
 process.exitCode=report.success?0:2;
})().catch(e=>{console.error('PLAYTHROUGH_ERROR',String(e));process.exitCode=1});

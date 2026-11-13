const {chromium}=require('playwright-core');
const fs=require('fs');
const path=require('path');
const assert=require('assert/strict');
const dir=process.env.QA_OUT_DIR||path.join(__dirname,'..','qa-out');fs.mkdirSync(dir,{recursive:true});
const report={at:new Date().toISOString(),url:process.env.GAME_URL||'https://guizang.qs3d.site/',tests:[],errors:[],responses:[]};
function ok(name,condition,info=''){report.tests.push({name,pass:!!condition,info});if(!condition)throw new Error('TEST_FAIL '+name+' '+info);}
async function main(){
 const browser=await chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9222',{timeout:20000});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,acceptDownloads:false,serviceWorkers:'block'});
 const p=await ctx.newPage();
 p.on('pageerror',e=>report.errors.push(String(e).slice(0,400)));
 p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text().slice(0,400))});
 p.on('response',r=>{if(r.status()>=400)report.responses.push(r.status()+' '+r.url())});
 try{
  const response=await p.goto(report.url,{waitUntil:'domcontentloaded',timeout:30000});
  ok('HTTP homepage',response.status()===200,''+response.status());
  await p.waitForFunction(()=>document.documentElement.dataset.ready==='true',{timeout:40000}).catch(()=>{});
  const boot=await p.evaluate(()=>({ready:document.documentElement.dataset.ready, api:!!window.__qs3dGame,canvas:document.querySelectorAll('canvas').length,game:window.__qs3dGame?.snapshot()}));
  report.boot=boot;ok('3D initialization',boot.ready==='true'&&boot.api&&boot.canvas===1,JSON.stringify(boot));
  ok('WebGL2',boot.game.webgl2,JSON.stringify(boot.game));
  await p.screenshot({path:path.join(dir,'original-public-intro.png'),timeout:20000});
  await p.click('#play'); await p.waitForTimeout(350);
  let state=await p.evaluate(()=>window.__qs3dGame.snapshot());
  ok('Start game, wave1, 3 foes',state.mode==='playing'&&state.wave===1&&state.enemies===3,JSON.stringify(state));
  const initial=state.z;
  await p.keyboard.down('w');await p.waitForTimeout(850);await p.keyboard.up('w');
  state=await p.evaluate(()=>window.__qs3dGame.snapshot());
  ok('W moves player in 3D',state.z<initial-1,JSON.stringify({initial,after:state.z}));
  await p.mouse.click(720,450);await p.waitForTimeout(450);
  state=await p.evaluate(()=>window.__qs3dGame.snapshot());
  ok('Sword attack',state.attacks>=1,JSON.stringify(state));
  await p.keyboard.press('Space');await p.waitForTimeout(300);
  state=await p.evaluate(()=>window.__qs3dGame.snapshot());
  ok('Dodge movement',state.dodges>=1,JSON.stringify(state));
  const mana=state.mana;
  await p.keyboard.press('q');await p.waitForTimeout(300);
  state=await p.evaluate(()=>window.__qs3dGame.snapshot());
  ok('Sword wave consumes mana',state.mana<mana-15,JSON.stringify({before:mana,after:state.mana}));
  await p.screenshot({path:path.join(dir,'original-public-arena.png'),timeout:20000});
  // Check non-adjacent playback across multiple frames; require game to remain responsive.
  await p.waitForTimeout(2000);
  state=await p.evaluate(()=>window.__qs3dGame.snapshot());
  ok('Gameplay render loop active',state.mode==='playing'&&state.health>0,JSON.stringify(state));
  ok('No fatal browser errors',report.errors.length===0,report.errors.join(' | '));
  ok('No failed app HTTP responses',report.responses.filter(x=>!x.includes('fonts.')).length===0,report.responses.join(' | '));
  await ctx.close();
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true,acceptDownloads:false});
  const m=await mobile.newPage();
  m.on('pageerror',e=>report.errors.push('mobile: '+String(e).slice(0,400)));
  try{
   await m.goto(report.url,{waitUntil:'domcontentloaded',timeout:30000});
   await m.waitForFunction(()=>document.documentElement.dataset.ready==='true',{timeout:40000});
   const controls=await m.locator('.mobile-ui').evaluate(el=>getComputedStyle(el).display);
   ok('Mobile UI visible',controls==='flex','display='+controls);
   await m.click('#play');await m.waitForTimeout(250);
   await m.locator('[data-act="attack"]').tap();await m.waitForTimeout(180);
   const ms=await m.evaluate(()=>window.__qs3dGame.snapshot());
   ok('Mobile attack touch',ms.mode==='playing'&&ms.attacks>=1,JSON.stringify(ms));
   await m.screenshot({path:path.join(dir,'original-public-mobile.png'),timeout:20000});
  }finally{await mobile.close()}
 }finally{
  report.total=report.tests.length;report.passed=report.tests.filter(x=>x.pass).length;report.failed=report.total-report.passed;
  fs.writeFileSync(path.join(dir,'original-public-qa-report.json'),JSON.stringify(report,null,2));
  try{await ctx.close()}catch{}
 }
 console.log('QA_FINAL',JSON.stringify(report));process.exit(report.failed?1:0);
}
main().catch(e=>{console.error('QA_FAILURE',e.stack||String(e));process.exitCode=1;});

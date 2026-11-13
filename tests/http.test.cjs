'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const app=require('../server.cjs');
let address;
test.before(async()=>{await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));address='http://127.0.0.1:'+app.address().port});
test.after(async()=>{await new Promise(resolve=>app.close(resolve))});
test('healthz is reachable and metadata identifies QS3D game service',async()=>{
 const r=await fetch(address+'/healthz');assert.equal(r.status,200);
 const j=await r.json();assert.equal(j.ok,true);assert.equal(j.service,'qs3d-suong-son');
});
test('root now opens official author-hosted Mist-Locked Gate iframe',async()=>{
 const r=await fetch(address+'/');assert.equal(r.status,200);
 const html=await r.text();assert.match(html,/Chơi 雾锁山门/);
 assert.match(html,/<iframe[^>]+id="official-game"/);
 assert.match(html,/src="https:\/\/op7418\.github\.io\/guizang-game-skill\/"/);
 assert.match(html,/© 2026 Guizang/);
 assert.match(html,/href="\/suong-son"/);
});
test('index.html and play-original are aliases of the official viewer',async()=>{
 const root=await(await fetch(address+'/')).text();
 for(const u of ['/index.html','/play-original']){
  const r=await fetch(address+u);assert.equal(r.status,200,u);
  assert.equal(await r.text(),root,u);
 }
});
test('independently developed Sương Sơn stays playable at dedicated route',async()=>{
 for(const u of ['/suong-son','/suong-son/']){
  const r=await fetch(address+u);assert.equal(r.status,200);
  const t=await r.text();assert.match(t,/SƯƠNG SƠN/);assert.match(t,/Không sao chép tài nguyên/);assert.match(t,/game\.js/);
  assert.match(t,/href="\/play-original"/);
 }
});
test('static graphics, original wrapper CSS and game script use correct MIME types',async()=>{
 for(const [f,c] of [['/game.js','text/javascript'],['/style.css','text/css'],['/vendor/three.module.js','text/javascript'],['/favicon.svg','image/svg+xml'],['/official-frame.css','text/css']]){
  const r=await fetch(address+f);assert.equal(r.status,200,f);
  assert.ok(r.headers.get('content-type').startsWith(c),f);
 }
});
test('security headers restrict MIME sniffing and allow only official iframe origin',async()=>{
 const r=await fetch(address+'/');
 assert.equal(r.headers.get('x-frame-options'),'DENY');
 assert.equal(r.headers.get('x-content-type-options'),'nosniff');
 const csp=r.headers.get('content-security-policy');
 assert.match(csp,/frame-ancestors 'none'/);
 assert.match(csp,/frame-src https:\/\/op7418\.github\.io/);
});
test('only allowlisted static routes; never expose server, package or .git',async()=>{
 for(const f of ['/package.json','/.git/config','/server.cjs','/invalid.js','/vendor/../server.cjs']){
  const r=await fetch(address+f);assert.equal(r.status,404,f);
 }
});
test('reject suspicious traversal and invalid path encoding',async()=>{
 for(const f of ['/%2e%2e/server.cjs','/%5cserver.cjs','/%E0%A4%A']){
  const r=await fetch(address+f);assert.ok([400,404].includes(r.status),f);
 }
});
test('HEAD is bodyless and reports correct status',async()=>{
 for(const f of ['/','/index.html','/suong-son','/play-original']){
  const r=await fetch(address+f,{method:'HEAD'});assert.equal(r.status,200,f);assert.equal(await r.text(),'',f);
 }
});
test('unsafe methods are rejected, including against the redirect',async()=>{
 for(const f of ['/','/original','/suong-son']){
  const r=await fetch(address+f,{method:'POST',redirect:'manual'});assert.equal(r.status,405,f);
 }
});
test('fallback redirects directly to author-hosted original with no rehosting',async()=>{
 const r=await fetch(address+'/original',{redirect:'manual'});
 assert.equal(r.status,302);
 assert.equal(r.headers.get('location'),'https://op7418.github.io/guizang-game-skill/');
 const head=await fetch(address+'/original',{method:'HEAD',redirect:'manual'});
 assert.equal(head.status,302);
 assert.equal(await head.text(),'');
});
test('original wrapper provides creator attribution, external play link, and mobile viewport',async()=>{
 const r=await fetch(address+'/');const html=await r.text();
 assert.match(html,/<meta name="viewport"/);
 assert.match(html,/歸藏/);
 assert.match(html,/href="https:\/\/op7418\.github\.io\/guizang-game-skill\/"/);
 assert.match(html,/href="\/suong-son"/);
 assert.match(html,/allowfullscreen/);
});

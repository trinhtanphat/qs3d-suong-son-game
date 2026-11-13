const test=require('node:test');
const assert=require('node:assert/strict');
const app=require('../server.cjs');
let address;
test.before(async()=>{await new Promise(r=>app.listen(0,'127.0.0.1',r));address='http://127.0.0.1:'+app.address().port;});
test.after(async()=>{await new Promise(r=>app.close(r));});
test('healthz identifies original game',async()=>{const r=await fetch(address+'/healthz');assert.equal(r.status,200);const j=await r.json();assert.equal(j.ok,true);assert.equal(j.mode,'original-3d-game')});
test('home renders game and declares independent source',async()=>{const r=await fetch(address+'/');assert.equal(r.status,200);const t=await r.text();assert.match(t,/SƯƠNG SƠN/);assert.match(t,/Không sao chép tài nguyên/);assert.match(t,/game\.js/)});
test('entry files are served with proper type',async()=>{for(const [f,c]of[['/game.js','text/javascript'],['/style.css','text/css'],['/vendor/three.module.js','text/javascript'],['/favicon.svg','image/svg+xml']]){const r=await fetch(address+f);assert.equal(r.status,200,f);assert.ok(r.headers.get('content-type').startsWith(c),f)}});
test('headers restrict framing and MIME sniffing',async()=>{const r=await fetch(address+'/');assert.equal(r.headers.get('x-frame-options'),'DENY');assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/)});
test('unknown paths and accidental sensitive files are 404',async()=>{for(const f of ['/package.json','/.git/config','/server.cjs','/invalid.js','/vendor/../server.cjs']){const r=await fetch(address+f);assert.equal(r.status,404,f)}});
test('path traversal and malformed URLs blocked',async()=>{for(const f of ['/%2e%2e/server.cjs','/%5cserver.cjs','/%E0%A4%A']){const r=await fetch(address+f);assert.ok([400,404].includes(r.status),f)}});
test('HEAD does not include body',async()=>{const r=await fetch(address+'/index.html',{method:'HEAD'});assert.equal(r.status,200);assert.equal(await r.text(),'')});
test('disallow unsafe methods',async()=>{const r=await fetch(address+'/',{method:'POST'});assert.equal(r.status,405)});

test('official original link is explicit and redirects only on GET/HEAD',async()=>{
 const link=await fetch(address+'/original',{redirect:'manual'});
 assert.equal(link.status,302);
 assert.equal(link.headers.get('location'),'https://op7418.github.io/guizang-game-skill/');
 const html=await (await fetch(address+'/')).text();
 assert.match(html,/href="\/original"/);
 assert.match(html,/CHƠI GAME GỐC/);
 const head=await fetch(address+'/original',{method:'HEAD',redirect:'manual'});
 assert.equal(head.status,302);
 assert.equal(await head.text(),'');
 const denied=await fetch(address+'/original',{method:'POST',redirect:'manual'});
 assert.equal(denied.status,405);
});

test('embedded official game uses original host and does not rehost assets',async()=>{
 const page=await fetch(address+'/play-original',{redirect:'manual'});
 assert.equal(page.status,200);
 const body=await page.text();
 assert.match(body,/<iframe[^>]+id="official-game"/);
 assert.match(body,/src="https:\/\/op7418\.github\.io\/guizang-game-skill\/"/);
 assert.match(body,/© 2026 Guizang/);
 assert.match(page.headers.get('content-security-policy'),/frame-src https:\/\/op7418\.github\.io/);
 const css=await fetch(address+'/official-frame.css');
 assert.equal(css.status,200);
 assert.ok(css.headers.get('content-type').startsWith('text/css'));
 const home=await (await fetch(address+'/')).text();
 assert.match(home,/href="\/play-original"/);
 const legacy=await fetch(address+'/original',{redirect:'manual'});
 assert.equal(legacy.status,302);
 assert.equal(legacy.headers.get('location'),'https://op7418.github.io/guizang-game-skill/');
});

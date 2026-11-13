'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const PORT=Number(process.env.PORT||5400), HOST=process.env.HOST||'127.0.0.1';
const root=__dirname; const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
const headers={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(),microphone=(),geolocation=()','Cross-Origin-Resource-Policy':'same-origin'};
const app=http.createServer((req,res)=>{
  const route=(req.url||'/').split('?')[0];
  if(route==='/healthz'){res.writeHead(200,{...headers,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify({ok:true,service:'qs3d-suong-son',mode:'original-3d-game'}));}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,headers);return res.end();}
  if(route==='/original'){res.writeHead(302,{...headers,'Location':'https://op7418.github.io/guizang-game-skill/','Cache-Control':'no-store','Content-Type':'text/plain; charset=utf-8'});return res.end('Official playable original by Guizang');}
  let url;try{url=decodeURIComponent(route)}catch{res.writeHead(400,headers);return res.end();}
  if(url.includes('\0')||url.split('/').includes('..')||url.includes('\\')){res.writeHead(400,headers);return res.end();}
  if(url==='/'||url==='/index.html')url='/index.html';
  const allow=new Set(['/index.html','/style.css','/game.js','/vendor/three.module.js','/robots.txt','/favicon.svg']);
  if(!allow.has(url)){res.writeHead(404,headers);return res.end('Not Found');}
  const file=path.join(root,url.slice(1));
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404,headers);return res.end('Not Found');}
    const extension=path.extname(file);
    res.writeHead(200,{...headers,'Content-Type':types[extension]||'application/octet-stream','Cache-Control':extension==='.js'?'public,max-age=600':'no-cache','Content-Length':stat.size,'Content-Security-Policy':"default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests"});
    if(req.method==='HEAD')return res.end();
    fs.createReadStream(file).pipe(res);
  });
});
if(require.main===module)app.listen(PORT,HOST,()=>console.log('SUONG_SON_READY '+HOST+':'+PORT));
module.exports=app;

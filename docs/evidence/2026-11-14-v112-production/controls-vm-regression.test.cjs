'use strict';
// Executes the published viewer controller in a minimal deterministic DOM harness.
// This does NOT substitute for real-browser Chromium QA.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const script=fs.readFileSync(path.resolve(__dirname,'../../../official-controls.js'),'utf8');
const source='https://op7418.github.io/guizang-game-skill/';
function harness(opts={}){
 const elements={},timeouts=new Map(),store=new Map(),windowHandlers={};
 let seq=1,srcWrites=0,focused=0,confirmCalls=0;
 if(opts.stored!==undefined)store.set('qs3d.guizang.viewer.focus.v1',opts.stored);
 function emitter(){
  const handlers={};
  return {hidden:false,textContent:'',attributes:{},handlers,
    addEventListener(event,fn){(handlers[event]??=[]).push(fn)},
    async emit(event){for(const fn of handlers[event]||[])await fn()},
    setAttribute(key,value){this.attributes[key]=String(value)},
    getAttribute(key){return this.attributes[key]},
    focus(){focused++},
    querySelector(){return emitter()}
  };
 }
 const active=new Set();
 const body={classList:{
  toggle(x,val){if(val===undefined){val=!active.has(x)}val?active.add(x):active.delete(x);return val},
  contains(x){return active.has(x)}
 }};
 for(const id of ['official-game','frame-status','slow-panel','reload-game','reload-confirm',
   'cancel-reload','confirm-reload','focus-toggle','fullscreen-toggle','help-toggle','help-panel']){
  elements[id]=emitter();
 }
 elements['help-panel'].hidden=true; // Match the original HTML hidden attribute.
 const frame=elements['official-game'];
 let currentSrc=source;
 Object.defineProperty(frame,'src',{get(){return currentSrc},set(v){srcWrites++;currentSrc=v}});
 const dialog=elements['reload-confirm'];
 dialog.open=false;
 dialog.showModal=()=>{dialog.open=true};
 dialog.close=()=>{dialog.open=false};
 if(opts.noDialog)dialog.showModal=undefined;
 const nav={onLine:opts.offline!==true};
 const doc={body,getElementById(id){return elements[id]},fullscreenElement:null,
  documentElement:{requestFullscreen:async()=>{throw Error('Denied in test')}},
  addEventListener(){}};
 const storage={
  getItem(k){if(opts.deniedStorage)throw Error('Storage unavailable');return store.get(k)||null},
  setItem(k,v){if(opts.deniedStorage)throw Error('Storage unavailable');store.set(k,String(v))}
 };
 const win={localStorage:storage,confirm(){confirmCalls++;return opts.fallbackConfirm===true},
  addEventListener(n,fn){(windowHandlers[n]??=[]).push(fn)},
  async emit(n){for(const fn of windowHandlers[n]||[])await fn()}
 };
 const context={document:doc,window:win,navigator:nav,
  setTimeout(fn,ms){const id=seq++;timeouts.set(id,{fn,ms});return id},
  clearTimeout(id){timeouts.delete(id)},console};
 vm.runInNewContext(script,context,{filename:'official-controls.js',timeout:2000});
 return {elements,body,store,doc,nav,win,frame,dialog,timeouts,
  writes:()=>srcWrites,focused:()=>focused,confirms:()=>confirmCalls,
  async fire(ms){const batch=[...timeouts.entries()].filter(([,t])=>t.ms<=ms);
    for(const [id,t] of batch){if(timeouts.has(id)){timeouts.delete(id);await t.fn()}}}
 };
}
test('initial state retains direct author URL and loading UI',()=>{
 const x=harness();assert.equal(x.frame.src,source);assert.equal(x.writes(),0);
 assert.match(x.elements['frame-status'].textContent,/Đang mở/);
 assert.equal(x.elements['slow-panel'].hidden,true);
});
test('Cancel confirmation never destroys game progress',async()=>{
 const x=harness();await x.elements['reload-game'].emit('click');
 assert.equal(x.dialog.open,true);assert.equal(x.writes(),0);
 await x.elements['cancel-reload'].emit('click');
 assert.equal(x.dialog.open,false);assert.equal(x.writes(),0);
});
test('Confirmed reload is explicit and focuses the game frame',async()=>{
 const x=harness();await x.elements['reload-game'].emit('click');
 await x.elements['confirm-reload'].emit('click');
 assert.equal(x.dialog.open,false);assert.equal(x.writes(),1);
 assert.equal(x.frame.src,source);assert.equal(x.focused()>=1,true);
});
test('Offline banner persists while connection is absent',async()=>{
 const x=harness();x.nav.onLine=false;await x.win.emit('offline');
 assert.match(x.elements['frame-status'].textContent,/ngoại tuyến/);
 assert.equal(x.elements['slow-panel'].hidden,false);
 await x.frame.emit('load');assert.match(x.elements['frame-status'].textContent,/ngoại tuyến/);
 assert.equal(x.writes(),0);
});
test('Reconnection does not reload game, and banner expires',async()=>{
 const x=harness();x.nav.onLine=false;await x.win.emit('offline');
 x.nav.onLine=true;await x.win.emit('online');
 assert.match(x.elements['frame-status'].textContent,/phục hồi/);
 assert.equal(x.writes(),0);assert.equal(x.elements['slow-panel'].hidden,true);
 await x.fire(12000);assert.equal(x.elements['frame-status'].hidden,true);
});
test('Frame-load feedback hides automatically but retains frame',async()=>{
 const x=harness();await x.frame.emit('load');
 assert.match(x.elements['frame-status'].textContent,/Khung nguồn/);
 await x.fire(4800);assert.equal(x.elements['frame-status'].hidden,true);
 assert.equal(x.writes(),0);
});
test('Slow loading shows recovery options only after 18 seconds',async()=>{
 const x=harness();await x.fire(17999);
 assert.equal(x.elements['slow-panel'].hidden,true);
 await x.fire(18000);assert.equal(x.elements['slow-panel'].hidden,false);
 assert.match(x.elements['frame-status'].textContent,/lâu hơn dự kiến/);
});
test('Stored focus state loads and can be toggled persistently',async()=>{
 const x=harness({stored:'1'});
 assert.equal(x.body.classList.contains('focus-mode'),true);
 assert.equal(x.elements['focus-toggle'].getAttribute('aria-pressed'),'true');
 await x.elements['focus-toggle'].emit('click');
 assert.equal(x.body.classList.contains('focus-mode'),false);
 assert.equal(x.store.get('qs3d.guizang.viewer.focus.v1'),'0');
});
test('Denied local storage still allows focus toggle',async()=>{
 const x=harness({deniedStorage:true});assert.equal(x.body.classList.contains('focus-mode'),false);
 await x.elements['focus-toggle'].emit('click');
 assert.equal(x.body.classList.contains('focus-mode'),true);
});
test('Fallback confirmation never reloads on No',async()=>{
 const x=harness({noDialog:true,fallbackConfirm:false});
 await x.elements['reload-game'].emit('click');
 assert.equal(x.confirms(),1);assert.equal(x.writes(),0);
});
test('Fallback confirmation reloads only when Yes',async()=>{
 const x=harness({noDialog:true,fallbackConfirm:true});
 await x.elements['reload-game'].emit('click');
 assert.equal(x.confirms(),1);assert.equal(x.writes(),1);
});
test('Help panel updates aria-expanded reversibly',async()=>{
 const x=harness();await x.elements['help-toggle'].emit('click');
 assert.equal(x.elements['help-panel'].hidden,false);
 assert.equal(x.elements['help-toggle'].getAttribute('aria-expanded'),'true');
 await x.elements['help-toggle'].emit('click');
 assert.equal(x.elements['help-panel'].hidden,true);
 assert.equal(x.elements['help-toggle'].getAttribute('aria-expanded'),'false');
});
test('Fullscreen unsupported feedback does not reload frame',async()=>{
 const x=harness();await x.elements['fullscreen-toggle'].emit('click');
 assert.match(x.elements['frame-status'].textContent,/không cho phép toàn màn hình/);
 assert.equal(x.writes(),0);
 await x.fire(10000);assert.equal(x.elements['frame-status'].hidden,true);
});

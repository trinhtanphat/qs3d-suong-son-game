import * as THREE from './vendor/three.module.js';

const $=s=>document.querySelector(s);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const rand=(a,b)=>a+Math.random()*(b-a);
const v=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const ui={intro:$('#intro'),result:$('#result'),hud:$('#hud'),play:$('#play'),again:$('#again'),toast:$('#toast'),wave:$('#wave-label'),hp:$('#health-bar'),hpLabel:$('#health-label'),stamina:$('#stamina-bar'),mana:$('#mana-bar'),enemies:$('#enemies-label'),score:$('#score-label'),bossHud:$('#boss-hud'),bossBar:$('#boss-bar'),resultTitle:$('#result-heading'),resultOverline:$('#result-overline'),resultText:$('#result-description'),resultScore:$('#result-score')};
const game={mode:'intro',wave:0,kills:0,score:0,health:100,stamina:100,mana:70,remaining:0,time:0,attacks:0,blocks:0,dodges:0,hits:0,invuln:0,attackCD:0,skillCD:0,dodgeCD:0,combo:0,nextWave:0,shake:0};
const input={keys:new Set(),block:false,touch:new Set()};
const foes=[],effects=[],decor=[];
let scene,camera,renderer,hero,heroSword,bladeGlow,snow,particles;
let soundCtx=null,clock=performance.now(),toastUntil=0,sceneTime=0;
const palette={stone:0x718b93,white:0xe7f0f0,gold:0xe7bb77,red:0xb24c5a,blue:0x6bd8e2};

function tone(freq=420,len=.08,type='sine',volume=.045){
 try{
  soundCtx=soundCtx||new (window.AudioContext||window.webkitAudioContext)();
  if(soundCtx.state==='suspended')soundCtx.resume();
  const osc=soundCtx.createOscillator(),gain=soundCtx.createGain(),t=soundCtx.currentTime;
  osc.type=type;osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.72),t+len);
  gain.gain.setValueAtTime(volume,t);gain.gain.exponentialRampToValueAtTime(.001,t+len);
  osc.connect(gain);gain.connect(soundCtx.destination);osc.start(t);osc.stop(t+len+.01);
 }catch{}
}
function showToast(message,duration=1.6){
 ui.toast.textContent=message;ui.toast.classList.add('show');toastUntil=performance.now()+duration*1000;
}
function mesh(g,c,materialProps={}){
 return new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:c,roughness:.83,metalness:.06,...materialProps}));
}
function cylinder(r1,r2,h,c,segments=8){return mesh(new THREE.CylinderGeometry(r1,r2,h,segments),c)}
function cube(w,h,d,c){return mesh(new THREE.BoxGeometry(w,h,d),c)}
function sphere(r,c,segments=12){return mesh(new THREE.SphereGeometry(r,segments,8),c)}
function addTo(parent,object,x=0,y=0,z=0){object.position.set(x,y,z);parent.add(object);return object}
function randomSeeded(i){let x=Math.sin(i*14.927+47.29)*43758.5453;return x-Math.floor(x)}
function createSky(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x142438);scene.fog=new THREE.FogExp2(0x1a3547,.021);
 camera=new THREE.PerspectiveCamera(56,innerWidth/innerHeight,.1,350);
 scene.add(new THREE.HemisphereLight(0xd4eeff,0x253141,2.2));
 const sun=new THREE.DirectionalLight(0xffe0ab,3.1);sun.position.set(-21,45,-32);scene.add(sun);
 const moon=new THREE.DirectionalLight(0x71caff,1.2);moon.position.set(28,25,34);scene.add(moon);
 const base=cylinder(24.7,25.2,1.2,0x53636d,64);base.position.y=-.7;scene.add(base);
 const floor=cylinder(23.6,24.25,.33,0xc3d5d9,64);floor.position.y=-.04;scene.add(floor);
 const inner=cylinder(18.8,18.8,.04,0xd2e1e1,64);inner.position.y=.15;scene.add(inner);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(19.2,.20,8,80),new THREE.MeshStandardMaterial({color:0x9ba6a1,metalness:.4,roughness:.5}));ring.rotation.x=Math.PI/2;ring.position.y=.23;scene.add(ring);
 for(let i=0;i<80;i++){
   const a=i*Math.PI*2/80,r=20.2+randomSeeded(i)*3;
   const rock=mesh(new THREE.DodecahedronGeometry(.45+randomSeeded(i+31)*.85,0),randomSeeded(i+4)>.4?0x788b94:0xa1aeb4);
   rock.position.set(Math.cos(a)*r,.13,Math.sin(a)*r);rock.rotation.set(i*.1,i*.3,i*.4);scene.add(rock);
 }
 for(let i=0;i<32;i++){
  const angle=i*Math.PI*2/32+randomSeeded(i+86)*.2,dist=27+randomSeeded(i+5)*42;
  const m=mesh(new THREE.ConeGeometry(6+randomSeeded(i+15)*7,16+randomSeeded(i+44)*27,5),i%3?0x2a4251:0x3f5765,{flatShading:true});
  m.position.set(Math.cos(angle)*dist,4,Math.sin(angle)*dist);m.rotation.y=i;scene.add(m);
 }
 for(let i=0;i<34;i++){const a=i*2.399,dist=26+randomSeeded(i+13)*18; makePine(Math.cos(a)*dist,Math.sin(a)*dist,2+randomSeeded(i+44)*2.1)}
 makeTorii(0,-27);makeTorii(-27,0,Math.PI/2);makeTorii(26,0,-Math.PI/2);
 for(let i=0;i<12;i++){
 const a=i*Math.PI*2/12,rad=20.8;makeLantern(Math.cos(a)*rad,Math.sin(a)*rad);
 }
 const cloud=mesh(new THREE.SphereGeometry(190,20,12),0x20384b,{side:THREE.BackSide,transparent:true,opacity:.32});scene.add(cloud);
 const count=450,positions=new Float32Array(count*3);
 for(let i=0;i<count;i++){positions[i*3]=rand(-70,70);positions[i*3+1]=rand(.5,28);positions[i*3+2]=rand(-70,70);}
 particles=new THREE.BufferGeometry();particles.setAttribute('position',new THREE.BufferAttribute(positions,3));
 snow=new THREE.Points(particles,new THREE.PointsMaterial({color:0xe7f8ff,size:.13,transparent:true,opacity:.76,depthWrite:false}));
 scene.add(snow);
}
function makePine(x,z,scale=2){
 const trunk=cylinder(.13*scale,.20*scale,1.2*scale,0x4b4c46,6);addTo(scene,trunk,x,.6*scale,z);
 for(let j=0;j<3;j++){
  const cone=mesh(new THREE.ConeGeometry((1.1-j*.21)*scale,1.65*scale,6),j%2?0x344f4f:0x2e5552,{flatShading:true});
  cone.position.set(x,(1.25+j*.63)*scale,z);cone.rotation.y=j;scene.add(cone);
  const tip=mesh(new THREE.ConeGeometry((.87-j*.16)*scale,.20*scale,6),0xdfebee,{flatShading:true});
  tip.position.set(x,(2.08+j*.63)*scale,z);scene.add(tip);
 }
}
function makeLantern(x,z){
 const base=cylinder(.40,.5,.28,0x45515b);addTo(scene,base,x,.24,z);
 const post=cylinder(.12,.17,1.9,0x576369);addTo(scene,post,x,1.28,z);
 const cap=cube(.95,.12,.95,0x374b55);addTo(scene,cap,x,2.3,z);
 const light=cube(.54,.58,.54,0xffd299);light.material.emissive=new THREE.Color(0xd79854);light.material.emissiveIntensity=1.7;addTo(scene,light,x,1.97,z);
 const roof=mesh(new THREE.ConeGeometry(.75,.45,4),0x384b55);roof.rotation.y=Math.PI/4;addTo(scene,roof,x,2.58,z);
 if(Math.round(x+z)%2===0){const lamp=new THREE.PointLight(0xf9ad5c,5,8,2);lamp.position.set(x,2,z);scene.add(lamp)}
}
function makeTorii(x,z,rot=0){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;
 addTo(g,cube(.5,8,.5,0x8e4650),-3,4,0);
 addTo(g,cube(.5,8,.5,0x8e4650),3,4,0);
 addTo(g,cube(8.4,.52,.9,0x9e4c52),0,7.2,0);
 addTo(g,cube(9.4,.32,1.2,0x4a3944),0,7.65,0);
 addTo(g,cube(6.3,.26,.5,0xb46560),0,5.9,0);
 const symbol=cube(.9,1.25,.13,0xe5c68f);addTo(g,symbol,0,6.55,.45);
 scene.add(g);
}
function createCharacter(color=0x4f8198,boss=false){
 const scale=boss?1.45:1,g=new THREE.Group();g.scale.setScalar(scale);
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.74,14),new THREE.MeshBasicMaterial({color:0x0c1623,transparent:true,opacity:.28,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.y=.18;g.add(shadow);
 const robe=cylinder(.55,.85,1.55,color,8);robe.position.y=1.18;g.add(robe);
 const belt=cylinder(.57,.58,.2,boss?0x5d2435:0xc4a176,8);belt.position.y=1.35;g.add(belt);
 const chest=cube(.77,.5,.57,boss?0x392835:0xdce9e5);chest.position.set(0,1.93,-.01);g.add(chest);
 const neck=cylinder(.16,.20,.36,0xe9c2a5);neck.position.y=2.22;g.add(neck);
 const head=sphere(.36,boss?0xb7a9ba:0xe7c4a6);head.position.y=2.59;g.add(head);
 const hair=sphere(.38,boss?0x28212f:0x263744);hair.scale.set(1,.54,1);hair.position.y=2.84;g.add(hair);
 const pony=cylinder(.16,.10,.6,boss?0x29242d:0x2d3b43,5);pony.position.set(0,2.65,.35);g.add(pony);
 for(const side of [-1,1]){
  const arm=cylinder(.16,.22,1.0,boss?0x683a44:0x64889d,7);arm.position.set(side*.63,1.82,.0);arm.rotation.z=-side*.18;g.add(arm);
  const boot=cube(.32,.60,.43,boss?0x221e2c:0x344a58);boot.position.set(side*.31,.35,.05);g.add(boot);
 }
 const sword=new THREE.Group();
 const hilt=cylinder(.09,.11,.63,0x40312b,6);hilt.rotation.z=Math.PI/2;hilt.position.x=.22;sword.add(hilt);
 const blade=cube(1.5,.16,.11,boss?0xf58092:0xdff5ff);blade.position.x=1.18;blade.material.metalness=.78;blade.material.roughness=.21;sword.add(blade);
 const guard=cube(.14,.50,.27,0xe4bd76);guard.position.x=.52;sword.add(guard);
 sword.rotation.set(.2,0,-.48);sword.position.set(.78,1.91,-.12);g.add(sword);
 return{group:g,sword,scale};
}
function createWorld(){
 createSky();
 const c=createCharacter(0x477997);hero=c.group;heroSword=c.sword;scene.add(hero);
 hero.position.set(0,.2,3);
 heroSword.rotation.z=-.5;
 camera.position.set(9,12,18);camera.lookAt(0,1.3,0);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false});
 renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.14;
 $('#game').appendChild(renderer.domElement);
 addEventListener('resize',onResize);
 onResize();
}
function onResize(){
 if(!renderer)return;
 camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<760?65:56;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
}
function visualBurst(x,z,c=0x8ceeff,count=12,speed=6){
 for(let i=0;i<count;i++){
  const p=sphere(rand(.07,.15),c,5);p.material.emissive=new THREE.Color(c);p.material.emissiveIntensity=1.1;
  p.position.set(x,rand(.4,2.3),z);scene.add(p);
  const a=rand(0,Math.PI*2);effects.push({mesh:p,velocity:v(Math.sin(a)*rand(1,speed),rand(.8,4),Math.cos(a)*rand(1,speed)),life:rand(.2,.6),max:.6});
 }
}
function spawnEnemy(boss=false,i=0,count=3){
 const p=createCharacter(boss?0x693447:i%2?0x58666e:0x83545c,boss);
 const angle=i/count*Math.PI*2+1.6,rad=boss?13:rand(11,17);
 p.group.position.set(Math.sin(angle)*rad,.2,Math.cos(angle)*rad);
 scene.add(p.group);
 const e={...p,boss,hp:boss?240:65,maxhp:boss?240:65,speed:boss?2.6:1.6+rand(.1,.75),cooldown:rand(.7,2.0),windup:0,hurt:0,dead:false,attackAnim:0,phase:1};
 foes.push(e);
}
function spawnWave(n){
 game.wave=n;game.remaining=0;
 if(n===1){for(let i=0;i<3;i++)spawnEnemy(false,i,3);showToast('ẢI I · BĂNG LỘ KIẾM KHÁCH',2.2)}
 else if(n===2){for(let i=0;i<5;i++)spawnEnemy(false,i,5);game.health=clamp(game.health+22,0,100);showToast('ẢI II · HÀN PHONG VÂY HÃM',2.2)}
 else {spawnEnemy(true,0,1);showToast('ẢI III · HẮC ẢNH TRẤN SƠN',2.5)}
 game.remaining=foes.filter(e=>!e.dead).length;
 ui.bossHud.classList.toggle('hidden',n!==3);ui.wave.textContent='ẢI '+n+' / 3';
}
function removeFoes(){for(const e of foes)scene.remove(e.group);foes.length=0}
function startGame(){
 removeFoes();
 Object.assign(game,{mode:'playing',wave:0,kills:0,score:0,health:100,stamina:100,mana:75,remaining:0,time:0,attacks:0,blocks:0,dodges:0,hits:0,invuln:0,attackCD:0,skillCD:0,dodgeCD:0,combo:0,nextWave:0,shake:0});
 hero.position.set(0,.2,3);hero.rotation.y=Math.PI;input.keys.clear();input.touch.clear();input.block=false;
 ui.intro.classList.add('hidden');ui.result.classList.add('hidden');ui.hud.classList.remove('hidden');$('#crosshair').classList.remove('hidden');
 spawnWave(1);updateUI();tone(440,.3,'triangle',.05);
}
function endGame(victory){
 game.mode=victory?'victory':'defeat';ui.result.classList.remove('hidden');
 ui.resultOverline.textContent=victory?'CHIẾN THẮNG · TRẤN THỦ SƠN MÔN':'HÀNH TRÌNH CHƯA KẾT THÚC';
 ui.resultTitle.textContent=victory?'THẮNG TRẬN!':'THẤT THỦ';
 ui.resultText.textContent=victory?'Bạn đã đánh bại Hắc Ảnh và giữ vững Sương Sơn.':'Hãy thử kết hợp đỡ đòn, né tránh và kiếm khí để chiến thắng.';
 ui.resultScore.textContent= 'ĐIỂM '+String(game.score).padStart(4,'0')+' · HẠ '+game.kills+' ĐỊCH · '+Math.floor(game.time)+' GIÂY';
 $('#crosshair').classList.add('hidden');tone(victory?660:130,.6,'sine',.05);
}
function dieEnemy(e){
 if(e.dead)return;
 e.dead=true;e.hp=0;scene.remove(e.group);game.kills++;game.score+=e.boss?1000:150;
 game.mana=clamp(game.mana+12,0,100);game.remaining=Math.max(0,foes.filter(f=>!f.dead).length);
 visualBurst(e.group.position.x,e.group.position.z,e.boss?0xea7483:0x90d6e4,22);
 tone(180,.22,'sawtooth',.04);
 if(game.remaining===0){
  if(game.wave>=3){endGame(true)}
  else{game.nextWave=2.0;showToast('HOÀN THÀNH ẢI '+game.wave+' · +22 SINH LỰC',1.8)}
 }
}
function damageEnemy(e,n){
 if(e.dead)return;
 e.hp=Math.max(0,e.hp-n);e.hurt=.23;game.score+=Math.ceil(n/4);
 visualBurst(e.group.position.x,e.group.position.z,e.boss?0xff9eab:0x8ce7ff,6,4);
 if(e.hp<=0)dieEnemy(e);
 else if(e.boss&&e.hp<e.maxhp*.45&&e.phase===1){e.phase=2;e.speed=3.6;e.cooldown=.15;showToast('HẮC ẢNH · CUỒNG NỘ',2.2)}
}
function distance(e){return Math.hypot(e.group.position.x-hero.position.x,e.group.position.z-hero.position.z)}
function faceEnemy(e){const dx=e.group.position.x-hero.position.x,dz=e.group.position.z-hero.position.z;hero.rotation.y=Math.atan2(dx,dz)}
function actionAttack(){
 if(game.mode!=='playing'||game.attackCD>0||game.stamina<12||input.block)return;
 game.attacks++;game.stamina-=12;game.combo=(game.combo%3)+1;game.attackCD=game.combo===3?.48:.30;game.attackAnim=.30;heroSword.rotation.z=.5;
 const near=foes.filter(e=>!e.dead&&distance(e)<3.65).sort((a,b)=>distance(a)-distance(b));
 if(near[0])faceEnemy(near[0]);
 let count=0;
 for(const e of near){const dx=e.group.position.x-hero.position.x,dz=e.group.position.z-hero.position.z;const a=Math.atan2(dx,dz);if(Math.cos(a-hero.rotation.y)<-.2)continue;
 damageEnemy(e,game.combo===3?31:game.combo===2?22:19);count++;if(count>=2)break;}
 visualBurst(hero.position.x+Math.sin(hero.rotation.y)*1.5,hero.position.z+Math.cos(hero.rotation.y)*1.5,0xc4eaff,6,5);
 tone(game.combo===3?560:390,.12,'triangle',.045);
}
function actionDodge(){
 if(game.mode!=='playing'||game.dodgeCD>0||game.stamina<24)return;
 game.stamina-=24;game.dodges++;game.dodgeCD=.68;game.invuln=.42;
 const d=direction();
 if(d.lengthSq()<.01)d.set(Math.sin(hero.rotation.y),0,Math.cos(hero.rotation.y));else hero.rotation.y=Math.atan2(d.x,d.z);
 hero.position.addScaledVector(d.normalize(),4.25);limitHero();visualBurst(hero.position.x,hero.position.z,0xb4f5ff,12);
 tone(650,.13,'sine',.028);
}
function actionQ(){
 if(game.mode!=='playing'||game.mana<22||game.skillCD>0)return;
 game.mana-=22;game.skillCD=.75;game.attackCD=.18;
 const enemies=foes.filter(e=>!e.dead&&distance(e)<8.3);enemies.sort((a,b)=>distance(a)-distance(b));
 if(enemies[0])faceEnemy(enemies[0]);let count=0;
 for(const e of enemies){damageEnemy(e,34);count++;}
 visualBurst(hero.position.x,hero.position.z,0x65ddff,27,10);showToast('KIẾM KHÍ · '+count+' TRÚNG ĐÍCH',.9);tone(850,.3,'sawtooth',.05);
}
function actionF(){
 if(game.mode!=='playing'||game.mana<30||game.health>=100||game.skillCD>0)return;
 game.mana-=30;game.health=clamp(game.health+33,0,100);game.skillCD=.7;
 visualBurst(hero.position.x,hero.position.z,0x91e5bc,24);showToast('HỒI XUÂN · +33 SINH LỰC',1);
 tone(530,.35,'sine',.04);
}
function actionE(){
 if(game.mode!=='playing'||game.mana<65||game.skillCD>0)return;
 game.mana-=65;game.skillCD=1.5;game.invuln=.9;
 let count=0;for(const e of [...foes])if(!e.dead&&distance(e)<11.5){damageEnemy(e,75);count++}
 visualBurst(hero.position.x,hero.position.z,0xffc477,55,13);showToast('VẠN KIẾM QUY TÔNG · '+count+' TRÚNG ĐÍCH',1.5);tone(290,.65,'sawtooth',.09);game.shake=.35;
}
function direction(){
 let x=0,z=0;
 if(input.keys.has('a')||input.keys.has('arrowleft')||input.touch.has('left'))x-=1;
 if(input.keys.has('d')||input.keys.has('arrowright')||input.touch.has('right'))x+=1;
 if(input.keys.has('w')||input.keys.has('arrowup')||input.touch.has('up'))z-=1;
 if(input.keys.has('s')||input.keys.has('arrowdown')||input.touch.has('down'))z+=1;
 return v(x,0,z);
}
function limitHero(){const m=hero.position.length();const radius=Math.hypot(hero.position.x,hero.position.z);if(radius>18.1){hero.position.x*=18.1/radius;hero.position.z*=18.1/radius}}
function takeDamage(n){
 if(game.invuln>0||game.mode!=='playing')return;
 if(input.block&&game.stamina>4){game.stamina=clamp(game.stamina-n*.55,0,100);n=Math.ceil(n*.19);game.blocks++;}
 game.health=clamp(game.health-n,0,100);game.hits++;game.shake=.16;visualBurst(hero.position.x,hero.position.z,0xff8392,8,5);
 tone(105,.16,'sawtooth',.055);
 if(game.health<=0)endGame(false);
}
function updateEnemies(dt){
 for(const e of foes){
  if(e.dead)continue;
  const p=e.group.position,dx=hero.position.x-p.x,dz=hero.position.z-p.z,dist=Math.hypot(dx,dz),safe=Math.max(.001,dist);
  e.group.rotation.y=Math.atan2(dx,dz);
  e.hurt=Math.max(0,e.hurt-dt);e.cooldown-=dt;
  if(e.windup>0){e.windup-=dt;e.sword.rotation.z=Math.sin(sceneTime*23)*.5;
   if(e.windup<=0){e.sword.rotation.z=-.4;if(distance(e)<(e.boss?3.8:2.8))takeDamage(e.boss?(e.phase===2?23:17):11);e.cooldown=e.boss?(e.phase===2?.65:1.25):rand(1.3,2.2)}
  }else if(dist> (e.boss?2.65:2.15)){
   p.x+=dx/safe*e.speed*dt;p.z+=dz/safe*e.speed*dt;
   p.x=clamp(p.x,-19,19);p.z=clamp(p.z,-19,19);
  }else if(e.cooldown<=0){e.windup=e.boss?.68:.62;e.sword.rotation.z=.5;visualBurst(p.x,p.z,0xf2a2af,5,2)}
  e.group.position.y=.2+Math.sin(sceneTime*2.5+e.speed)*.035;
  if(e.hurt>0){e.group.scale.setScalar(e.scale*(1+e.hurt*.13))}else e.group.scale.setScalar(e.scale);
 }
}
function updateEffects(dt){
 for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;e.mesh.position.addScaledVector(e.velocity,dt);e.velocity.y-=9*dt;e.mesh.scale.setScalar(clamp(e.life/e.max,0,1));if(e.life<=0){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();effects.splice(i,1)}}
}
function updateUI(){
 ui.hp.style.width=game.health+'%';ui.hpLabel.textContent=Math.ceil(game.health)+' / 100';
 ui.stamina.style.width=clamp(game.stamina,0,100)+'%';ui.mana.style.width=clamp(game.mana,0,100)+'%';
 ui.enemies.textContent=game.remaining+' KẺ ĐỊCH';ui.score.textContent='ĐIỂM '+String(game.score).padStart(4,'0');
 const boss=foes.find(f=>f.boss&&!f.dead);if(boss)ui.bossBar.style.width=100*boss.hp/boss.maxhp+'%';
}
function update(dt){
 sceneTime+=dt;
 if(performance.now()>toastUntil)ui.toast.classList.remove('show');
 const pos=particles.attributes.position;
 for(let i=0;i<pos.count;i++){let y=pos.getY(i)-dt*(1.3+i%5*.35);if(y<.2)y=28;pos.setY(i,y);let x=pos.getX(i)+dt*.4;if(x>70)x=-70;pos.setX(i,x)}pos.needsUpdate=true;
 if(game.mode==='playing'){
  game.time+=dt;game.attackCD=Math.max(0,game.attackCD-dt);game.skillCD=Math.max(0,game.skillCD-dt);game.dodgeCD=Math.max(0,game.dodgeCD-dt);game.invuln=Math.max(0,game.invuln-dt);game.shake=Math.max(0,game.shake-dt);
  game.stamina=clamp(game.stamina+dt*(input.block?5:17),0,100);
  game.mana=clamp(game.mana+dt*1.4,0,100);
  const d=direction();if(d.lengthSq()>.1){d.normalize();hero.position.addScaledVector(d,dt*(input.block?2.2:5.7));hero.rotation.y=Math.atan2(d.x,d.z);limitHero();}
  hero.position.y=.2+Math.sin(sceneTime*8)*.022;
  heroSword.rotation.z=THREE.MathUtils.lerp(heroSword.rotation.z,game.attackCD>0?.75:-.5,clamp(dt*13,0,1));
  updateEnemies(dt);
  if(game.nextWave>0){game.nextWave-=dt;if(game.nextWave<=0)spawnWave(game.wave+1)}
  updateUI();
 }
 updateEffects(dt);
 const k=innerWidth<760?1.17:1;
 const desired=v(hero.position.x+10*k,10*k,hero.position.z+15*k);
 if(game.shake>0)desired.add(v(rand(-.2,.2),rand(-.1,.1),rand(-.2,.2)));
 camera.position.lerp(desired,clamp(dt*2.8,0,1));camera.lookAt(hero.position.x,1.3,hero.position.z);
 renderer.render(scene,camera);
}
function tick(now){
 const dt=clamp((now-clock)/1000,0,.05);clock=now;
 if(renderer)update(dt);
 requestAnimationFrame(tick);
}
const actionMap={attack:actionAttack,dodge:actionDodge,q:actionQ,f:actionF,e:actionE};
function setupControls(){
 ui.play.addEventListener('click',startGame);ui.again.addEventListener('click',startGame);
 addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key))e.preventDefault();
  input.keys.add(key);
  if(e.repeat)return;
  if(key===' '){actionDodge()}
  else if(key==='q')actionQ();else if(key==='f')actionF();else if(key==='e')actionE();
  else if(key==='j')actionAttack();else if(key==='k')input.block=true;
  else if(key==='enter'&&game.mode!=='playing')startGame();
 });
 addEventListener('keyup',e=>{input.keys.delete(e.key.toLowerCase());if(e.key.toLowerCase()==='k')input.block=false});
 addEventListener('blur',()=>{input.keys.clear();input.touch.clear();input.block=false});
 const canvas=renderer.domElement;
 canvas.addEventListener('mousedown',e=>{if(e.button===0)actionAttack();if(e.button===2)input.block=true});
 addEventListener('mouseup',e=>{if(e.button===2)input.block=false});
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 for(const button of document.querySelectorAll('[data-act]')){
  const a=button.dataset.act;
  button.addEventListener('pointerdown',e=>{e.preventDefault();try{button.setPointerCapture(e.pointerId)}catch{}
   if(['left','right','up','down'].includes(a))input.touch.add(a);
   else if(a==='block')input.block=true;else actionMap[a]?.();
  });
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(ev,()=>{input.touch.delete(a);if(a==='block')input.block=false});
 }
}
function fail(error){
 console.error('SUONG_SON_GAME_FAILED',error);
 const text=error instanceof Error?error.message:String(error);
 const desc=document.querySelector('.pitch');if(desc)desc.textContent='Không khởi tạo được WebGL trên thiết bị này: '+text;
 const btn=document.querySelector('#play');if(btn)btn.disabled=true;
}
try{
 createWorld();setupControls();updateUI();requestAnimationFrame(tick);
 window.__qs3dGame={
  snapshot:()=>({mode:game.mode,wave:game.wave,kills:game.kills,score:game.score,health:game.health,stamina:game.stamina,mana:game.mana,enemies:game.remaining,attacks:game.attacks,blocks:game.blocks,dodges:game.dodges,hits:game.hits,x:hero.position.x,z:hero.position.z,webgl2:!!renderer.getContext()&&renderer.getContext() instanceof WebGL2RenderingContext}),
  start:startGame,
  action:(name)=>actionMap[name]?.(),
  version:'1.0.0-original'
 };
 document.documentElement.dataset.ready='true';
}catch(error){fail(error)}

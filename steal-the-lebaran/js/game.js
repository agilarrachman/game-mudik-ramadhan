"use strict";
window.addEventListener('error',function(e){var d=document.getElementById('err');d.style.display='block';d.textContent='Ups, ada error: '+(e.message||'tidak dikenal');});
/* ============ DATA ============ */
var RARITIES=[
 {id:'basic',name:'Basic',color:'#9aa3ad',w:34,value:10},
 {id:'common',name:'Common',color:'#58b368',w:27,value:20},
 {id:'uncommon',name:'Uncommon',color:'#2f9e6e',w:17,value:35},
 {id:'rare',name:'Rare',color:'#2f7fe0',w:10.5,value:60},
 {id:'epic',name:'Epic',color:'#9b4de0',w:6,value:110},
 {id:'legendary',name:'Legendary',color:'#f5a623',w:3.4,value:220},
 {id:'mythic',name:'Mythic',color:'#ef3b6b',w:1.6,value:450},
 {id:'secret',name:'Secret',color:'#22242c',w:0.5,value:900}
];
var COIN_RANGES={basic:[10,25],common:[25,50],uncommon:[50,100],rare:[100,250],epic:[250,500],legendary:[500,1500],mythic:[1500,5000],secret:[5000,8000]};
var MUTATIONS=[
 {id:'basic',name:'Basic',mult:1,w:46,tint:null},
 {id:'golden',name:'Golden',mult:3,w:22,tint:0xffc93c},
 {id:'diamond',name:'Diamond',mult:5,w:11,tint:0x9be8ff},
 {id:'rainbow',name:'Rainbow',mult:7,w:8,tint:'rainbow'},
 {id:'neon',name:'Neon',mult:6,w:6,tint:0x39ff88},
 {id:'galaxy',name:'Galaxy',mult:10,w:4.4,tint:0x3b2a6d},
 {id:'celestial',name:'Celestial',mult:14,w:2.6,tint:0xfff3b0}
];
var BASES=[
 {id:'ketupat',name:'Ketupat',emo:'🧆',cat:'ketupat',color:0x3da33f,img:'assets/hd-ketupat.png',desc:'Anyaman daun kelapa berisi beras, ikon wajib meja Lebaran.'},
 {id:'lantern',name:'Lentera Ramadan',emo:'🏮',cat:'ramadan',color:0xd9a441,img:'assets/hd-lentera.png',desc:'Lentera hangat yang menerangi malam Ramadan.'},
 {id:'crescent',name:'Bulan Sabit',emo:'🌙',cat:'ramadan',color:0xffc93c,img:'assets/hd-bulansabit.png',desc:'Sabit emas penanda datangnya bulan suci.'},
 {id:'mosque',name:'Ornamen Masjid',emo:'🕌',cat:'ramadan',color:0x2f9e8f,img:'assets/hd-masjid.png',desc:'Miniatur masjid dengan kubah hijau yang megah.'},
 {id:'bedug',name:'Bedug',emo:'🥁',cat:'ramadan',color:0xa06a35,img:'assets/hd-bedug.png',desc:'Bedug besar penanda waktu berbuka dan takbiran.'},
 {id:'sahurdrum',name:'Kentongan Sahur',emo:'🪘',cat:'ramadan',color:0x8a5a2b,desc:'Alat pukul legendaris pembangun sahur: tung… tung… tung!'},
 {id:'nastar',name:'Nastar',emo:'🍍',cat:'food',color:0xf08c1e,img:'assets/hd-nastar.png',desc:'Kue nanas lumer di mulut, primadona toples Lebaran.'},
 {id:'kastengel',name:'Kastengel',emo:'🧀',cat:'food',color:0xf5a623,desc:'Kue keju gurih renyah yang selalu habis duluan.'},
 {id:'putrisalju',name:'Putri Salju',emo:'❄️',cat:'food',color:0xf4f6f8,desc:'Kue lembut bersalut gula halus seputih salju.'},
 {id:'lidahkucing',name:'Lidah Kucing',emo:'🍪',cat:'food',color:0xd9a05b,desc:'Kue tipis panjang yang renyah dan manis.'},
 {id:'giftbox',name:'Kotak Hadiah Idul Fitri',emo:'🎁',cat:'special',color:0x2fae4e,img:'assets/hd-giftbox.png',desc:'Parsel misterius untuk sanak saudara.'},
 {id:'thr',name:'Amplop THR',emo:'🧧',cat:'special',color:0x2fbf71,desc:'Amplop hijau berisi THR yang paling ditunggu anak-anak.'},
 {id:'baju',name:'Baju Lebaran',emo:'👕',cat:'outfit',color:0x1d2c5e,img:'assets/hd-baju.png',desc:'Baju koko baru untuk salat Id dan silaturahmi.'},
 {id:'sarong',name:'Sarung',emo:'🧣',cat:'outfit',color:0x7a4de0,desc:'Sarung motif klasik, nyaman untuk tarawih.'},
 {id:'prayer',name:'Set Mukena & Sajadah',emo:'🙏',cat:'outfit',color:0xf2f2f2,desc:'Perlengkapan salat yang bersih dan wangi.'},
 {id:'decor',name:'Dekorasi Idul Fitri',emo:'✨',cat:'special',color:0xff7ab6,desc:'Hiasan bintang dan lampu warna-warni khas Lebaran.'}
];
function baseById(id){for(var i=0;i<BASES.length;i++)if(BASES[i].id===id)return BASES[i];return BASES[0];}
var CATS=[{id:'all',name:'Semua'},{id:'ramadan',name:'Ramadan'},{id:'ketupat',name:'Ketupat'},{id:'food',name:'Jajanan Lebaran'},{id:'outfit',name:'Outfit Lebaran'},{id:'special',name:'Spesial'},{id:'secret',name:'Secret'}];
var CATALOG=[];
BASES.forEach(function(b){
  MUTATIONS.forEach(function(m){
    var rmap={basic:'common',golden:'rare',diamond:'epic',rainbow:'legendary',neon:'epic',galaxy:'mythic',celestial:'secret'};
    var r=RARITIES.filter(function(x){return x.id===rmap[m.id]})[0];
    CATALOG.push({key:b.id+'_'+m.id,base:b,mut:m,rarity:r,value:Math.round(r.value*m.mult/5)*5||10,cat:(m.id==='celestial'||m.id==='galaxy')?'secret':b.cat});
  });
});
var TOTAL=CATALOG.length;
/* ============ ROOMS ============ */
/* Linear progression north from the safe zone. unlock = successful extractions needed.
   guard: patrol/chase speeds, detection radius, reaction time (s) before the chase starts. */
var ROOMS=[
 {id:1,name:'Basic Room',short:'BASIC',rarities:'Basic • Common',floor:0x5db84c,accent:0x2f9e6e,accentCss:'#2f9e6e',zMin:-18,zMax:12,unlock:0,diff:'Mudah ★☆☆☆☆',guard:{patrol:2.8,chase:7.4,detect:11,reaction:.8,attack:1.7},items:['ketupat','nastar','lantern','giftbox'],pool:{basic:55,common:35,uncommon:10}},
 {id:2,name:'Uncommon Room',short:'UNCOMMON',rarities:'Uncommon • Rare',floor:0x3fae8a,accent:0x12b5a5,accentCss:'#12b5a5',zMin:-48,zMax:-18,unlock:1,diff:'Sedang ★★☆☆☆',guard:{patrol:3.4,chase:8.4,detect:14,reaction:.6,attack:1.7},items:['ketupat','nastar','lantern','giftbox'],pool:{common:30,uncommon:45,rare:25}},
 {id:3,name:'Rare Room',short:'RARE',rarities:'Rare • Epic',floor:0x4a90d9,accent:0x35c4e8,accentCss:'#35c4e8',zMin:-78,zMax:-48,unlock:3,diff:'Susah ★★★☆☆',guard:{patrol:4.0,chase:9.6,detect:17,reaction:.45,attack:1.8},items:['ketupat','kastengel','giftbox','baju'],pool:{uncommon:25,rare:45,epic:30}},
 {id:4,name:'Epic Room',short:'EPIC',rarities:'Epic • Legendary',floor:0x8a5fe0,accent:0x9b4de0,accentCss:'#9b4de0',zMin:-108,zMax:-78,unlock:6,diff:'Sangat Susah ★★★★☆',guard:{patrol:4.6,chase:10.8,detect:20,reaction:.3,attack:1.8},items:['ketupat','nastar','giftbox','decor'],pool:{rare:25,epic:45,legendary:30}},
 {id:5,name:'Legendary Room',short:'LEGENDARY',rarities:'Legendary • Mythic • Secret',floor:0xe8a33d,accent:0xf5a623,accentCss:'#f5a623',zMin:-138,zMax:-108,unlock:10,diff:'Ekstrem ★★★★★',guard:{patrol:5.2,chase:12.2,detect:24,reaction:.2,attack:1.9},items:['ketupat','giftbox','baju','crescent'],pool:{epic:25,legendary:45,mythic:22,secret:8}},
 {id:6,name:'Secret Room',short:'SECRET',rarities:'Secret Eksklusif',floor:0x33254d,accent:0xb46ae0,accentCss:'#b46ae0',zMin:-168,zMax:-138,unlock:15,diff:'Mimpi Buruk ★★★★★+',guard:{patrol:5.8,chase:13.8,detect:28,reaction:.12,attack:1.9},items:['crescent','decor','giftbox'],pool:{legendary:25,mythic:45,secret:30}}
];
/* Gate boundaries between zones: z line, half-width of the open gap, room north of it. */
var BOUNDARIES=[{z:12,gap:6.8,north:1,always:true},{z:-18,gap:5,north:2},{z:-48,gap:5,north:3},{z:-78,gap:5,north:4},{z:-108,gap:5,north:5},{z:-138,gap:5,north:6}];
function roomAt(z){if(z>12)return 0;for(var i=0;i<ROOMS.length;i++){if(z<=ROOMS[i].zMax&&z>ROOMS[i].zMin)return ROOMS[i].id;}return 6;}
function isUnlocked(room){return S.escapes>=room.unlock;}
/* ============ REWARD ROLLS ============ */
function visualHTML(base,big){
  if(base.img)return '<img class="asset-img'+(base.cover?' cover':'')+'" src="'+base.img+'" alt="'+base.name+'">';
  return '<span class="'+(big?'emo-big':'emo')+'">'+base.emo+'</span>';
}
function thumbHTML(base){
  if(base.img)return '<img class="thumb" src="'+base.img+'" alt="">';
  return '<span style="font-size:22px;line-height:1">'+base.emo+'</span>';
}
function pickFromWeights(pairs){
  var tot=0,i;for(i=0;i<pairs.length;i++)tot+=pairs[i][1];
  var roll=Math.random()*tot;
  for(i=0;i<pairs.length;i++){roll-=pairs[i][1];if(roll<=0)return pairs[i][0];}
  return pairs[0][0];
}
function rollReward(base,roomId){
  var room=ROOMS[(roomId||1)-1]||ROOMS[0];
  var pairs=[];Object.keys(room.pool).forEach(function(rid){var r=RARITIES.filter(function(x){return x.id===rid})[0];pairs.push([r,room.pool[rid]]);});
  var r=pickFromWeights(pairs);
  if(S.luckLv>0&&Math.random()<S.luckLv*0.09){var idx=RARITIES.indexOf(r);if(idx<RARITIES.length-1)r=RARITIES[idx+1];}
  var mpairs=MUTATIONS.map(function(m){var w=(m.id==='basic')?Math.max(8,46-room.id*6):m.w*Math.pow(1.22,room.id-1);return [m,w];});
  var m=pickFromWeights(mpairs);
  var range=COIN_RANGES[r.id]||[10,25];
  var raw=range[0]+Math.random()*(range[1]-range[0]);
  var value=Math.max(5,Math.round(raw*Math.pow(m.mult,0.6)/5)*5);
  return {base:base,rarity:r,mut:m,value:value,key:base.id+'_'+m.id,room:room.id};
}
/* ============ STATE ============ */
var S={coins:150,collection:{},counts:{},carrying:null,extracted:null,started:false,muted:false,
 speedLevel:1,luckLv:0,standLv:0,steals:0,escapes:0,caught:0,lastReward:null,currentRoom:0,announced:{1:true},lockToastAt:0};
var MAX_SPEED_LEVEL=10;
function speedCost(level){return 100*Math.pow(5,level-1);} /* cost from `level` to level+1 */
function speedMult(){return Math.pow(1.1,S.speedLevel-1);}
function playerLevel(){return 1+Math.floor(S.escapes/3)+Math.floor(discoveredCount()/14);}
function discoveredCount(){return Object.keys(S.collection).length;}
/* ============ AUDIO (WebAudio synth) ============ */
var AC=null;
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC;}
function tone(f,t0,d,type,vol,slide){if(S.muted)return;var c=ac();if(!c)return;var o=c.createOscillator(),g=c.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,c.currentTime+t0);if(slide)o.frequency.exponentialRampToValueAtTime(slide,c.currentTime+t0+d);g.gain.setValueAtTime(vol||.12,c.currentTime+t0);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+t0+d);o.connect(g);g.connect(c.destination);o.start(c.currentTime+t0);o.stop(c.currentTime+t0+d+.02);}
function sfx(name){
 if(name==='pickup'){tone(520,0,.09,'square',.12);tone(780,.07,.12,'square',.12);}
 if(name==='drop'){tone(300,0,.15,'square',.12,140);}
 if(name==='safe'){tone(523,0,.1,'triangle',.16);tone(659,.09,.1,'triangle',.16);tone(784,.18,.2,'triangle',.16);}
 if(name==='caught'){tone(220,0,.2,'sawtooth',.14,110);tone(160,.18,.3,'sawtooth',.14,80);}
 if(name==='tung'){tone(180,0,.09,'square',.10);tone(180,.14,.09,'square',.10);tone(180,.28,.09,'square',.10);}
 if(name==='open'){tone(440,0,.08,'square',.1);tone(554,.07,.08,'square',.1);tone(659,.14,.08,'square',.1);tone(880,.21,.25,'square',.12);}
 if(name==='fanfare'){[523,659,784,1046,784,1046].forEach(function(f,i){tone(f,i*.11,.22,'triangle',.16);});}
 if(name==='coin'){tone(988,0,.07,'square',.1);tone(1318,.06,.14,'square',.1);}
 if(name==='zap'){tone(1200,0,.08,'sawtooth',.10,2400);tone(800,.06,.14,'sawtooth',.10,200);tone(1560,.14,.2,'square',.12);}
 if(name==='step'){tone(140+Math.random()*40,0,.05,'triangle',.045);}
}
/* ============ THREE SETUP ============ */
var BOUND_Z=12;
var scene,camera,renderer,clock;
var player,bots=[],items=[],stands=[],decorGroup,guardians=[],gateBarriers={},animDeco=[];
var camYaw=0;
var keys={},joyVec={x:0,y:0},sprinting=false;
var stepTimer=0;
var playerPos;
function mat(c,r,m){return new THREE.MeshStandardMaterial({color:c,roughness:r==null?.75:r,metalness:m||0});}
function box(w,h,d,c,x,y,z){var ms=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));ms.position.set(x||0,y||0,z||0);ms.castShadow=true;ms.receiveShadow=true;return ms;}
function cyl(rt,rb,h,c,x,y,z,seg){var ms=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||14),mat(c));ms.position.set(x||0,y||0,z||0);ms.castShadow=true;return ms;}
function sph(r,c,x,y,z){var ms=new THREE.Mesh(new THREE.SphereGeometry(r,18,14),mat(c));ms.position.set(x||0,y||0,z||0);ms.castShadow=true;return ms;}
function makeLabel(text,accentCss,w){
  var cv=document.createElement('canvas');cv.width=1024;cv.height=200;var cx=cv.getContext('2d');
  cx.fillStyle='rgba(24,20,14,.78)';cx.beginPath();
  var r=60;cx.moveTo(r,14);cx.lineTo(1024-r,14);cx.quadraticCurveTo(1010,14,1010,r);cx.lineTo(1010,200-r);cx.quadraticCurveTo(1010,186,1024-r,186);cx.lineTo(r,186);cx.quadraticCurveTo(14,186,14,200-r);cx.lineTo(14,r);cx.quadraticCurveTo(14,14,r,14);cx.fill();
  cx.strokeStyle=accentCss;cx.lineWidth=12;cx.stroke();
  cx.fillStyle='#ffffff';cx.font='700 74px Fredoka, Nunito, sans-serif';cx.textAlign='center';cx.textBaseline='middle';
  cx.fillText(text,512,104,980);
  var tex=new THREE.CanvasTexture(cv);
  var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true}));
  sp.scale.set(w||11,(w||11)*0.195,1);
  return sp;
}
function makeAvatar(shirt,pants,skin){
  var g=new THREE.Group();
  var legL=box(.34,.8,.38,pants,-.21,.4,0),legR=box(.34,.8,.38,pants,.21,.4,0);
  var body=box(1.05,1.05,.55,shirt,0,1.32,0);
  var armL=box(.3,.95,.34,shirt,-.7,1.35,0),armR=box(.3,.95,.34,shirt,.7,1.35,0);
  var head=box(.78,.72,.72,skin,0,2.22,0);
  var eyeM=mat(0x1c1c22,.4);
  var e1=new THREE.Mesh(new THREE.BoxGeometry(.11,.16,.03),eyeM);e1.position.set(-.17,2.28,.37);
  var e2=e1.clone();e2.position.x=.17;
  var smile=new THREE.Mesh(new THREE.BoxGeometry(.3,.06,.03),eyeM);smile.position.set(0,2.02,.37);
  var cap=box(.84,.18,.78,0x22b573,0,2.66,0);
  g.add(legL,legR,body,armL,armR,head,e1,e2,smile,cap);
  g.userData={legL:legL,legR:legR,armL:armL,armR:armR,body:body};
  return g;
}
function makeEnemy(){
  var g=new THREE.Group();
  var wood=0xb57a3e,woodD=0x9a652c;
  var body=cyl(.52,.58,2.5,wood,0,2.05,0,16);
  var legL=cyl(.11,.13,1.05,woodD,-.24,.52,0,10),legR=cyl(.11,.13,1.05,woodD,.24,.52,0,10);
  var footL=box(.34,.14,.62,woodD,-.24,.07,.12),footR=box(.34,.14,.62,woodD,.24,.07,.12);
  var armL=cyl(.09,.09,.95,woodD,-.62,2.2,0,8),armR=cyl(.09,.09,.95,woodD,.62,2.2,0,8);
  armL.rotation.z=.25;armR.rotation.z=-.9;
  var bat=cyl(.07,.13,1.5,0x8a5a2b,.95,1.55,.25,10);bat.rotation.z=-.7;
  var eyeW=mat(0xffffff,.35),pup=mat(0x14100c,.3);
  var ew1=sph(.17,0xffffff,-.2,2.95,.47),ew2=sph(.17,0xffffff,.2,2.95,.47);
  ew1.material=eyeW;ew2.material=eyeW;
  var p1=sph(.085,0x14100c,-.2,2.95,.62),p2=sph(.085,0x14100c,.2,2.95,.62);p1.material=pup;p2.material=pup;
  var browL=box(.34,.07,.04,0x4a2c14,-.2,3.22,.5),browR=box(.34,.07,.04,0x4a2c14,.2,3.22,.5);
  browL.rotation.z=.3;browR.rotation.z=-.3;
  var mouth=new THREE.Mesh(new THREE.TorusGeometry(.17,.035,8,14,Math.PI),mat(0x4a2c14,.5));
  mouth.position.set(0,2.62,.52);mouth.rotation.z=Math.PI;
  var bang=new THREE.Group();bang.position.set(0,3.85,0);
  var bangT=box(.16,1.15,.16,0xef3b3b,0,.55,0);var bangTxt=box(.95,.5,.06,0xef3b3b,0,1.05,0);
  bang.add(bangT,bangTxt);bang.visible=false;
  g.add(body,legL,legR,footL,footR,armL,armR,bat,ew1,ew2,p1,p2,browL,browR,mouth,bang);
  g.userData={legL:legL,legR:legR,armR:armR,bat:bat,bang:bang,body:body};
  return g;
}
function makeItemMesh(base){
  var g=new THREE.Group();var c=base.color;
  function add(m){g.add(m);return m;}
  switch(base.id){
    case 'ketupat':{var k=new THREE.Mesh(new THREE.OctahedronGeometry(.55),mat(0x3da33f,.55));k.scale.y=1.25;k.castShadow=true;add(k);
      var band=box(.62,.2,.62,0x7ed957,0,.05,0);band.rotation.y=Math.PI/4;add(band);var band2=box(.5,.18,.5,0x7ed957,0,-.28,0);band2.rotation.y=Math.PI/4;add(band2);
      add(cyl(.03,.05,.5,0x2f7a3d,0,.85,0,6));var lf=box(.3,.45,.04,0x7ed957,-.14,1.02,0);lf.rotation.z=.5;add(lf);var lf2=box(.3,.45,.04,0x7ed957,.14,1.02,0);lf2.rotation.z=-.5;add(lf2);break;}
    case 'lantern':{var glass=cyl(.3,.3,.6,0x0e7ac3,0,0,0,6);glass.material=new THREE.MeshStandardMaterial({color:0x0e7ac3,roughness:.25,emissive:0x0a4d80,emissiveIntensity:.55});add(glass);
      add(cyl(.4,.44,.14,0xd9a441,0,.4,0,6));add(cyl(.44,.4,.14,0xd9a441,0,-.4,0,6));
      var dome=sph(.3,0xd9a441,0,.55,0);dome.scale.y=.8;add(dome);
      var gl2=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),new THREE.MeshStandardMaterial({color:0xbfe3ff,emissive:0x7ec8ff,emissiveIntensity:1.1}));add(gl2);break;}
    case 'crescent':{var t=new THREE.Mesh(new THREE.TorusGeometry(.45,.16,10,22,Math.PI*1.45),new THREE.MeshStandardMaterial({color:0xffc93c,roughness:.3,metalness:.55,emissive:0x664d00,emissiveIntensity:.5}));t.castShadow=true;t.rotation.z=.8;add(t);
      var st=sph(.13,0xffe98a,.42,.42,0);st.material=new THREE.MeshStandardMaterial({color:0xffe98a,emissive:0xffc93c,emissiveIntensity:.8});add(st);break;}
    case 'mosque':{add(box(1.0,.6,.8,0xe8f4f2,0,-.1,0));var dome2=sph(.42,0x2f9e8f,0,.42,0);dome2.scale.y=.85;add(dome2);add(cyl(.05,.05,.4,0xffc93c,0,.85,0,8));
      add(cyl(.09,.11,.95,0xe8f4f2,-.62,.15,0,8));add(cyl(.09,.11,.95,0xe8f4f2,.62,.15,0,8));break;}
    case 'bedug':{var b=cyl(.34,.34,1.05,0xa06a35,0,0,0,14);b.rotation.z=Math.PI/2;add(b);var s1=cyl(.36,.36,.06,0xe8d9b0,-.55,0,0,14);s1.rotation.z=Math.PI/2;add(s1);var s2=cyl(.36,.36,.06,0xe8d9b0,.55,0,0,14);s2.rotation.z=Math.PI/2;add(s2);break;}
    case 'sahurdrum':{add(cyl(.3,.34,.5,0x8a5a2b,0,0,0,12));add(cyl(.32,.32,.07,0xe8d9b0,0,.27,0,12));var st1=cyl(.035,.035,.6,0xd9a05b,.3,.35,.15,6);st1.rotation.z=.7;add(st1);break;}
    case 'nastar':{var n=sph(.42,0xf08c1e,0,0,0);n.scale.y=.74;n.material=new THREE.MeshStandardMaterial({color:0xf08c1e,roughness:.32});add(n);add(cyl(.43,.44,.09,0xe8c98f,0,-.24,0,16));
      [[-.16,.26,.1],[.14,.27,-.14],[0,.3,.16],[.2,.24,.12],[-.02,.28,-.2]].forEach(function(sp){var strip=box(.2,.035,.06,0xffe9a8,sp[0],sp[1],sp[2]);strip.rotation.y=sp[0]*4;strip.rotation.z=.15;add(strip);});break;}
    case 'kastengel':{add(box(.85,.3,.42,0xf5a623,0,0,0));add(box(.87,.07,.44,0xffd76a,0,.17,0));break;}
    case 'putrisalju':{var p=sph(.4,0xffffff,0,0,0);p.scale.y=.75;p.material=mat(0xffffff,.95);add(p);var p2=sph(.26,0xffffff,.3,-.08,.18);p2.scale.y=.75;add(p2);break;}
    case 'lidahkucing':{add(box(.24,.07,.85,0xd9a05b,0,0,0));var l2=box(.24,.07,.85,0xe5b96e,-.2,.09,.05);l2.rotation.y=.25;add(l2);var l3=box(.24,.07,.85,0xd9a05b,.2,.09,-.04);l3.rotation.y=-.2;add(l3);break;}
    case 'giftbox':{add(box(.78,.6,.78,0x2fae4e,0,-.05,0));add(box(.84,.17,.84,0x27963f,0,.3,0));add(box(.17,.78,.85,0xffb627,0,0,0));add(box(.85,.78,.17,0xffb627,0,0,0));var bow=sph(.15,0xffb627,0,.5,0);bow.scale.set(1.5,.6,1);add(bow);var bow2=sph(.11,0xffb627,.16,.52,0);bow2.scale.set(1.2,.55,1);add(bow2);break;}
    case 'thr':{var e=box(.62,.85,.09,0x2fbf71,0,0,0);e.rotation.z=.12;add(e);add(box(.4,.2,.1,0xffc93c,0,.18,0));break;}
    case 'baju':{add(box(.8,.85,.34,0x1d2c5e,0,0,0));var a1=box(.24,.6,.3,0x1d2c5e,-.52,.08,0);a1.rotation.z=.35;add(a1);var a2=box(.24,.6,.3,0x1d2c5e,.52,.08,0);a2.rotation.z=-.35;add(a2);add(box(.1,.55,.36,0x16224a,0,.08,0));var bt=sph(.045,0xd9a441,0,.22,.19);add(bt);var bt2=sph(.045,0xd9a441,0,.02,.19);add(bt2);break;}
    case 'sarong':{var s=cyl(.3,.36,.85,0x7a4de0,0,0,0,12);add(s);add(cyl(.31,.31,.14,0xffc93c,0,.3,0,12));add(cyl(.34,.34,.1,0x5b34b8,0,-.3,0,12));break;}
    case 'prayer':{var cone=new THREE.Mesh(new THREE.ConeGeometry(.48,.95,14),mat(0xf6f1e7,.9));cone.castShadow=true;add(cone);add(box(.7,.12,.5,0x9b4de0,0,-.55,0));break;}
    case 'decor':{var shape=new THREE.Shape();for(var i=0;i<10;i++){var ang=i*Math.PI/5-Math.PI/2;var rad=i%2===0?.5:.22;var px=Math.cos(ang)*rad,py=Math.sin(ang)*rad;if(i===0)shape.moveTo(px,py);else shape.lineTo(px,py);}shape.closePath();
      var star=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.14,bevelEnabled:false}),new THREE.MeshStandardMaterial({color:0xff7ab6,roughness:.4,emissive:0x8a2050,emissiveIntensity:.5}));star.castShadow=true;add(star);break;}
    default:{add(sph(.42,c,0,0,0));}
  }
  return g;
}
function applyMutation(group,mut){
  if(!mut||mut.id==='basic')return;
  group.traverse(function(o){
    if(o.isMesh&&o.material&&o.material.color){
      if(mut.tint==='rainbow'){o.material=o.material.clone();o.material.color.setHSL(Math.random(),.85,.6);o.userData.rainbow=true;}
      else if(typeof mut.tint==='number'){o.material=o.material.clone();o.material.color.set(mut.tint);if(mut.id==='golden'){o.material.metalness=.75;o.material.roughness=.25;}if(mut.id==='diamond'){o.material.transparent=true;o.material.opacity=.82;o.material.roughness=.1;o.material.metalness=.2;}if(mut.id==='neon'){o.material.emissive=new THREE.Color(mut.tint);o.material.emissiveIntensity=.9;}if(mut.id==='galaxy'){o.material.emissive=new THREE.Color(0x6a4de0);o.material.emissiveIntensity=.35;}}
    }
  });
}
/* ============ WORLD ============ */
function buildWorld(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0x8fd0f7);scene.fog=new THREE.Fog(0x8fd0f7,110,340);
  camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,500);
  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  if('outputColorSpace' in renderer&&THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  document.getElementById('game').appendChild(renderer.domElement);
  camera.position.set(0,9.5,40);
  scene.add(new THREE.HemisphereLight(0xcfe8ff,0x5da24a,1.05));
  scene.add(new THREE.AmbientLight(0xffffff,.25));
  var sun=new THREE.DirectionalLight(0xfff2cf,1.7);sun.position.set(26,42,-40);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-95;sun.shadow.camera.right=95;sun.shadow.camera.top=140;sun.shadow.camera.bottom=-140;sun.shadow.camera.far=340;
  scene.add(sun);
  /* Safe zone ground (south) */
  var safe=new THREE.Mesh(new THREE.PlaneGeometry(96,20),mat(0x35b8a6,1));safe.rotation.x=-Math.PI/2;safe.position.set(0,0,22);safe.receiveShadow=true;scene.add(safe);
  var plaza=new THREE.Mesh(new THREE.PlaneGeometry(20,12),mat(0xf2d492,1));plaza.rotation.x=-Math.PI/2;plaza.position.set(0,.01,22);plaza.receiveShadow=true;scene.add(plaza);
  /* Room floors */
  ROOMS.forEach(function(room){
    var depth=room.zMax-room.zMin,cz=(room.zMax+room.zMin)/2;
    var fl=new THREE.Mesh(new THREE.PlaneGeometry(96,depth),mat(room.floor,1));fl.rotation.x=-Math.PI/2;fl.position.set(0,0,cz);fl.receiveShadow=true;scene.add(fl);
    var pl=new THREE.PointLight(room.accent,room.id>=5?.85:.55,34,1.6);pl.position.set(0,6.5,cz);scene.add(pl);
  });
  var path=new THREE.Mesh(new THREE.PlaneGeometry(6,202),mat(0xd9905f,1));path.rotation.x=-Math.PI/2;path.position.set(0,.012,-67);path.receiveShadow=true;scene.add(path);
  /* Safe boundary wall + glowing gate at z = BOUND_Z */
  var wallM=mat(0xfdf6e3,.8);
  [-27.4,27.4].forEach(function(x){var w=new THREE.Mesh(new THREE.BoxGeometry(41.2,2.4,.7),wallM);w.position.set(x,1.2,BOUND_Z);w.castShadow=true;w.receiveShadow=true;scene.add(w);});
  [-6.8,6.8].forEach(function(x){var p=box(1.1,4.4,1.1,0x12b5a5,x,2.2,BOUND_Z);scene.add(p);var cap=sph(.5,0xffc93c,x,4.75,BOUND_Z);cap.material=new THREE.MeshStandardMaterial({color:0xffc93c,emissive:0xcc8f00,emissiveIntensity:.7});});
  var beam=new THREE.Mesh(new THREE.BoxGeometry(12.6,.55,.6),new THREE.MeshStandardMaterial({color:0x22e6c8,emissive:0x0fbfa8,emissiveIntensity:1.4,transparent:true,opacity:.9}));
  beam.position.set(0,4.1,BOUND_Z);scene.add(beam);scene.userData.beam=beam;
  var line=new THREE.Mesh(new THREE.PlaneGeometry(13,.5),new THREE.MeshBasicMaterial({color:0x22e6c8,transparent:true,opacity:.75}));
  line.rotation.x=-Math.PI/2;line.position.set(0,.03,BOUND_Z);scene.add(line);scene.userData.line=line;
  var safeLabel=makeLabel('ZONA AMAN','#22e6c8',10);safeLabel.position.set(0,6.1,BOUND_Z);scene.add(safeLabel);
  /* Room divider walls, gates, labels, lock barriers */
  BOUNDARIES.slice(1).forEach(function(b){
    var room=ROOMS[b.north-1];
    var segW=48-b.gap;
    [-1,1].forEach(function(sgn){
      var w=new THREE.Mesh(new THREE.BoxGeometry(segW,3,.7),mat(room.accent,.8));
      w.position.set(sgn*(b.gap+segW/2),1.5,b.z);w.castShadow=true;w.receiveShadow=true;scene.add(w);
      var post=box(1.1,4.6,1.1,room.accent,sgn*b.gap,2.3,b.z);scene.add(post);
      var orb=sph(.48,room.accent,sgn*b.gap,4.95,b.z);orb.material=new THREE.MeshStandardMaterial({color:room.accent,emissive:room.accent,emissiveIntensity:.55});scene.add(orb);
    });
    var lbl=makeLabel(room.name.toUpperCase()+'  •  '+room.rarities.toUpperCase(),room.accentCss,13);
    lbl.position.set(0,6.4,b.z);scene.add(lbl);
    var barrier=new THREE.Mesh(new THREE.PlaneGeometry(b.gap*2,3.1),new THREE.MeshBasicMaterial({color:0xef3b3b,transparent:true,opacity:.32,side:THREE.DoubleSide}));
    barrier.position.set(0,1.55,b.z);scene.add(barrier);gateBarriers[room.id]=barrier;
  });
  /* Outer fences */
  function fenceRun(x1,z1,x2,z2){var dx=x2-x1,dz=z2-z1,len=Math.sqrt(dx*dx+dz*dz),n=Math.floor(len/2.2);for(var i=0;i<=n;i++){var t=i/n;var post=cyl(.07,.07,1.1,0x8a5a2b,x1+dx*t,.55,z1+dz*t,6);scene.add(post);}var rail=box(len,.12,.12,0xa06a35,(x1+x2)/2,.85,(z1+z2)/2);rail.rotation.y=-Math.atan2(dz,dx);scene.add(rail);}
  fenceRun(-47,-168,47,-168);fenceRun(-47,-168,-47,12);fenceRun(47,-168,47,12);fenceRun(-47,32,-7,32);fenceRun(7,32,47,32);fenceRun(-47,12,-47,32);fenceRun(47,12,47,32);
  function tree(x,z,s){var g=new THREE.Group();g.add(cyl(.16,.22,1.4,0x8a5a2b,0,.7,0,7));var c1=sph(1.05,0x3f9e4d,0,2.0,0);var c2=sph(.75,0x55b862,.6,1.6,.2);var c3=sph(.7,0x2f8a3e,-.6,1.7,-.15);g.add(c1,c2,c3);g.position.set(x,0,z);g.scale.setScalar(s||1);scene.add(g);}
  [[-40,-6,1.2],[-18,-10,1],[38,-4,1.25],[44,-30,1],[-44,-52,1.15],[26,22,1.2],[-26,24,1.15],[-24,17,1],[24,28,1.1],[-40,-92,1.1],[42,-122,1.15],[40,-14,1],[-38,-140,1.05]].forEach(function(t){tree(t[0],t[1],t[2]);});
  /* Per-room decorations */
  ROOMS.forEach(function(room){
    var cz=(room.zMax+room.zMin)/2,depth=room.zMax-room.zMin;
    if(room.id===1){
      [[-24,-6],[24,-10],[-36,-2],[36,-14]].forEach(function(r){var rock=sph(.8,0x9aa3ad,r[0],.3,r[1]);rock.scale.y=.65;scene.add(rock);});
      for(var i=0;i<14;i++){var fx=(i*7.9)%76-38,fz=-16+(i*2.3)%24;if(Math.abs(fx)<4)continue;var fl=sph(.16,[0xff5d8f,0xffc93c,0xff7ab6,0xffffff][i%4],fx,.16,fz);fl.scale.y=.7;scene.add(fl);}
    }
    if(room.id===2){
      [-26,-14,14,26].forEach(function(x){[-.3,.35].forEach(function(f){var z=room.zMin+f*depth;
        scene.add(cyl(.09,.11,3.4,0x6b4226,x,1.7,z,8));
        var hg=cyl(.34,.34,.55,0x0e7ac3,x,3.6,z,6);hg.material=new THREE.MeshStandardMaterial({color:0x0e7ac3,roughness:.3,emissive:0x0a4d80,emissiveIntensity:.6});scene.add(hg);
        scene.add(cyl(.4,.42,.1,0xd9a441,x,3.92,z,6));});});
    }
    if(room.id===3){
      [[-34,.25],[32,.55],[-24,.7],[38,.2],[16,.85]].forEach(function(cf){
        var z=room.zMin+cf[1]*depth;
        var cry=new THREE.Mesh(new THREE.ConeGeometry(.8,2.6,6),new THREE.MeshStandardMaterial({color:0x7ee8ff,roughness:.15,metalness:.2,emissive:0x1a7ea6,emissiveIntensity:.7,transparent:true,opacity:.92}));
        cry.position.set(cf[0],1.3,z);cry.castShadow=true;scene.add(cry);
        var tip=new THREE.Mesh(new THREE.ConeGeometry(.4,1.3,6),cry.material);tip.position.set(cf[0]+1,0.65,z+.6);scene.add(tip);});
    }
    if(room.id===4){
      for(var oi=0;oi<7;oi++){var ox=-33+oi*11,oz=room.zMin+((oi*37)%70)/100*depth+.15*depth;
        var orb2=new THREE.Mesh(new THREE.SphereGeometry(.55,14,12),new THREE.MeshStandardMaterial({color:0xc99aff,roughness:.3,emissive:0x7a2bd0,emissiveIntensity:.85}));
        orb2.position.set(ox,3.4,oz);scene.add(orb2);animDeco.push({mesh:orb2,baseY:3.4,ph:oi*1.3});}
    }
    if(room.id===5){
      [-38,-13,13,38].forEach(function(x){scene.add(cyl(.7,.85,4.6,0xd9a441,x,2.3,room.zMin+2.5,12));scene.add(cyl(.7,.85,4.6,0xd9a441,x,2.3,room.zMax-2.5,12));
        var capG=sph(.55,0xffc93c,x,5,room.zMin+2.5);capG.material=new THREE.MeshStandardMaterial({color:0xffc93c,emissive:0xcc8f00,emissiveIntensity:.8});});
      [[-26,.4],[26,.6]].forEach(function(cf){var z=room.zMin+cf[1]*depth;scene.add(box(1.6,1,1.1,0xb57a3e,cf[0],.5,z));scene.add(box(1.66,.22,1.16,0xffc93c,cf[0],1.05,z));});
    }
    if(room.id===6){
      var portal=new THREE.Mesh(new THREE.TorusGeometry(2.6,.28,10,32),new THREE.MeshStandardMaterial({color:0x8a4de0,roughness:.3,emissive:0x5b21b6,emissiveIntensity:1.1}));
      portal.position.set(0,3.1,room.zMin+1.6);scene.add(portal);animDeco.push({mesh:portal,baseY:3.1,ph:0,spin:true});
      for(var si=0;si<12;si++){var sx=-42+(si*7.3)%84,sz=room.zMin+((si*29)%80)/100*depth+.1*depth;
        var star2=sph(.14,0xffffff,sx,4.5+(si%3),sz);star2.material=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xcfb8ff,emissiveIntensity:1.2});scene.add(star2);}
    }
  });
  /* Mosque silhouette far north, beyond the Secret Room */
  var mosqueG=new THREE.Group();
  mosqueG.add(box(10,4,6,0xe8f4f2,0,2,0));var md=sph(3.1,0x2f9e8f,0,5.4,0);md.scale.y=.8;mosqueG.add(md);mosqueG.add(cyl(.3,.3,2.6,0xffc93c,0,8.2,0,8));
  mosqueG.add(cyl(.7,.9,9,0xe8f4f2,-7,4.5,0,10));mosqueG.add(cyl(.7,.9,9,0xe8f4f2,7,4.5,0,10));
  var mc1=new THREE.Mesh(new THREE.ConeGeometry(1,2,10),mat(0x2f9e8f));mc1.position.set(-7,10,0);var mc2=mc1.clone();mc2.position.x=7;mosqueG.add(mc1,mc2);
  mosqueG.position.set(0,0,-186);scene.add(mosqueG);
  /* Hanging lanterns + ketupat deco over safe plaza */
  decorGroup=new THREE.Group();scene.add(decorGroup);
  for(var li=-2;li<=2;li++){var lx=li*4.4;
    decorGroup.add(cyl(.02,.02,1.1,0x6b4226,lx,6.95,16,5));
    var hg2=cyl(.3,.3,.5,0x0e7ac3,lx,6.05,16,6);hg2.material=new THREE.MeshStandardMaterial({color:0x0e7ac3,roughness:.3,emissive:0x0a4d80,emissiveIntensity:.5});decorGroup.add(hg2);
    decorGroup.add(cyl(.36,.38,.1,0xd9a441,lx,6.36,16,6));decorGroup.add(cyl(.38,.36,.1,0xd9a441,lx,5.74,16,6));
    if(li<2){var moon2=new THREE.Mesh(new THREE.TorusGeometry(.3,.1,8,18,Math.PI*1.4),new THREE.MeshStandardMaterial({color:0xffc93c,roughness:.35,metalness:.5,emissive:0x997000,emissiveIntensity:.45}));moon2.position.set(lx+2.2,6.0,16);moon2.rotation.z=.7;decorGroup.add(moon2);}
  }
  for(var ki=0;ki<6;ki++){var kx=-12+ki*4.8,kz=ki%2?18.5:26;var kg=new THREE.Mesh(new THREE.OctahedronGeometry(.42),mat(0x58b368,.6));kg.position.set(kx,3.4,kz);kg.scale.y=1.25;kg.castShadow=true;decorGroup.add(kg);decorGroup.add(cyl(.02,.02,1.2,0x6b4226,kx,4.3,kz,5));}
  /* Display stands in safe zone */
  var standPos=[[-7.5,25.5],[-4.5,26.8],[4.5,26.8],[7.5,25.5],[0,28]];
  standPos.forEach(function(p,i){var st=new THREE.Group();st.add(cyl(.75,.9,.18,0x8a5a2b,0,.09,0,14));st.add(cyl(.16,.2,1.0,0x6b4226,0,.6,0,10));st.add(cyl(.62,.62,.14,0xf5a623,0,1.16,0,14));st.position.set(p[0],0,p[1]);scene.add(st);stands.push({group:st,item:null,slot:i});});
  /* Player + bots */
  player=makeAvatar(0x2f7fe0,0x2b3a55,0xffd9a0);playerPos=new THREE.Vector3(0,0,22);player.position.copy(playerPos);player.rotation.y=Math.PI;scene.add(player);
  var botDefs=[{s:0xef3b6b,p:0x333a45,x:-9,z:20},{s:0xf5a623,p:0x2b3a55,x:9,z:20}];
  botDefs.forEach(function(d,i){var b=makeAvatar(d.s,d.p,0xffd9a0);b.position.set(d.x,0,d.z);b.userData.ai={t:Math.random()*3,target:new THREE.Vector3(d.x,0,d.z),carry:null,phase:'idle',wait:1+i*2};scene.add(b);bots.push(b);});
  /* Guardians: one Tung Tung Tung Sahur per room — patrols its own room, but chases thieves across the whole map to the safe gate */
  ROOMS.forEach(function(room){
    var g=makeEnemy();
    var band=box(1.14,.3,1.14,room.accent,0,2.62,0);g.add(band);
    var ring=new THREE.Mesh(new THREE.TorusGeometry(1.15,.06,8,28),new THREE.MeshBasicMaterial({color:room.accent}));
    ring.rotation.x=Math.PI/2;ring.position.y=.07;g.add(ring);
    var lbl=makeLabel('TUNG • '+room.short,room.accentCss,5.2);lbl.position.set(0,4.85,0);g.add(lbl);
    g.scale.setScalar(1+(room.id-1)*0.045);
    var cz=(room.zMax+room.zMin)/2;
    g.position.set(0,0,cz);scene.add(g);
    var pts=[[-32,.3],[30,.62],[0,.85],[-24,.68],[34,.28]].map(function(p){return new THREE.Vector3(p[0],0,room.zMin+p[1]*(room.zMax-room.zMin));});
    guardians.push({mesh:g,room:room,state:'patrol',idx:0,pts:pts,alertTimer:0,tungTimer:0,home:new THREE.Vector3(0,0,cz)});
  });
  /* Stealable items: each room spawns its own pool */
  var spotFrac=[[-30,.3],[-11,.68],[12,.35],[32,.72]];
  ROOMS.forEach(function(room){
    room.items.forEach(function(bid,i){
      var f=spotFrac[i%spotFrac.length];
      spawnItem(baseById(bid),f[0],room.zMin+f[1]*(room.zMax-room.zMin),room.id);
    });
  });
  refreshGates();
  window.addEventListener('resize',function(){camera.aspect=innerWidth/innerHeight;camera.fov=camera.aspect<1?74:58;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
  camera.fov=camera.aspect<1?74:58;camera.updateProjectionMatrix();
}
var itemIdSeq=1;
function spawnItem(base,x,z,roomId){
  var g=makeItemMesh(base);g.position.set(x,1.05,z);
  var ped=cyl(.55,.7,.5,0xfdf6e3,x,.25,z,12);scene.add(ped);
  var ring=new THREE.Mesh(new THREE.TorusGeometry(.85,.05,8,26),new THREE.MeshBasicMaterial({color:0xffc93c}));
  ring.rotation.x=Math.PI/2;ring.position.set(x,.55,z);scene.add(ring);
  scene.add(g);
  items.push({id:itemIdSeq++,base:base,group:g,ped:ped,ring:ring,x:x,z:z,room:roomId||1,taken:false,bob:Math.random()*6});
}
function respawnLater(base,roomId){
  var room=ROOMS[(roomId||1)-1]||ROOMS[0];
  var delay=room.id===6?15000:4500; /* Secret Room stock is deliberately scarce */
  setTimeout(function(){if(!scene)return;var x=Math.random()*80-40,z=room.zMin+3+Math.random()*(room.zMax-room.zMin-6);if(Math.abs(x)<3.5)x+=6;spawnItem(base,x,z,room.id);},delay);
}
function refreshGates(){
  ROOMS.forEach(function(room){var b=gateBarriers[room.id];if(b)b.visible=!isUnlocked(room);});
}
/* ============ UI HELPERS ============ */
function $(id){return document.getElementById(id);}
var toastTimer=null;
function toast(msg,ms){var t=$('toast');t.textContent=msg;t.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.style.display='none';},ms||2600);}
function anyChase(){return guardians.some(function(g){return g.state==='chase'||g.state==='alert';});}
function updateHUD(){
  $('coins').textContent=S.coins;
  $('colProg').textContent=discoveredCount()+' / '+TOTAL;
  $('speedPill').textContent='Lv '+S.speedLevel+' • ×'+speedMult().toFixed(2).replace(/0+$/,'').replace(/\.$/,'.0');
  $('playerLv').textContent=playerLevel();
  var ds=$('dockSpeedSub');if(ds)ds.textContent=S.speedLevel>=MAX_SPEED_LEVEL?'Lv MAX ⚡':'Lv '+S.speedLevel+(S.coins>=speedCost(S.speedLevel)?' • BISA BELI! '+fmt(speedCost(S.speedLevel))+' 🪙':' • berikutnya '+fmt(speedCost(S.speedLevel))+' 🪙');
  var dc=$('dockColSub');if(dc)dc.textContent=discoveredCount()+' / '+TOTAL+' • Basic–Secret';
  var sb=$('btnSpeed');if(sb)sb.classList.toggle('attention',S.speedLevel<3&&S.coins>=speedCost(S.speedLevel));
  var cb=$('carryBar'),ab=$('btnAction');
  if(S.extracted){cb.className='hud on ready';cb.innerHTML=thumbHTML(S.extracted.base)+'<span>AMAN! Tekan BUKA untuk membuka '+S.extracted.base.name+'</span>';ab.innerHTML='BUKA<br>🎁';ab.classList.add('open');}
  else if(S.carrying){cb.className='hud on';cb.innerHTML=thumbHTML(S.carrying.base)+'<span>Membawa '+S.carrying.base.name+' dari '+ROOMS[S.carrying.room-1].name+' — lari ke zona aman!</span>';ab.innerHTML='🏃<br>KABUR!';ab.classList.remove('open');}
  else{cb.className='hud';cb.innerHTML='';ab.innerHTML='AMBIL<br>🎯';ab.classList.remove('open');}
  updateRoomUI();
}
function updateRoomUI(){
  var pill=$('roomPill');
  if(S.currentRoom===0){pill.textContent='🏠 Zona Aman';}
  else{var room=ROOMS[S.currentRoom-1];pill.textContent='🚪 '+room.name+' • '+room.rarities;}
  pill.classList.toggle('danger',anyChase());
  var dots=$('roomDots');dots.innerHTML='';
  ROOMS.forEach(function(room){
    var d=document.createElement('span');d.className='dot'+(isUnlocked(room)?' open':'')+(S.currentRoom===room.id?' cur':'');d.title=room.name;dots.appendChild(d);
  });
}
function refreshStands(){
  var owned=Object.keys(S.collection).map(function(k){return S.collection[k];}).sort(function(a,b){return b.value-a.value;});
  stands.forEach(function(st,i){
    if(st.item){st.group.remove(st.item);st.item=null;}
    var want=owned[i];
    if(want&&(i===0||S.standLv>0)){var m=makeItemMesh(want.base);applyMutation(m,want.mut);m.position.set(0,1.85,0);m.scale.setScalar(1.15);st.group.add(m);st.item=m;}
  });
}
/* ============ GAME ACTIONS ============ */
var carryMesh=null;
function nearestItem(){var best=null,bd=2.6;items.forEach(function(it){if(it.taken)return;var d=Math.hypot(playerPos.x-it.x,playerPos.z-it.z);if(d<bd){bd=d;best=it;}});return best;}
function guardianOf(roomId){for(var i=0;i<guardians.length;i++)if(guardians[i].room.id===roomId)return guardians[i];return null;}
function resetGuardians(){
  guardians.forEach(function(g){if(g.state==='chase'||g.state==='alert')g.state='return';g.mesh.userData.bang.visible=false;});
  $('chaseBanner').classList.remove('on');
}
function doAction(){
  ac();
  if(S.extracted){openOpening();return;}
  if(S.carrying)return;
  var it=nearestItem();if(!it)return;
  it.taken=true;scene.remove(it.group);scene.remove(it.ped);scene.remove(it.ring);
  items=items.filter(function(x){return x!==it;});
  S.carrying={base:it.base,room:it.room};S.steals++;
  carryMesh=makeItemMesh(it.base);carryMesh.scale.setScalar(1.1);scene.add(carryMesh);
  var gd=guardianOf(it.room);
  if(gd){gd.state='alert';gd.alertTimer=gd.room.guard.reaction;gd.mesh.userData.bang.visible=true;}
  sfx('pickup');sfx('tung');
  $('chaseText').textContent='TUNG TUNG '+ROOMS[it.room-1].short+' MENGEJARMU! Lari ke zona aman!';
  $('chaseBanner').classList.add('on');
  toast('😱 KETAHUAN! Penjaga '+ROOMS[it.room-1].name+' mengejarmu — KABUR!',2200);
  respawnLater(it.base,it.room);
  updateHUD();
}
function checkUnlocks(){
  var newly=[];
  ROOMS.forEach(function(room){
    if(isUnlocked(room)&&!S.announced[room.id]){S.announced[room.id]=true;newly.push(room);}
  });
  if(newly.length){refreshGates();sfx('fanfare');toast('🔓 RUANGAN BARU TERBUKA: '+newly.map(function(r){return r.name;}).join(', ')+'!',3600);}
}
function onExtracted(){
  S.extracted=S.carrying;S.carrying=null;S.escapes++;
  if(carryMesh){scene.remove(carryMesh);carryMesh=null;}
  resetGuardians();
  sfx('safe');toast('🎉 SELAMAT! Ekstraksi ke-'+S.escapes+' berhasil. Tekan BUKA untuk membuka hadiah!',3000);
  checkUnlocks();
  updateHUD();
}
function onCaught(){
  if(carryMesh){scene.remove(carryMesh);carryMesh=null;}
  var dropped=S.carrying;S.carrying=null;S.caught++;
  resetGuardians();
  sfx('caught');sfx('drop');
  if(dropped)spawnItem(dropped.base,playerPos.x,Math.max(ROOMS[dropped.room-1].zMin+2,Math.min(playerPos.z,ROOMS[dropped.room-1].zMax-2)),dropped.room);
  playerPos.set(0,0,24);
  toast('💥 TERTANGKAP! "TUNG TUNG TUNG!" Barangmu jatuh di '+ (dropped?ROOMS[dropped.room-1].name:'taman') +'. Tidak ada koin untuk barang yang gagal diekstrak!',3200);
  if(S.speedLevel<3)showSpeedAlert(8000);
  updateHUD();
}
/* Opening flow */
var openingBusy=false;
function openOpening(){
  if(!S.extracted||openingBusy)return;
  $('openStage').innerHTML=visualHTML(S.extracted.base,true);$('openStage').className='';
  $('rarityBig').textContent='';$('rewardName').textContent=S.extracted.base.name;
  $('rewardMeta').textContent='Dari '+ROOMS[(S.extracted.room||1)-1].name+' — mutasi apa yang akan kamu dapat? 👀';
  $('btnOpen').style.display='block';$('btnCollect').style.display='none';
  $('openModal').classList.add('open');
}
$('btnOpen').addEventListener('click',function(){
  if(openingBusy||!S.extracted)return;openingBusy=true;ac();
  $('btnOpen').style.display='none';
  var st=$('openStage');st.classList.add('shake');sfx('tung');
  $('rewardName').textContent='Goyang… goyang… goyang…';
  setTimeout(function(){
    st.classList.remove('shake');st.classList.add('pop');
    var rw=rollReward(S.extracted.base,S.extracted.room);S.lastReward=rw;
    st.innerHTML=visualHTML(rw.base,true);
    var rb=$('rarityBig');rb.textContent='★ '+rw.rarity.name.toUpperCase()+' ★';rb.style.color=rw.rarity.color;
    $('rewardName').textContent=(rw.mut.id==='basic'?'':rw.mut.name+' ')+rw.base.name;
    $('rewardMeta').textContent='Rarity '+rw.rarity.name+' • Mutasi '+rw.mut.name+' • Nilai '+rw.value+' 🪙'+(S.collection[rw.key]?' • (sudah punya — tetap dapat koin!)':' • ✨ BARU di katalog!');
    $('coinGain').textContent=rw.value;
    $('btnCollect').style.display='block';
    if(rw.rarity.id==='legendary'||rw.rarity.id==='mythic'||rw.rarity.id==='secret')sfx('fanfare');else sfx('open');
    openingBusy=false;
  },1400);
});
$('btnCollect').addEventListener('click',function(){
  var rw=S.lastReward;if(!rw)return;
  S.coins+=rw.value;
  if(!S.collection[rw.key])S.collection[rw.key]={base:rw.base,mut:rw.mut,rarity:rw.rarity,value:rw.value};
  S.counts[rw.key]=(S.counts[rw.key]||0)+1;
  S.extracted=null;S.lastReward=null;
  $('openModal').classList.remove('open');sfx('coin');
  toast('🎁 +'+rw.value+' 🪙 dari '+ROOMS[rw.room-1].name+'! Koleksi: '+discoveredCount()+' / '+TOTAL,2600);
  refreshStands();updateHUD();
});
/* ============ CATALOGUE UI ============ */
var catFilter='all';
function renderCatalog(){
  $('catProgText').textContent=discoveredCount()+' / '+TOTAL+' ditemukan';
  $('catProgBar').style.width=(discoveredCount()/TOTAL*100)+'%';
  var tabs=$('catTabs');tabs.innerHTML='';
  CATS.forEach(function(c){var b=document.createElement('button');b.className='tab'+(catFilter===c.id?' on':'');b.textContent=c.name;b.addEventListener('click',function(){catFilter=c.id;renderCatalog();});tabs.appendChild(b);});
  var grid=$('catGrid');grid.innerHTML='';
  CATALOG.forEach(function(e){
    if(catFilter!=='all'&&e.cat!==catFilter)return;
    var ownedInst=S.collection[e.key];var owned=!!ownedInst;
    var dispRarity=owned?ownedInst.rarity:e.rarity;
    var card=document.createElement('div');card.className='card'+(owned?'':' locked');
    card.innerHTML='<div class="tile">'+visualHTML(e.base)+'</div><div class="nm">'+(owned?(e.mut.id==='basic'?'':e.mut.name+' ')+e.base.name:'???')+'</div><span class="tag" style="background:'+(owned?dispRarity.color:'#7a828e')+'">'+(owned?dispRarity.name:'Undiscovered')+'</span>'+(owned&&S.counts[e.key]>1?'<div style="font-size:11px;font-weight:900">× '+S.counts[e.key]+'</div>':'');
    card.addEventListener('click',function(){showDetail(e,owned);});
    grid.appendChild(card);
  });
}
function showDetail(e,owned){
  var inst=S.collection[e.key];
  $('detTitle').textContent=owned?((e.mut.id==='basic'?'':e.mut.name+' ')+e.base.name):'??? Belum Ditemukan';
  $('detEmo').innerHTML=owned?visualHTML(e.base,true):'<span class="emo-big">❓</span>';
  $('detRarity').textContent=owned?inst.rarity.name:'—';
  $('detMut').textContent=owned?e.mut.name:'—';
  $('detStatus').textContent=owned?('✅ Dimiliki × '+(S.counts[e.key]||1)):'🔒 Belum ditemukan';
  $('detValue').textContent=owned?(inst.value+' 🪙'):'—';
  $('detDesc').textContent=owned?e.base.desc:'Curi '+e.base.name+' dari ruangan mana pun, kabur ke zona aman, dan buka hadiahnya untuk menemukan varian ini. Ruangan lebih jauh = peluang rarity lebih tinggi!';
  $('detailModal').classList.add('open');
}
$('btnCatalog').addEventListener('click',function(){ac();renderCatalog();$('catModal').classList.add('open');});
/* ============ ROOMS UI ============ */
function renderRooms(){
  var list=$('roomsList');list.innerHTML='<p style="font-weight:900;margin-top:0">Ekstraksi berhasilmu: '+S.escapes+' • Level pemain: '+playerLevel()+'</p>';
  ROOMS.forEach(function(room){
    var un=isUnlocked(room);
    var row=document.createElement('div');row.className='roomrow'+(un?'':' locked');
    row.innerHTML='<div class="swatch" style="background:'+room.accentCss+'"></div><div class="info"><b>Room '+room.id+' — '+room.name+'</b><div>Rarity: '+room.rarities+'<br>Penjaga: '+room.diff+' • Kecepatan kejar '+room.guard.chase.toFixed(1)+'<br>Penjaga mengejar sampai gerbang Zona Aman.<br>'+(un?'Sudah bisa dimasuki.':'Butuh '+room.unlock+' ekstraksi berhasil (kamu: '+S.escapes+').')+'</div></div><span class="st" style="background:'+(un?'#d9f5df':'#f3d7d7')+'">'+(un?'🔓 TERBUKA':'🔒 TERKUNCI')+'</span>';
    list.appendChild(row);
  });
}
$('btnRooms').addEventListener('click',function(){ac();renderRooms();$('roomsModal').classList.add('open');});
/* ============ SPEED SHOP ============ */
function fmt(n){return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.');}
function renderSpeedShop(){
  var body=$('speedBody');
  var maxed=S.speedLevel>=MAX_SPEED_LEVEL;
  var cost=maxed?0:speedCost(S.speedLevel);
  var afford=S.coins>=cost;
  var curSpeed=(8.6*speedMult());
  var nextSpeed=(8.6*Math.pow(1.1,S.speedLevel));
  var html='<div class="kv"><span>🪙 Koin kamu</span><span>'+fmt(S.coins)+'</span></div>'
    +'<div class="kv"><span>CURRENT SPEED</span><span>Level '+S.speedLevel+'</span></div>'
    +'<div class="kv"><span>Kecepatan lari sekarang</span><span>'+curSpeed.toFixed(1)+' (×'+speedMult().toFixed(2)+')</span></div>';
  if(maxed){
    html+='<div class="kv"><span>Status</span><span>⚡ LEVEL MAKSIMUM</span></div><p style="font-weight:800;line-height:1.5">Kamu sudah di Level '+MAX_SPEED_LEVEL+' — kecepatan tertinggi. Penjaga ruangan jauh tetap berbahaya, jadi tetap hati-hati!</p>';
  }else{
    html+='<div class="kv"><span>NEXT UPGRADE</span><span>Level '+(S.speedLevel+1)+'</span></div>'
      +'<div class="kv"><span>Speed Increase</span><span>+10% → '+nextSpeed.toFixed(1)+'</span></div>'
      +'<div class="kv"><span>Upgrade Cost</span><span>'+fmt(cost)+' Coins</span></div>'
      +'<button class="bigbtn" id="btnBuySpeed" style="margin-top:12px" '+(afford?'':'disabled')+'>'+(afford?'⚡ UPGRADE SPEED':'🔒 KURANG '+fmt(cost-S.coins)+' COINS LAGI')+'</button>'
      +'<p class="fineprint" style="margin-top:10px">Harga naik 5× tiap level: 100 → 500 → 2.500 → 12.500 → 62.500 → 312.500 … Maksimum Level '+MAX_SPEED_LEVEL+'. Upgrade berlaku permanen selama sesi bermain ini.</p>';
  }
  body.innerHTML=html;
  var btn=$('btnBuySpeed');
  if(btn)btn.addEventListener('click',function(){
    if(S.speedLevel>=MAX_SPEED_LEVEL||S.coins<speedCost(S.speedLevel))return;
    S.coins-=speedCost(S.speedLevel);S.speedLevel++;
    sfx('zap');sfx('fanfare');
    var fx=$('flashFx');fx.classList.remove('go');void fx.offsetWidth;fx.classList.add('go');
    toast('⚡ SPEED LEVEL UP! Sekarang Level '+S.speedLevel+' (×'+speedMult().toFixed(2)+' kecepatan lari)!',3000);
    renderSpeedShop();updateHUD();
  });
}
$('btnSpeed').addEventListener('click',function(){ac();renderSpeedShop();$('speedModal').classList.add('open');});
/* ============ BASE UPGRADES (luck + display stands) ============ */
var UPGS=[
 {id:'luck',emo:'🍀',name:'Jimat Keberuntungan',desc:'Peluang rarity naik satu tingkat tiap membuka hadiah.',cost:function(){return 180*(S.luckLv+1);},lv:function(){return S.luckLv;},max:4},
 {id:'stand',emo:'🏆',name:'Etalase Markas Mewah',desc:'Pajang sampai 5 koleksi terbaikmu di zona aman.',cost:function(){return 250;},lv:function(){return S.standLv;},max:1}
];
function renderUpgrades(){
  var list=$('upgList');list.innerHTML='<p style="font-weight:900;margin-top:0">Saldo: '+fmt(S.coins)+' 🪙 • Untuk kecepatan lari, ketuk tombol ⚡ BELI SPEED di dock tengah bawah.</p>';
  UPGS.forEach(function(u){
    var lv=u.lv(),maxed=lv>=u.max,cost=maxed?0:u.cost();
    var row=document.createElement('div');row.className='upg';
    row.innerHTML='<div class="emo">'+u.emo+'</div><div class="info"><b>'+u.name+' • Lv '+lv+'</b><div>'+u.desc+'</div></div>';
    var btn=document.createElement('button');btn.className='buybtn';btn.textContent=maxed?'MAX':(fmt(cost)+' 🪙');btn.disabled=maxed||S.coins<cost;
    btn.addEventListener('click',function(){
      if(S.coins<u.cost())return;S.coins-=u.cost();
      if(u.id==='luck')S.luckLv++;if(u.id==='stand')S.standLv++;
      sfx('coin');refreshStands();renderUpgrades();updateHUD();
    });
    row.appendChild(btn);list.appendChild(row);
  });
}
$('btnUpg').addEventListener('click',function(){ac();renderUpgrades();$('upgModal').classList.add('open');});
$('btnSound').addEventListener('click',function(){S.muted=!S.muted;var w=document.querySelector('#btnSound .snd-waves');if(w)w.style.display=S.muted?'none':'';$('btnSound').style.opacity=S.muted?.55:1;if(!S.muted)sfx('coin');});
document.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click',function(){$(b.getAttribute('data-close')).classList.remove('open');});});
$('btnAction').addEventListener('click',doAction);
$('btnSprint').addEventListener('click',function(){sprinting=!sprinting;$('btnSprint').classList.toggle('on',sprinting);});
var speedAlertTimer=null,speedAlertSeen=false;
function showSpeedAlert(ms){var a=$('speedAlert');if(!a)return;a.classList.add('on');speedAlertSeen=true;clearTimeout(speedAlertTimer);speedAlertTimer=setTimeout(function(){a.classList.remove('on');},ms||9000);}
function hideSpeedAlert(){$('speedAlert').classList.remove('on');clearTimeout(speedAlertTimer);}
$('speedAlertClose').addEventListener('click',hideSpeedAlert);
$('btnSpeedAlert').addEventListener('click',function(){hideSpeedAlert();ac();renderSpeedShop();$('speedModal').classList.add('open');});
$('btnStartSpeed').addEventListener('click',function(){ac();renderSpeedShop();$('speedModal').classList.add('open');});
$('btnStart').addEventListener('click',function(){ac();S.started=true;$('start').style.display='none';toast('🏃 Basic Room ada tepat di depan gerbang. Ambil barang terdekat, lalu kabur!',3400);updateHUD();showSpeedAlert(10000);});
/* ============ INPUT ============ */
window.addEventListener('keydown',function(e){keys[e.key.toLowerCase()]=true;if(e.key===' '||e.key.toLowerCase()==='e'){e.preventDefault();if(S.started)doAction();}});
window.addEventListener('keyup',function(e){keys[e.key.toLowerCase()]=false;});
var joyEl=$('joy'),knob=$('joyKnob'),joyId=null;
function joySet(dx,dy){var len=Math.hypot(dx,dy),max=34;if(len>max){dx=dx/len*max;dy=dy/len*max;}knob.style.transform='translate(calc(-50% + '+dx+'px),calc(-50% + '+dy+'px))';joyVec.x=dx/max;joyVec.y=dy/max;}
joyEl.addEventListener('pointerdown',function(e){joyId=e.pointerId;joyEl.setPointerCapture(joyId);var r=joyEl.getBoundingClientRect();joySet(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2));ac();});
joyEl.addEventListener('pointermove',function(e){if(e.pointerId!==joyId)return;var r=joyEl.getBoundingClientRect();joySet(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2));});
function joyEnd(e){if(e.pointerId===joyId){joyId=null;joyVec.x=0;joyVec.y=0;knob.style.transform='translate(-50%,-50%)';}}
joyEl.addEventListener('pointerup',joyEnd);joyEl.addEventListener('pointercancel',joyEnd);
var dragId=null,lastPX=0;
document.addEventListener('pointerdown',function(e){if(e.target.closest('button')||e.target.closest('.modal')||e.target.closest('#joy')||e.target.closest('#start'))return;dragId=e.pointerId;lastPX=e.clientX;});
document.addEventListener('pointermove',function(e){if(e.pointerId===dragId){camYaw-=(e.clientX-lastPX)*.005;lastPX=e.clientX;}});
document.addEventListener('pointerup',function(e){if(e.pointerId===dragId)dragId=null;});
/* ============ BOT AI (rival bots stay around Basic Room + safe zone) ============ */
function updateBot(b,dt,t){
  var ai=b.userData.ai;ai.t-=dt;
  var p=b.position;
  if(ai.t<=0){
    if(ai.phase==='idle'){ai.phase='run';ai.target.set(Math.random()*64-32,0,-2-Math.random()*12);ai.t=6+Math.random()*4;}
    else if(ai.phase==='run'){ai.phase='back';if(!ai.carry&&Math.random()<.8){ai.carry=makeItemMesh(BASES[Math.floor(Math.random()*BASES.length)]);ai.carry.scale.setScalar(.95);b.add(ai.carry);ai.carry.position.set(0,3.15,0);}ai.target.set(Math.random()*16-8,0,22+Math.random()*5);ai.t=7;}
    else{ai.phase='idle';ai.t=2+Math.random()*3;if(ai.carry){b.remove(ai.carry);ai.carry=null;}}
  }
  var dx=ai.target.x-p.x,dz=ai.target.z-p.z,d=Math.hypot(dx,dz);
  if(d>.4){var sp=ai.phase==='back'?7.5:5.5;p.x+=dx/d*sp*dt;p.z+=dz/d*sp*dt;b.rotation.y=Math.atan2(dx,dz);
    var sw=Math.sin(t*11+b.id)*.55;b.userData.legL.rotation.x=sw;b.userData.legR.rotation.x=-sw;b.userData.armL.rotation.x=-sw;b.userData.armR.rotation.x=sw;}
  else{b.userData.legL.rotation.x=0;b.userData.legR.rotation.x=0;}
}
/* ============ GUARDIAN AI (one per room; patrols its room, chases map-wide to the safe gate) ============ */
/* While chasing or returning home, steer through the gate gap of the nearest room boundary
   between the guardian and its target, so it crosses rooms instead of clipping divider walls. */
function gateWaypoint(gd,tx,tz){
  var ep=gd.mesh.position,best=null,bd=1e9;
  for(var i=0;i<BOUNDARIES.length;i++){
    var b=BOUNDARIES[i];
    if((ep.z-b.z)*(tz-b.z)<0){var d=Math.abs(ep.z-b.z);if(d<bd){bd=d;best=b;}}
  }
  if(!best)return {x:tx,z:tz};
  if(Math.abs(ep.x)>best.gap-0.8)return {x:0,z:ep.z}; /* slide sideways to the gate opening first */
  return {x:0,z:best.z+(tz>ep.z?1.6:-1.6)};
}
function updateGuardian(gd,dt,t){
  var room=gd.room,ud=gd.mesh.userData,ep=gd.mesh.position;
  var eSpeed=0,eTarget=null;
  if(gd.state==='alert'){
    gd.alertTimer-=dt;ep.y=Math.abs(Math.sin(t*16))*.25;
    if(gd.alertTimer<=0){gd.state='chase';gd.tungTimer=0;updateRoomUI();}
  }else if(gd.state==='chase'){
    /* The chase does NOT end at the room edge: the guardian pursues across every room
       until the player crosses the safe gate (or drops / loses the loot). */
    if(!S.carrying||playerPos.z>BOUND_Z+0.4){
      gd.state='return';ud.bang.visible=false;$('chaseBanner').classList.remove('on');updateRoomUI();
    }else{
      eTarget=playerPos;eSpeed=room.guard.chase;
      gd.tungTimer-=dt;if(gd.tungTimer<=0){gd.tungTimer=1.15;sfx('tung');}
      var distE=Math.hypot(playerPos.x-ep.x,playerPos.z-ep.z);
      if(distE<room.guard.attack){onCaught();return;}
    }
  }else if(gd.state==='return'){
    eTarget=gd.home;eSpeed=room.guard.patrol*1.9;
    if(Math.hypot(ep.x-gd.home.x,ep.z-gd.home.z)<1.2)gd.state='patrol';
  }else{ /* patrol — also notices a thief carrying this room's loot inside detection radius */
    if(S.carrying&&S.carrying.room===room.id&&playerPos.z<=room.zMax&&playerPos.z>=room.zMin){
      var dd=Math.hypot(playerPos.x-ep.x,playerPos.z-ep.z);
      if(dd<room.guard.detect){gd.state='alert';gd.alertTimer=room.guard.reaction;ud.bang.visible=true;sfx('tung');
        $('chaseText').textContent='TUNG TUNG '+room.short+' MENGEJARMU! Lari ke zona aman!';$('chaseBanner').classList.add('on');updateRoomUI();}
    }
    var pt=gd.pts[gd.idx];eTarget=pt;eSpeed=room.guard.patrol;
    if(Math.hypot(ep.x-pt.x,ep.z-pt.z)<1.1)gd.idx=(gd.idx+1)%gd.pts.length;
  }
  if(eTarget&&gd.state!=='alert'){
    var destX=eTarget.x,destZ=eTarget.z;
    if(gd.state==='chase'||gd.state==='return'){var gw=gateWaypoint(gd,destX,destZ);destX=gw.x;destZ=gw.z;}
    var edx=destX-ep.x,edz=destZ-ep.z,ed=Math.hypot(edx,edz);
    if(ed>.15){ep.x+=edx/ed*eSpeed*dt;ep.z+=edz/ed*eSpeed*dt;gd.mesh.rotation.y=Math.atan2(edx,edz);}
    ep.x=Math.max(-45,Math.min(45,ep.x));
    if(gd.state==='patrol'){ep.z=Math.max(room.zMin+0.7,Math.min(room.zMax-0.7,ep.z));} /* patrol stays in its own room */
    else{ep.z=Math.max(-166,Math.min(BOUND_Z-0.8,ep.z));} /* chase/return roam the whole map — but NEVER enter the safe zone */
    var esw=Math.sin(t*(gd.state==='chase'?13:7))*.55;
    ud.legL.rotation.x=esw;ud.legR.rotation.x=-esw;ud.armR.rotation.x=gd.state==='chase'?Math.sin(t*13)*.8-.4:-.9;
    ep.y=gd.state==='chase'?Math.abs(Math.sin(t*13))*.12:0;
  }
}
/* ============ MAIN LOOP ============ */
function animate(){
  requestAnimationFrame(animate);
  var dt=0;try{dt=Math.min(clock.getDelta(),.05);}catch(e){dt=.016;}
  var t=clock.elapsedTime;
  try{
    if(S.started){
      var ix=joyVec.x,iz=joyVec.y;
      if(keys['a']||keys['arrowleft'])ix-=1;if(keys['d']||keys['arrowright'])ix+=1;
      if(keys['w']||keys['arrowup'])iz-=1;if(keys['s']||keys['arrowdown'])iz+=1;
      var il=Math.hypot(ix,iz);if(il>1){ix/=il;iz/=il;}
      var run=(sprinting||keys['shift'])?1.45:1;
      var speed=8.6*speedMult()*run*(S.carrying?.88:1);
      var moving=il>.12;
      var prevX=playerPos.x,prevZ=playerPos.z;
      if(moving){
        var fx=-Math.sin(camYaw),fz=-Math.cos(camYaw);
        var rx=Math.cos(camYaw),rz=-Math.sin(camYaw);
        var mx=fx*(-iz)+rx*ix,mz=fz*(-iz)+rz*ix;
        playerPos.x+=mx*speed*dt;playerPos.z+=mz*speed*dt;
        player.rotation.y=Math.atan2(mx,mz);
        var sw=Math.sin(t*(run>1?14:10.5))*.6;
        player.userData.legL.rotation.x=sw;player.userData.legR.rotation.x=-sw;
        player.userData.armL.rotation.x=-sw;player.userData.armR.rotation.x=sw;
        stepTimer-=dt;if(stepTimer<=0){stepTimer=run>1?.26:.34;sfx('step');}
      }else{player.userData.legL.rotation.x=0;player.userData.legR.rotation.x=0;player.userData.armL.rotation.x=Math.sin(t*2)*.06;player.userData.armR.rotation.x=-Math.sin(t*2)*.06;}
      playerPos.x=Math.max(-45,Math.min(45,playerPos.x));
      playerPos.z=Math.max(-166,Math.min(31,playerPos.z));
      /* Gate / wall collision: divider walls block outside the gap; locked gates block the gap */
      BOUNDARIES.forEach(function(b){
        if((prevZ-b.z)*(playerPos.z-b.z)<0){
          if(Math.abs(playerPos.x)>b.gap){playerPos.z=prevZ;}
          else if(playerPos.z<prevZ&&!b.always){
            var rm=ROOMS[b.north-1];
            if(!isUnlocked(rm)){playerPos.z=prevZ;
              var now=Date.now();
              if(now-S.lockToastAt>2500){S.lockToastAt=now;toast('🔒 '+rm.name+' terkunci! Butuh '+rm.unlock+' ekstraksi berhasil (kamu: '+S.escapes+'). Rarity di sana: '+rm.rarities+'.',3000);}
            }
          }
        }
      });
      player.position.copy(playerPos);player.position.y=Math.abs(Math.sin(t*10.5))*(moving?.06:0)+Math.sin(t*2)*.02;
      if(carryMesh){carryMesh.position.set(playerPos.x,3.55+Math.sin(t*3.2)*.12,playerPos.z);carryMesh.rotation.y=t*1.6;}
      /* Room enter detection + notification */
      var rNow=roomAt(playerPos.z);
      if(rNow!==S.currentRoom){
        S.currentRoom=rNow;
        if(rNow>0){var rm2=ROOMS[rNow-1];toast('🚪 Memasuki '+rm2.name+' — Rarity: '+rm2.rarities+' • Penjaga: '+rm2.diff,2600);sfx('open');}
        updateRoomUI();
      }
      if(S.carrying&&playerPos.z>BOUND_Z+1.2)onExtracted();
      items.forEach(function(it){it.group.position.y=1.05+Math.sin(t*2.2+it.bob)*.14;it.group.rotation.y=t*.9+it.bob;it.ring.rotation.z=t*1.4;});
      guardians.forEach(function(gd){updateGuardian(gd,dt,t);});
      bots.forEach(function(b){updateBot(b,dt,t);});
      if(scene.userData.beam)scene.userData.beam.material.emissiveIntensity=1.1+Math.sin(t*3)*.5;
      if(scene.userData.line)scene.userData.line.material.opacity=.55+Math.sin(t*3)*.25;
      gateBarriers[6]&&(gateBarriers[6].material.opacity=.22+Math.sin(t*3)*.14);
      animDeco.forEach(function(d){if(d.spin){d.mesh.rotation.z=t*0.8;}else{d.mesh.position.y=d.baseY+Math.sin(t*1.8+d.ph)*.35;}});
      decorGroup.children.forEach(function(ch,i){if(ch.geometry&&ch.geometry.type==='OctahedronGeometry')ch.rotation.y=t*.7+i;});
    }
    var ar=camera.aspect;
    var camDist=ar<0.75?17.5:(ar<1.1?14.5:11.5),camH=ar<1?9.5:7.2;
    var offX=Math.sin(camYaw)*camDist,offZ=Math.cos(camYaw)*camDist;
    var desired=new THREE.Vector3(playerPos.x+offX,camH,playerPos.z+offZ);
    camera.position.lerp(desired,.08);
    camera.lookAt(playerPos.x,1.6,playerPos.z);
  }catch(err){var d=$('err');d.style.display='block';d.textContent='Error: '+err.message;}
  renderer.render(scene,camera);
}
/* ============ BOOT ============ */
try{
  buildWorld();clock=new THREE.Clock();
  document.getElementById('colProg').textContent='0 / '+TOTAL;
  updateHUD();animate();
}catch(err){var d=$('err');d.style.display='block';d.textContent='Gagal memuat 3D: '+err.message;}

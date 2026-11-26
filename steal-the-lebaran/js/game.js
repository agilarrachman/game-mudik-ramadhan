
"use strict";
window.addEventListener('error',function(e){var d=document.getElementById('err');d.style.display='block';d.textContent='Ups, ada error: '+(e.message||'tidak dikenal');});
/* ============ DATA ============ */
var RARITIES=[
 {id:'basic',name:'Basic',color:'#9aa3ad',w:40,value:20},
 {id:'rare',name:'Rare',color:'#2f7fe0',w:30,value:80},
 {id:'legendary',name:'Legendary',color:'#f5a623',w:20,value:300},
 {id:'secret',name:'Secret',color:'#22242c',w:10,value:1000}
];
var COIN_RANGES={basic:[10,30],rare:[50,120],legendary:[200,500],secret:[800,1500]};
var MUTATIONS=[
 {id:'basic',name:'Basic',mult:1,w:50,tint:null},
 {id:'golden',name:'Golden',mult:3,w:26,tint:0xffc93c},
 {id:'diamond',name:'Diamond',mult:5,w:16,tint:0x9be8ff},
 {id:'celestial',name:'Celestial',mult:12,w:8,tint:0xfff3b0}
];
var BASES=[
 {id:'ketupat',name:'Ketupat',emo:'🧆',cat:'ketupat',color:0x3da33f,img:'assets/hd-ketupat.png',desc:'Anyaman daun kelapa berisi beras, ikon wajib meja Lebaran.'},
 {id:'lantern',name:'Lentera Ramadan',emo:'🏮',cat:'ramadan',color:0xd9a441,img:'assets/hd-lantern.png',desc:'Lentera hangat yang menerangi malam Ramadan.'},
 {id:'crescent',name:'Bulan Sabit',emo:'🌙',cat:'ramadan',color:0xffc93c,img:'assets/hd-crescent.png',desc:'Sabit emas penanda datangnya bulan suci.'},
 {id:'mosque',name:'Ornamen Masjid',emo:'🕌',cat:'ramadan',color:0x2f9e8f,img:'assets/hd-mosque.png',desc:'Miniatur masjid dengan kubah hijau yang megah.'},
 {id:'bedug',name:'Bedug',emo:'🥁',cat:'ramadan',color:0xa06a35,img:'assets/hd-bedug.png',desc:'Bedug besar penanda waktu berbuka dan takbiran.'},
 {id:'nastar',name:'Nastar',emo:'🍍',cat:'food',color:0xf08c1e,img:'assets/hd-nastar.png',desc:'Kue nanas lumer di mulut, primadona toples Lebaran.'},
 {id:'giftbox',name:'Kotak Hadiah Idul Fitri',emo:'🎁',cat:'special',color:0x2fae4e,img:'assets/hd-gift.png',desc:'Parsel misterius untuk sanak saudara.'},
 {id:'thr',name:'Amplop THR',emo:'🧧',cat:'special',color:0x2fbf71,img:'assets/hd-thr.png',desc:'Amplop hijau berisi THR yang paling ditunggu anak-anak.'},
 {id:'baju',name:'Baju Lebaran',emo:'👕',cat:'outfit',color:0x1d2c5e,img:'assets/hd-baju.png',desc:'Baju koko baru untuk salat Id dan silaturahmi.'},
 {id:'decor',name:'Dekorasi Idul Fitri',emo:'✨',cat:'special',color:0xff7ab6,img:'assets/hd-decor.png',desc:'Hiasan bintang dan lampu warna-warni khas Lebaran.'}
];
function baseById(id){for(var i=0;i<BASES.length;i++)if(BASES[i].id===id)return BASES[i];return BASES[0];}
var CATS=[{id:'all',name:'Semua'},{id:'main',name:'Koleksi Utama (15)'},{id:'secret',name:'Secret (5)'}];
var MUT_RARITY={basic:'basic',golden:'rare',diamond:'legendary',celestial:'secret'};
var CATALOG=[];
['ketupat','nastar','lantern','giftbox','baju'].forEach(function(bid){
  ['basic','golden','diamond'].forEach(function(mid){
    var b=baseById(bid),m=MUTATIONS.filter(function(x){return x.id===mid})[0];
    var r=RARITIES.filter(function(x){return x.id===MUT_RARITY[mid]})[0];
    CATALOG.push({key:bid+'_'+mid,base:b,mut:m,rarity:r,value:r.value,cat:'main'});
  });
});
['crescent','mosque','bedug','thr','decor'].forEach(function(bid){
  var b=baseById(bid),m=MUTATIONS.filter(function(x){return x.id==='celestial'})[0];
  var r=RARITIES.filter(function(x){return x.id==='secret'})[0];
  CATALOG.push({key:bid+'_celestial',base:b,mut:m,rarity:r,value:r.value,cat:'secret'});
});
var TOTAL=CATALOG.length;
/* ============ ROOMS ============ */
/* Linear progression north from the safe zone. unlock = successful extractions needed.
   guard: patrol/chase speeds, detection radius, reaction time (s) before the chase starts. */
var ROOMS=[
 {id:1,name:'Ruangan Pemula',short:'BASIC',guardName:'Si Penjaga Jahat',glow:0xff6a00,glowCss:'#ff7a1a',rarities:'Basic',floor:0x5db84c,accent:0x2f9e6e,accentCss:'#2f9e6e',zMin:-18,zMax:12,unlock:0,diff:'Mudah ★☆☆☆',guard:{patrol:2.6,chase:7.2,detect:11,reaction:.8,attack:1.7},items:['ketupat','nastar','lantern']},
 {id:2,name:'Ruangan Penakluk',short:'RARE',guardName:'Penjaga Sangat Jahat',glow:0x00b7ff,glowCss:'#35c4ff',rarities:'Rare • Golden',floor:0x4a90d9,accent:0x35c4e8,accentCss:'#35c4e8',zMin:-48,zMax:-18,unlock:2,diff:'Sedang ★★☆☆',guard:{patrol:3.2,chase:8.6,detect:15,reaction:.55,attack:1.7},items:['giftbox','baju','ketupat']},
 {id:3,name:'Ruangan Sang Legenda',short:'LEGEND',guardName:'Mister Penjaga Sangat Jahat',glow:0xff1e3c,glowCss:'#ff2a3c',rarities:'Legendary • Diamond',floor:0xe8a33d,accent:0xf5a623,accentCss:'#f5a623',zMin:-78,zMax:-48,unlock:5,diff:'Susah ★★★★',guard:{patrol:3.8,chase:10.2,detect:19,reaction:.35,attack:1.8},items:['nastar','baju','giftbox']},
 {id:4,name:'Ruangan Rahasia Mythic',short:'SECRET',guardName:'Ketua Para Penjaga Jahat',glow:0xb46ae0,glowCss:'#b46ae0',rarities:'Secret Eksklusif',floor:0x33254d,accent:0xb46ae0,accentCss:'#b46ae0',zMin:-108,zMax:-78,unlock:15,secret:true,diff:'Mimpi Buruk ★★★★★',guard:{patrol:4.4,chase:11.6,detect:23,reaction:.2,attack:1.9},items:['crescent','mosque','bedug','thr','decor']}
];
/* Gate boundaries between zones: z line, half-width of the open gap, room north of it. */
var BOUNDARIES=[{z:12,gap:6.8,north:1,always:true},{z:-18,gap:5,north:2},{z:-48,gap:5,north:3},{z:-78,gap:5,north:4}];
function roomAt(z){if(z>12)return 0;for(var i=0;i<ROOMS.length;i++){if(z<=ROOMS[i].zMax&&z>ROOMS[i].zMin)return ROOMS[i].id;}return 4;}
function isUnlocked(room){if(room.secret)return S.secretRevealed===true;return S.escapes>=room.unlock;}
function unlockText(room){if(room.secret)return 'Ruangan rahasia masih tersembunyi di dalam bumi — butuh 15 katalog terbuka (kamu: '+discoveredCount()+' / 15).';return 'Butuh '+room.unlock+' ekstraksi berhasil (kamu: '+S.escapes+').';}
/* ============ REWARD ROLLS ============ */
function catImg(base,mut){return 'assets/catalog/'+base.id+'_'+mut.id+'.png';}
function visualHTML(base,big,mut){
  if(mut)return '<img class="asset-img catimg mut-'+mut.id+'" src="'+catImg(base,mut)+'" alt="'+base.name+' '+mut.name+'">';
  if(base.img)return '<img class="asset-img" src="'+base.img+'" alt="'+base.name+'">';
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
  var pools={1:[['basic',100]],2:[['basic',55],['golden',45]],3:[['golden',45],['diamond',55]],4:[['celestial',100]]};
  var pool=pools[room.id]||pools[1];
  var m=pickFromWeights(pool.map(function(p){return [MUTATIONS.filter(function(x){return x.id===p[0]})[0],p[1]];}));
  if(S.luckLv>0&&room.id<4&&Math.random()<S.luckLv*0.09){var order=['basic','golden','diamond'];var oi=order.indexOf(m.id);if(oi>-1&&oi<2)m=MUTATIONS.filter(function(x){return x.id===order[oi+1]})[0];}
  var r=RARITIES.filter(function(x){return x.id===MUT_RARITY[m.id]})[0];
  var range=COIN_RANGES[r.id]||[10,30];
  var value=Math.max(5,Math.round((range[0]+Math.random()*(range[1]-range[0]))/5)*5);
  return {base:base,rarity:r,mut:m,value:value,key:base.id+'_'+m.id,room:room.id};
}
/* ============ STATE ============ */
var S={coins:150,collection:{},counts:{},carrying:null,extracted:null,started:false,muted:false,secretRevealed:false,secretRevealing:false,
 speedLevel:1,luckLv:0,standLv:0,outfit:0,steals:0,escapes:0,caught:0,lastReward:null,currentRoom:0,announced:{1:true},lockToastAt:0};
var MAX_SPEED_LEVEL=10;
function speedCost(level){return 100*Math.pow(3,level-1);} /* cost from `level` to level+1 */
function speedMult(){return Math.pow(1.1,S.speedLevel-1);}
function playerLevel(){return 1+Math.floor(S.escapes/3)+Math.floor(discoveredCount()/5);}
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
 if(name==='roar'){tone(92,0,.35,'sawtooth',.16,54);tone(70,.12,.42,'sawtooth',.14,44);tone(120,.3,.2,'sawtooth',.08,60);}
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
var secretGroup=null,secretCover=null;
var reveal={active:false,t:0,shown:false,lastRoar:0};
var camYaw=0;
var rainbowFx=[];
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
/* ===== Bondee-style chibi avatar: big round head, soft clay proportions, outfit styles ===== */
var OUTFITS=[
 {name:'Koko Biru',shirt:0x2f7fe0,pants:0x2b3a55,hair:'peci',hairColor:0x1c1c22,acc:null,shoe:0xffffff},
 {name:'Hijab Pink',shirt:0x3d3d47,pants:0x33333d,hair:'hijab',hairColor:0xf2a3b8,acc:null,shoe:0xffffff,longDress:true},
 {name:'Puffer Hitam',shirt:0x23242a,pants:0x2a2d34,hair:'cap',hairColor:0x14151a,acc:'skate',shoe:0x1c1c22},
 {name:'Koko Hijau Emas',shirt:0x1da851,pants:0x3a2c14,hair:'peci',hairColor:0x1c1c22,acc:null,shoe:0xffffff}
];
function capsule(r,len,c,x,y,z){var ms=new THREE.Mesh(new THREE.CapsuleGeometry(r,len,6,14),mat(c,.55));ms.position.set(x||0,y||0,z||0);ms.castShadow=true;return ms;}
function makeAvatar(shirt,pants,skin,style){
  style=style||{hair:'peci',hairColor:0x1c1c22,acc:null,shoe:0xffffff};
  var g=new THREE.Group();
  function leg(sx){
    var lg=new THREE.Group();lg.position.set(sx,1.04,0);
    var th=cyl(.17,.16,.44,pants,0,-.2,0,10);lg.add(th);
    var sh=cyl(.145,.135,.42,(style&&style.longDress)?pants:skin,0,-.6,0,10);lg.add(sh);
    var sock=cyl(.15,.15,.14,0xffffff,0,-.78,0,10);lg.add(sock);
    var shoe=box(.32,.15,.5,style.shoe||0xffffff,0,-.9,.07);lg.add(shoe);
    var sole=box(.34,.06,.54,0x2b2118,0,-.99,.07);lg.add(sole);
    g.add(lg);return lg;
  }
  var legL=leg(-.22),legR=leg(.22);
  var body=capsule(.5,.42,shirt,0,1.66,0);
  var hem=cyl(.51,.53,.16,shirt,0,1.14,0,14);
  var collar=new THREE.Mesh(new THREE.TorusGeometry(.24,.07,8,18),mat(0xffffff,.6));collar.position.set(0,2.22,.18);collar.rotation.x=1.1;
  var btn1=sph(.05,0xffc93c,0,1.98,.5),btn2=sph(.05,0xffc93c,0,1.76,.53),btn3=sph(.05,0xffc93c,0,1.54,.53);
  function arm(sx){
    var ag=new THREE.Group();ag.position.set(sx,2.06,0);
    var a=capsule(.155,.5,shirt,0,-.36,0);ag.add(a);
    var hand=sph(.15,skin,0,-.78,0);ag.add(hand);
    g.add(ag);return ag;
  }
  var armL=arm(-.6),armR=arm(.6);
  var head=sph(.57,skin,0,2.74,0);head.material=mat(skin,.5);
  var earL=sph(.13,skin,-.57,2.74,0),earR=sph(.13,skin,.57,2.74,0);
  var eyeM=new THREE.MeshStandardMaterial({color:0x1c1c22,roughness:.12,metalness:.1});
  var e1=new THREE.Mesh(new THREE.SphereGeometry(.078,12,10),eyeM);e1.position.set(-.2,2.82,.5);
  var e2=e1.clone();e2.position.x=.2;
  var sp1=sph(.026,0xffffff,-.17,2.86,.56),sp2=sph(.026,0xffffff,.23,2.86,.56);
  sp1.material=new THREE.MeshBasicMaterial({color:0xffffff});sp2.material=sp1.material;
  var browL=box(.17,.04,.03,0x4a3423,-.2,3.0,.53),browR=box(.17,.04,.03,0x4a3423,.2,3.0,.53);
  var nose=sph(.05,skin,0,2.7,.56);nose.material=mat(0xf2b98a,.5);
  var mouth=new THREE.Mesh(new THREE.TorusGeometry(.09,.022,8,14,Math.PI),mat(0xb3543f,.5));mouth.position.set(0,2.56,.54);mouth.rotation.z=Math.PI;
  var cheekM=new THREE.MeshStandardMaterial({color:0xff9db0,roughness:.8,transparent:true,opacity:.6});
  var ch1=new THREE.Mesh(new THREE.SphereGeometry(.095,10,8),cheekM);ch1.position.set(-.35,2.6,.44);ch1.scale.set(1,.7,.4);
  var ch2=ch1.clone();ch2.position.x=.35;
  g.add(body,hem,collar,btn1,btn2,btn3,head,earL,earR,e1,e2,sp1,sp2,browL,browR,nose,mouth,ch1,ch2);
  var hc=style.hairColor||0x1c1c22;
  if(style.hair==='peci'){var peci=cyl(.4,.48,.36,0x1c1c22,0,3.26,0,14);peci.rotation.x=.04;g.add(peci);}
  else if(style.hair==='bun'){var capH=sph(.585,hc,0,2.86,-.05);capH.scale.set(1,.78,1);g.add(capH);var bun=sph(.25,hc,0,3.42,-.12);g.add(bun);var fringe=sph(.5,hc,0,3.02,.22);fringe.scale.set(1,.5,.6);g.add(fringe);}
  else if(style.hair==='cap'){var capT=sph(.59,0x14151a,0,2.98,0);capT.scale.set(1,.55,1);g.add(capT);var brim=box(.6,.06,.38,0x14151a,0,2.99,.58);g.add(brim);var capB=sph(.09,0xffffff,0,3.14,.5);g.add(capB);}
  else if(style.hair==='hijab'){
    /* Hijab pink seperti referensi: kain membungkus kepala (celah wajah terbuka di depan +Z),
       ciput putih mengintip di dahi, kain jatuh di samping pipi & menutup dada,
       manset pink di pergelangan tangan, bulu mata lentik. */
    var hijabM=new THREE.MeshStandardMaterial({color:hc,roughness:.65,side:THREE.DoubleSide});
    var wrap=new THREE.Mesh(new THREE.SphereGeometry(.66,26,18,Math.PI/2+.72,Math.PI*2-1.44),hijabM);
    wrap.position.set(0,2.8,-.03);wrap.scale.set(1,1.05,1);wrap.castShadow=true;g.add(wrap);
    var ciput=new THREE.Mesh(new THREE.SphereGeometry(.6,22,10,0,Math.PI*2,0,1.12),mat(0xffffff,.6));
    ciput.position.set(0,2.78,.02);ciput.castShadow=true;g.add(ciput);
    var fallL=sph(.3,hc,-.47,2.4,.04);fallL.scale.set(.55,1.3,.95);fallL.material=hijabM;g.add(fallL);
    var fallR=sph(.3,hc,.47,2.4,.04);fallR.scale.set(.55,1.3,.95);fallR.material=hijabM;g.add(fallR);
    var drape=new THREE.Mesh(new THREE.CylinderGeometry(.37,.68,.82,20,1,true),hijabM);
    drape.position.set(0,2.0,.02);drape.castShadow=true;g.add(drape);
    var cuffL=cyl(.175,.185,.15,hc,0,-.68,0,12);armL.add(cuffL);
    var cuffR=cyl(.175,.185,.15,hc,0,-.68,0,12);armR.add(cuffR);
    var lashL=box(.09,.025,.025,0x1c1c22,-.285,2.9,.52);lashL.rotation.z=.55;g.add(lashL);
    var lashR=box(.09,.025,.025,0x1c1c22,.285,2.9,.52);lashR.rotation.z=-.55;g.add(lashR);
  }
  if(style.acc==='backpack'){var bp=box(.64,.8,.3,0xd92b2b,0,1.72,-.52);g.add(bp);var pocket=box(.4,.34,.08,0x2f7fe0,0,1.55,-.7);g.add(pocket);var roll=cyl(.11,.11,.6,0xffc93c,0,2.2,-.52,10);roll.rotation.z=Math.PI/2;g.add(roll);}
  if(style.acc==='skate'){var board=box(.3,.07,.9,0xff5d8f,.78,1.1,.1);board.rotation.z=.5;g.add(board);var w1=sph(.07,0x35c4e8,.68,.82,.32),w2=sph(.07,0x35c4e8,.9,1.36,-.12);g.add(w1,w2);}
  g.userData={legL:legL,legR:legR,armL:armL,armR:armR,body:body};
  return g;
}
var _woodTex=null;
function woodTexture(){
  if(_woodTex)return _woodTex;
  var cv=document.createElement('canvas');cv.width=256;cv.height=256;var cx=cv.getContext('2d');
  cx.fillStyle='#e2a85c';cx.fillRect(0,0,256,256);
  for(var i=0;i<40;i++){var x=(i*41)%256;cx.strokeStyle='rgba(150,95,40,'+(0.05+((i*13)%10)/55)+')';cx.lineWidth=1+((i*7)%2);cx.beginPath();cx.moveTo(x,0);
    for(var y=0;y<=256;y+=32)cx.lineTo(x+Math.sin(y*.05+i)*3,y);cx.stroke();}
  for(var k=0;k<3;k++){var kx=40+k*80,ky=50+k*70;cx.strokeStyle='rgba(150,95,40,.22)';cx.beginPath();cx.ellipse(kx,ky,5,9,0,0,Math.PI*2);cx.stroke();}
  var grad=cx.createLinearGradient(0,0,256,0);grad.addColorStop(0,'rgba(255,240,200,.34)');grad.addColorStop(.45,'rgba(255,255,255,0)');grad.addColorStop(1,'rgba(120,70,20,.13)');cx.fillStyle=grad;cx.fillRect(0,0,256,256);
  _woodTex=new THREE.CanvasTexture(cv);return _woodTex;
}
function makeMonster(room){
  /* Empat skin penjaga berbeda, tetap gaya clay 3D Steal the Lebaran:
     1 Basic  = Si Penjaga Jahat — golem batu bersayap kelelawar cokelat, glow ORANYE (karakter lama).
     2 Rare   = Penjaga Sangat Jahat (foto 1) — naga batu abu-abu: tanduk bulan sabit raksasa,
                moncong panjang bergigi, ekor panjang berujung sabit, TANPA sayap, glow BIRU CYAN.
     3 Legend = Mister Penjaga Sangat Jahat (foto 2) — iblis lava merah-hitam super kekar,
                EMPAT lengan, tanduk banteng, glow MERAH.
     4 Secret = Ketua Para Penjaga Jahat (foto 3) — raja iblis merah ramping & tinggi,
                tanduk emas menjulang, sayap pita tipis panjang, tombak trisula api, glow UNGU. */
  var variant=room?room.id:1;
  var PAL={
    1:{rock:0x2e2e36,rockD:0x1d1d24,rockL:0x55555f,lava:0xff7a1a,lavaEm:0xff5a00,eye:0xffa02e,eyeEm:0xff7a00,wing:0xa85a1e,wingD:0x6e3a10,glow:0xff6a00},
    2:{rock:0x5c5c66,rockD:0x3a3a42,rockL:0x8a8a94,lava:0x35c4ff,lavaEm:0x0099ff,eye:0x9be8ff,eyeEm:0x00b7ff,wing:0x4a6a7a,wingD:0x2e4a56,glow:0x00b7ff},
    3:{rock:0x4a1a1e,rockD:0x260d10,rockL:0x7a3438,lava:0xff2a3c,lavaEm:0xff0a22,eye:0xff5a3c,eyeEm:0xff1800,wing:0x5a161c,wingD:0x38090d,glow:0xff1e3c},
    4:{rock:0x6e1220,rockD:0x3d0a18,rockL:0xa83a4a,lava:0xc99aff,lavaEm:0x9b30ff,eye:0xffe98a,eyeEm:0xffb700,wing:0x7a1030,wingD:0x4a081c,glow:0xb46ae0}
  };
  var P=PAL[variant]||PAL[1];
  var g=new THREE.Group();
  var rockM=new THREE.MeshStandardMaterial({color:P.rock,roughness:.95,flatShading:true});
  var rockD=new THREE.MeshStandardMaterial({color:P.rockD,roughness:1,flatShading:true});
  var rockL=new THREE.MeshStandardMaterial({color:P.rockL,roughness:.9,flatShading:true});
  var lavaM=new THREE.MeshStandardMaterial({color:P.lava,emissive:P.lavaEm,emissiveIntensity:1.6,roughness:.4});
  var wingM=new THREE.MeshStandardMaterial({color:P.wing,roughness:.85,side:THREE.DoubleSide});
  var wingD=new THREE.MeshStandardMaterial({color:P.wingD,roughness:.9,side:THREE.DoubleSide});
  var goldM=new THREE.MeshStandardMaterial({color:0xffb627,roughness:.3,metalness:.7,emissive:0x8a5a00,emissiveIntensity:.45});
  function rock(r,c,x,y,z,sx,sy,sz){var ms=new THREE.Mesh(new THREE.IcosahedronGeometry(r,0),c||rockM);ms.position.set(x||0,y||0,z||0);ms.scale.set(sx||1,sy||1,sz||1);ms.castShadow=true;g.add(ms);return ms;}
  function makeLeg(sx){
    var lg=new THREE.Group();lg.position.set(sx,1.55,0);
    var thigh=new THREE.Mesh(new THREE.IcosahedronGeometry(.34,0),rockM);thigh.position.set(0,-.3,0);thigh.scale.set(1,1.25,.95);thigh.castShadow=true;lg.add(thigh);
    var shin=new THREE.Mesh(new THREE.IcosahedronGeometry(.24,0),rockD);shin.position.set(0,-.95,.03);shin.scale.set(.85,1.5,.8);shin.castShadow=true;lg.add(shin);
    var foot=new THREE.Mesh(new THREE.IcosahedronGeometry(.26,0),rockD);foot.position.set(0,-1.5,.12);foot.scale.set(1,.5,1.5);lg.add(foot);
    [-.16,0,.16].forEach(function(cx2){var claw=new THREE.Mesh(new THREE.ConeGeometry(.06,.3,6),rockL);claw.rotation.x=Math.PI/2.3;claw.position.set(cx2,-1.52,.42);lg.add(claw);});
    g.add(lg);return lg;
  }
  var legL=makeLeg(-.34),legR=makeLeg(.34);
  var tail1=new THREE.Mesh(new THREE.ConeGeometry(.13,.7,6),rockD);tail1.position.set(0,1.35,-.62);tail1.rotation.x=-1.9;g.add(tail1);
  var tail2=new THREE.Mesh(new THREE.ConeGeometry(.09,.6,6),rockD);tail2.position.set(0,1.0,-.95);tail2.rotation.x=-2.5;g.add(tail2);
  if(variant===2){ /* foto 1: ekor panjang bersegmen berujung sabit besar */
    [[1.3,-1.2,.15,.8],[1.15,-1.75,.12,.75],[1.35,-2.25,.09,.7]].forEach(function(ts){var seg=new THREE.Mesh(new THREE.ConeGeometry(ts[2],ts[3],6),rockD);seg.position.set(0,ts[0],ts[1]);seg.rotation.x=-2.3;g.add(seg);});
    var blade=new THREE.Mesh(new THREE.ConeGeometry(.3,1.1,6),rockL);blade.scale.set(1,1,.26);blade.position.set(0,1.75,-2.6);blade.rotation.x=-2.1;g.add(blade);
    var bladeEdge=new THREE.Mesh(new THREE.BoxGeometry(.05,.85,.05),lavaM);bladeEdge.position.set(0,1.8,-2.78);bladeEdge.rotation.x=-2.1;g.add(bladeEdge);
  }
  if(variant===4){ /* foto 3: ekor cambuk tipis panjang berujung emas */
    [[1.15,-1.2,.05,1.0],[.95,-1.95,.04,.95],[1.2,-2.6,.03,.8]].forEach(function(ts){var seg=new THREE.Mesh(new THREE.ConeGeometry(ts[2],ts[3],6),rockD);seg.position.set(0,ts[0],ts[1]);seg.rotation.x=-2.4;g.add(seg);});
    var whipTip=new THREE.Mesh(new THREE.ConeGeometry(.07,.45,6),goldM);whipTip.position.set(0,1.55,-3.0);whipTip.rotation.x=-2.4;g.add(whipTip);
  }
  rock(.52,rockD,0,1.72,0,1.15,.8,1);
  rock(.62,rockM,0,2.35,.02,1.05,1.05,.9);
  var chest=rock(.78,rockM,0,3.05,.02,1.25,1.0,1.0);
  if(variant===3)chest.scale.set(1.5,1.12,1.18); /* foto 2: dada super kekar */
  if(variant===4)chest.scale.set(.8,1.32,.82);   /* foto 3: badan ramping menjulang */
  if(variant===2)chest.scale.set(1.12,1.02,1.05);
  var core=new THREE.Mesh(new THREE.IcosahedronGeometry(.17,0),lavaM);core.position.set(0,2.95,.68);g.add(core);
  [[0,2.6,.6,.05,.5],[.18,3.3,.62,.04,.34],[-.2,3.25,.6,.04,.3],[.3,2.45,.5,.035,.3],[-.3,2.5,.52,.035,.26]].forEach(function(cr){
    var crack=new THREE.Mesh(new THREE.BoxGeometry(cr[3],cr[4],.03),lavaM);crack.position.set(cr[0],cr[1],cr[2]);crack.rotation.z=cr[0]*1.4;g.add(crack);});
  rock(.42,rockD,-.86,3.42,0);rock(.42,rockD,.86,3.42,0);
  [-.3,0,.3].forEach(function(bx,i){var sp=new THREE.Mesh(new THREE.ConeGeometry(.11,.55-i*.08,6),rockL);sp.position.set(bx,3.62,-.42);sp.rotation.x=-.5;g.add(sp);});
  function makeWing(side){
    var wg=new THREE.Group();wg.position.set(side*.5,3.55,-.3);
    var shape=new THREE.Shape();
    shape.moveTo(0,0);shape.lineTo(1.05,.95);shape.lineTo(1.35,.25);shape.lineTo(2.05,.8);shape.lineTo(2.2,-.05);shape.lineTo(1.6,-.3);shape.lineTo(1.5,-.8);shape.lineTo(.95,-.35);shape.lineTo(.6,-.85);shape.lineTo(.15,-.3);shape.lineTo(0,0);
    var mem=new THREE.Mesh(new THREE.ShapeGeometry(shape),wingM);mem.castShadow=true;wg.add(mem);
    var mem2=new THREE.Mesh(new THREE.ShapeGeometry(shape),wingD);mem2.position.z=-.012;mem2.scale.setScalar(.97);wg.add(mem2);
    [[1.05,.95],[2.05,.8]].forEach(function(pt){var bone=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,Math.hypot(pt[0],pt[1]),6),rockD);bone.position.set(pt[0]/2,pt[1]/2,0);bone.rotation.z=Math.atan2(pt[1],pt[0])-Math.PI/2;wg.add(bone);});
    var tip=new THREE.Mesh(new THREE.ConeGeometry(.07,.34,6),rockL);tip.position.set(2.2,.12,0);tip.rotation.z=-1.2;wg.add(tip);
    wg.scale.x=side;wg.rotation.y=side*.25;
    g.add(wg);return wg;
  }
  var wingL=null,wingR=null;
  if(variant===1){wingL=makeWing(-1);wingR=makeWing(1);} /* sayap kelelawar cokelat (karakter lama) */
  if(variant===4){wingL=makeWing(-1);wingR=makeWing(1);wingL.scale.set(.6,1.65,1);wingR.scale.set(.6,1.65,1);} /* foto 3: sayap pita tipis memanjang */
  function makeArm(sx){
    var ag=new THREE.Group();ag.position.set(sx,3.35,0);
    var up=new THREE.Mesh(new THREE.IcosahedronGeometry(.3,0),rockM);up.position.set(sx*.18,-.42,0);up.scale.set(.9,1.5,.9);up.castShadow=true;ag.add(up);
    var fo=new THREE.Mesh(new THREE.IcosahedronGeometry(.36,0),rockD);fo.position.set(sx*.3,-1.12,.05);fo.scale.set(1,1.25,1);fo.castShadow=true;ag.add(fo);
    var hand=new THREE.Mesh(new THREE.IcosahedronGeometry(.3,0),rockM);hand.position.set(sx*.34,-1.62,.1);hand.scale.set(1.15,.8,1.15);ag.add(hand);
    [-.2,-.07,.07,.2].forEach(function(cx2){
      var claw=new THREE.Mesh(new THREE.ConeGeometry(.055,.42,6),rockL);claw.position.set(sx*.34+cx2,-1.95,.16);claw.rotation.x=.5;ag.add(claw);
      var tipF=new THREE.Mesh(new THREE.ConeGeometry(.028,.16,6),lavaM);tipF.position.set(sx*.34+cx2,-2.12,.26);tipF.rotation.x=.5;ag.add(tipF);});
    g.add(ag);return ag;
  }
  var armL=makeArm(-1),armR=makeArm(1);
  armL.rotation.z=.18;armR.rotation.z=-.18;
  if(variant===3){ /* foto 2: sepasang lengan kedua terangkat di belakang bahu */
    var armL2=makeArm(-1),armR2=makeArm(1);
    armL2.position.set(-1.0,4.0,-.35);armR2.position.set(1.0,4.0,-.35);
    armL2.rotation.z=2.45;armR2.rotation.z=-2.45;armL2.scale.setScalar(.8);armR2.scale.setScalar(.8);
  }
  if(variant===2){ /* foto 1: deretan duri punggung bergerigi (tanpa sayap) */
    [.3,.9,1.5].forEach(function(by,bi){var bs=new THREE.Mesh(new THREE.ConeGeometry(.13,.6-bi*.08,6),rockL);bs.position.set(0,3.55-by*.5,-.52-bi*.1);bs.rotation.x=-.6;g.add(bs);});
  }
  if(variant===4){ /* foto 3: tombak trisula api di tangan kanan */
    var spear=new THREE.Group();spear.position.set(1.4,2.7,.25);spear.rotation.z=.3;
    var pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,4.6,8),rockD);spear.add(pole);
    [-.16,0,.16].forEach(function(px,pi){var prong=new THREE.Mesh(new THREE.ConeGeometry(.055,pi===1?.95:.7,6),lavaM);prong.position.set(px,2.35+(pi===1?.3:.15),0);spear.add(prong);});
    var sbase=new THREE.Mesh(new THREE.ConeGeometry(.06,.5,6),goldM);sbase.rotation.x=Math.PI;sbase.position.set(0,-2.5,0);spear.add(sbase);
    g.add(spear);armR.rotation.z=-.55;
  }
  rock(.5,rockM,0,4.05,.05,1,1.05,.95);
  rock(.36,rockD,0,3.78,.14,1.05,.6,1);
  rock(.4,rockD,0,4.22,.3,1.15,.42,.7);
  var eyeM2=new THREE.MeshStandardMaterial({color:P.eye,emissive:P.eyeEm,emissiveIntensity:2.2});
  var fangM=new THREE.MeshStandardMaterial({color:0xf5ead2,roughness:.5});
  [-.17,.17].forEach(function(ex){var eye=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),eyeM2);eye.position.set(ex,4.08,.44);eye.scale.set(1.25,.8,.6);g.add(eye);
    var fang=new THREE.Mesh(new THREE.ConeGeometry(.04,.16,6),fangM);fang.position.set(ex*.7,3.86,.42);fang.rotation.x=Math.PI;g.add(fang);});
  var mouthGlow=new THREE.Mesh(new THREE.BoxGeometry(.3,.045,.03),lavaM);mouthGlow.position.set(0,3.9,.46);g.add(mouthGlow);
  if(variant===2){ /* foto 1: moncong naga panjang + rahang bergigi */
    rock(.3,rockD,0,3.98,.62,1.25,.62,1.7);
    rock(.24,rockM,0,3.74,.55,1.1,.4,1.5);
    for(var ti=-2;ti<=2;ti++){var tooth=new THREE.Mesh(new THREE.ConeGeometry(.035,.15,5),fangM);tooth.position.set(ti*.11,3.84,.95);tooth.rotation.x=Math.PI;g.add(tooth);}
    var noseHorn=new THREE.Mesh(new THREE.ConeGeometry(.06,.3,6),rockL);noseHorn.position.set(0,4.2,.78);noseHorn.rotation.x=.7;g.add(noseHorn);
  }
  if(variant===4){ /* foto 3: jambul api di kepala */
    var crest=new THREE.Mesh(new THREE.ConeGeometry(.09,.55,6),lavaM);crest.position.set(0,4.62,-.15);crest.rotation.x=-.35;g.add(crest);
  }
  function horn(side){
    var hg=new THREE.Group();hg.position.set(side*.42,4.42,-.02);
    var hm=variant===4?goldM:rockD;
    if(variant===2){ /* foto 1: tanduk bulan sabit raksasa menyapu ke atas */
      var h1=new THREE.Mesh(new THREE.ConeGeometry(.16,1.15,7),hm);h1.rotation.z=side*-1.15;h1.position.set(side*.34,.3,0);hg.add(h1);
      var h2=new THREE.Mesh(new THREE.ConeGeometry(.1,.85,7),hm);h2.rotation.z=side*-1.95;h2.position.set(side*.78,.62,0);hg.add(h2);
      var h3=new THREE.Mesh(new THREE.ConeGeometry(.06,.5,7),hm);h3.rotation.z=side*-2.5;h3.position.set(side*1.02,.95,0);hg.add(h3);
    }else if(variant===4){ /* foto 3: tanduk emas menjulang ke atas */
      var h1=new THREE.Mesh(new THREE.ConeGeometry(.13,1.25,7),hm);h1.rotation.z=side*-.18;h1.position.set(side*.1,.5,0);hg.add(h1);
      var tipH=new THREE.Mesh(new THREE.ConeGeometry(.06,.5,7),lavaM);tipH.rotation.z=side*-.18;tipH.position.set(side*.21,1.22,0);hg.add(tipH);
    }else if(variant===3){ /* foto 2: tanduk banteng tebal menukik ke depan */
      var h1=new THREE.Mesh(new THREE.ConeGeometry(.15,.95,7),hm);h1.rotation.z=side*-1.35;h1.rotation.x=.5;h1.position.set(side*.3,.18,.15);hg.add(h1);
      var h2=new THREE.Mesh(new THREE.ConeGeometry(.09,.6,7),hm);h2.rotation.z=side*-2.1;h2.rotation.x=.7;h2.position.set(side*.62,.42,.3);hg.add(h2);
    }else{
      var h1=new THREE.Mesh(new THREE.ConeGeometry(.11,.62,7),hm);h1.rotation.z=side*-.8;h1.position.set(side*.16,.14,0);hg.add(h1);
      var h2=new THREE.Mesh(new THREE.ConeGeometry(.07,.45,7),hm);h2.rotation.z=side*-1.5;h2.position.set(side*.4,.34,0);hg.add(h2);
    }
    g.add(hg);return hg;
  }
  horn(-1);horn(1);
  var backHorn=new THREE.Mesh(new THREE.ConeGeometry(.09,.5,7),rockD);backHorn.position.set(0,4.5,-.3);backHorn.rotation.x=-.7;g.add(backHorn);
  var glow=new THREE.PointLight(P.glow,variant===4?1.2:.9,9,1.8);glow.position.set(0,3.4,1);g.add(glow);
  var bang=new THREE.Group();bang.position.set(0,4.95,0);
  var bangT=box(.16,1.15,.16,0xef3b3b,0,.55,0);var bangTxt=box(.95,.5,.06,0xef3b3b,0,1.05,0);
  bang.add(bangT,bangTxt);bang.visible=false;g.add(bang);
  g.userData={legL:legL,legR:legR,armL:armL,armR:armR,bang:bang,body:chest,wingL:wingL,wingR:wingR};
  return g;
}
function makeItemMesh(base){
  var g=new THREE.Group();var c=base.color;
  function add(m){g.add(m);return m;}
  switch(base.id){
    case 'ketupat':{var k=new THREE.Mesh(new THREE.OctahedronGeometry(.55),mat(0x3da33f,.55));k.scale.y=1.25;k.castShadow=true;add(k);
      var band=box(.62,.2,.62,0x7ed957,0,.05,0);band.rotation.y=Math.PI/4;add(band);var band2=box(.5,.18,.5,0x7ed957,0,-.28,0);band2.rotation.y=Math.PI/4;add(band2);
      add(cyl(.03,.05,.5,0x2f7a3d,0,.85,0,6));var db1=box(.16,1.05,.06,0x7ed957,0,0,.5);db1.rotation.z=.62;add(db1);var db2=box(.16,1.05,.06,0x2f7a3d,0,0,.51);db2.rotation.z=-.62;add(db2);var lf=box(.3,.45,.04,0x7ed957,-.14,1.02,0);lf.rotation.z=.5;add(lf);var lf2=box(.3,.45,.04,0x7ed957,.14,1.02,0);lf2.rotation.z=-.5;add(lf2);break;}
    case 'lantern':{var glass=cyl(.3,.3,.6,0x0e7ac3,0,0,0,6);glass.material=new THREE.MeshStandardMaterial({color:0x0e7ac3,roughness:.25,emissive:0x0a4d80,emissiveIntensity:.55});add(glass);
      add(cyl(.4,.44,.14,0xd9a441,0,.4,0,6));add(cyl(.44,.4,.14,0xd9a441,0,-.4,0,6));
      var dome=sph(.3,0xd9a441,0,.55,0);dome.scale.y=.8;add(dome);
      var gl2=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),new THREE.MeshStandardMaterial({color:0xbfe3ff,emissive:0x7ec8ff,emissiveIntensity:1.1}));add(gl2);break;}
    case 'crescent':{var t=new THREE.Mesh(new THREE.TorusGeometry(.45,.16,10,22,Math.PI*1.45),new THREE.MeshStandardMaterial({color:0xffc93c,roughness:.3,metalness:.55,emissive:0x664d00,emissiveIntensity:.5}));t.castShadow=true;t.rotation.z=.8;add(t);
      var st=sph(.13,0xffe98a,.42,.42,0);st.material=new THREE.MeshStandardMaterial({color:0xffe98a,emissive:0xffc93c,emissiveIntensity:.8});add(st);break;}
    case 'mosque':{add(box(1.0,.6,.8,0xe8f4f2,0,-.1,0));var dome2=sph(.42,0x2f9e8f,0,.42,0);dome2.scale.y=.85;add(dome2);add(cyl(.05,.05,.4,0xffc93c,0,.85,0,8));
      add(cyl(.09,.11,.95,0xe8f4f2,-.62,.15,0,8));add(cyl(.09,.11,.95,0xe8f4f2,.62,.15,0,8));var mt1=new THREE.Mesh(new THREE.ConeGeometry(.15,.3,8),mat(0x2f9e8f));mt1.position.set(-.62,.78,0);add(mt1);var mt2=mt1.clone();mt2.position.x=.62;add(mt2);add(box(.3,.42,.06,0x0e5a50,0,-.28,.41));break;}
    case 'bedug':{var b=cyl(.34,.34,1.05,0xa06a35,0,0,0,14);b.rotation.z=Math.PI/2;add(b);var s1=cyl(.36,.36,.06,0xe8d9b0,-.55,0,0,14);s1.rotation.z=Math.PI/2;add(s1);var s2=cyl(.36,.36,.06,0xe8d9b0,.55,0,0,14);s2.rotation.z=Math.PI/2;add(s2);[-.3,0,.3].forEach(function(rx){var rr=new THREE.Mesh(new THREE.TorusGeometry(.35,.028,8,18),mat(0x6b4226,.8));rr.position.x=rx;rr.rotation.y=Math.PI/2;add(rr);});break;}
    case 'nastar':{var n=sph(.42,0xf08c1e,0,0,0);n.scale.y=.74;n.material=new THREE.MeshStandardMaterial({color:0xf08c1e,roughness:.32});add(n);add(cyl(.43,.44,.09,0xe8c98f,0,-.24,0,16));
      [[-.16,.26,.1],[.14,.27,-.14],[0,.3,.16],[.2,.24,.12],[-.02,.28,-.2]].forEach(function(sp){var strip=box(.2,.035,.06,0xffe9a8,sp[0],sp[1],sp[2]);strip.rotation.y=sp[0]*4;strip.rotation.z=.15;add(strip);});var plate=cyl(.52,.46,.06,0xffc93c,0,-.3,0,18);plate.material=new THREE.MeshStandardMaterial({color:0xffc93c,roughness:.3,metalness:.6});add(plate);var jewel=sph(.09,0xef3b3b,0,.36,0);jewel.material=new THREE.MeshStandardMaterial({color:0xef3b3b,roughness:.2,emissive:0x7a0d0d,emissiveIntensity:.5});add(jewel);break;}
    case 'kastengel':{for(var ki2=0;ki2<3;ki2++){add(box(.88,.17,.3,0xf5a623,0,-.2+ki2*.19,(ki2%2? .05:-.05)));}[[ -.28,.32],[0,.34],[.28,.32],[-.14,.3],[.14,.3]].forEach(function(gp){var gr=box(.16,.045,.07,0xffe98a,gp[0],gp[1],0);gr.rotation.y=gp[0]*3;add(gr);});var kplate=cyl(.55,.48,.05,0xfdf6e3,0,-.34,0,16);add(kplate);break;}
    case 'putrisalju':{var pm=mat(0xffffff,.95);[[-.22,.02,.5],[.2,.06,-.4],[0,.24,.1]].forEach(function(cp){var cr=new THREE.Mesh(new THREE.TorusGeometry(.21,.095,10,18,Math.PI*1.35),pm);cr.position.set(cp[0],cp[1],cp[2]*.3);cr.rotation.set(.5,cp[2],.7);cr.castShadow=true;add(cr);});add(cyl(.55,.48,.05,0xe8d9b0,0,-.22,0,16));break;}
    case 'lidahkucing':{for(var fi=-2;fi<=2;fi++){var fo=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.5,4,10),mat(fi%2?0xe5b96e:0xd9a05b,.6));fo.position.set(fi*.17,.05+Math.abs(fi)*-.015,0);fo.rotation.z=fi*.28;fo.castShadow=true;add(fo);}var rib=sph(.13,0xef3b3b,0,-.42,0);rib.scale.set(1.6,.6,1);add(rib);break;}
    case 'giftbox':{add(box(.78,.6,.78,0x2fae4e,0,-.05,0));add(box(.84,.17,.84,0x27963f,0,.3,0));add(box(.17,.78,.85,0xffb627,0,0,0));add(box(.85,.78,.17,0xffb627,0,0,0));var bow=sph(.15,0xffb627,0,.5,0);bow.scale.set(1.5,.6,1);add(bow);var bow2=sph(.11,0xffb627,.16,.52,0);bow2.scale.set(1.2,.55,1);add(bow2);break;}
    case 'thr':{var e=box(.64,.86,.1,0x2fbf71,0,0,0);add(e);var coin=cyl(.17,.17,.05,0xffc93c,0,.48,0,18);coin.material=new THREE.MeshStandardMaterial({color:0xffc93c,roughness:.25,metalness:.7});add(coin);var cm=new THREE.Mesh(new THREE.TorusGeometry(.11,.035,8,16,Math.PI*1.4),new THREE.MeshStandardMaterial({color:0xffc93c,roughness:.3,metalness:.6}));cm.position.set(0,-.08,.07);cm.rotation.z=.8;add(cm);break;}
    case 'baju':{add(box(.8,.85,.34,0x1d2c5e,0,0,0));var a1=box(.24,.6,.3,0x1d2c5e,-.52,.08,0);a1.rotation.z=.35;add(a1);var a2=box(.24,.6,.3,0x1d2c5e,.52,.08,0);a2.rotation.z=-.35;add(a2);add(box(.1,.55,.36,0x16224a,0,.08,0));var bt=sph(.045,0xd9a441,0,.22,.19);add(bt);var bt2=sph(.045,0xd9a441,0,.02,.19);add(bt2);var bt3=sph(.045,0xd9a441,0,-.18,.19);add(bt3);var colr=box(.34,.14,.36,0x16224a,0,.48,0);add(colr);add(box(.22,.2,.03,0x2c447e,-.24,.18,.19));break;}
    case 'sarong':{var s=cyl(.3,.36,.85,0x7a4de0,0,0,0,14);add(s);[.3,.02,-.26].forEach(function(by){var band=new THREE.Mesh(new THREE.TorusGeometry(.335,.028,8,20),new THREE.MeshStandardMaterial({color:0xffc93c,roughness:.35,metalness:.5}));band.rotation.x=Math.PI/2;band.position.y=by;add(band);});var rollT=cyl(.14,.14,.1,0x5b34b8,0,.48,0,12);add(rollT);break;}
    case 'prayer':{var cone=new THREE.Mesh(new THREE.ConeGeometry(.5,1.0,16),mat(0xf6f1e7,.9));cone.castShadow=true;add(cone);var face=new THREE.Mesh(new THREE.SphereGeometry(.17,12,10),mat(0x2b2118,.6));face.position.set(0,.18,.4);face.scale.set(1,1.25,.5);add(face);var lace=new THREE.Mesh(new THREE.TorusGeometry(.5,.035,8,22),mat(0xffffff,.9));lace.rotation.x=Math.PI/2;lace.position.y=-.48;add(lace);var saj=cyl(.13,.13,.72,0x9b4de0,.1,-.5,.42,12);saj.rotation.z=Math.PI/2;add(saj);break;}
    case 'decor':{var cres=new THREE.Mesh(new THREE.TorusGeometry(.34,.09,10,20,Math.PI*1.45),new THREE.MeshStandardMaterial({color:0xffc93c,roughness:.3,metalness:.55,emissive:0x664d00,emissiveIntensity:.5}));cres.position.set(-.18,.32,.02);cres.rotation.z=.8;add(cres);[.35,-.3,.05].forEach(function(lxp,li2){var bulb=sph(.055,[0xff5d8f,0x35c4e8,0xffc93c][li2%3],-.3+lxp,.62-li2*.06,.05);bulb.material=new THREE.MeshStandardMaterial({color:0xffffff,emissive:[0xff5d8f,0x35c4e8,0xffc93c][li2%3],emissiveIntensity:1});add(bulb);});var shape=new THREE.Shape();for(var i=0;i<10;i++){var ang=i*Math.PI/5-Math.PI/2;var rad=i%2===0?.5:.22;var px=Math.cos(ang)*rad,py=Math.sin(ang)*rad;if(i===0)shape.moveTo(px,py);else shape.lineTo(px,py);}shape.closePath();
      var star=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.14,bevelEnabled:false}),new THREE.MeshStandardMaterial({color:0xff7ab6,roughness:.4,emissive:0x8a2050,emissiveIntensity:.5}));star.castShadow=true;add(star);break;}
    default:{add(sph(.42,c,0,0,0));}
  }
  return g;
}
function applyMutation(group,mut){
  if(!mut||mut.id==='basic')return;
  group.traverse(function(o){
    if(o.isMesh&&o.material&&o.material.color){
      if(mut.tint==='rainbow'){o.material=o.material.clone();o.material.color.setHSL(Math.random(),.85,.6);o.userData.rainbow=true;o.userData.hueOff=Math.random();}
      else if(typeof mut.tint==='number'){o.material=o.material.clone();o.material.color.set(mut.tint);if(mut.id==='golden'){o.material.metalness=.75;o.material.roughness=.25;}if(mut.id==='diamond'){o.material.transparent=true;o.material.opacity=.82;o.material.roughness=.1;o.material.metalness=.2;}if(mut.id==='neon'){o.material.emissive=new THREE.Color(mut.tint);o.material.emissiveIntensity=.9;}if(mut.id==='galaxy'){o.material.emissive=new THREE.Color(0x6a4de0);o.material.emissiveIntensity=.35;}}
    }
  });
  /* Aura geometry: the mutation is a visible 3D transformation, not just a tint */
  function spark(r,c,x,y,z,em){var s=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),new THREE.MeshStandardMaterial({color:0xffffff,emissive:em||c,emissiveIntensity:1.2}));s.position.set(x,y,z);group.add(s);return s;}
  if(mut.id==='golden'){for(var gi=0;gi<6;gi++){var ga=gi/6*Math.PI*2;spark(.05,0xffc93c,Math.cos(ga)*.62,.1+((gi*37)%50)/100,Math.sin(ga)*.62);}}
  if(mut.id==='diamond'){for(var di=0;di<3;di++){var cry=new THREE.Mesh(new THREE.ConeGeometry(.13,.42,4),new THREE.MeshStandardMaterial({color:0xbfefff,roughness:.08,metalness:.25,transparent:true,opacity:.9,emissive:0x2a7ea6,emissiveIntensity:.5}));cry.position.set(-.25+di*.25,.62,(di%2?.14:-.1));group.add(cry);}spark(.05,0xbfefff,.4,.3,.3);spark(.04,0xbfefff,-.42,.05,-.2);}
  if(mut.id==='rainbow'){if(rainbowFx.length>60)rainbowFx.splice(0,20);rainbowFx.push(group);var rb=new THREE.Mesh(new THREE.TorusGeometry(.68,.045,8,26),new THREE.MeshBasicMaterial({color:0xff5d8f}));rb.rotation.x=Math.PI/2;rb.position.y=-.42;rb.userData.rainbowRing=true;group.add(rb);rainbowFx.push(rb);}
  if(mut.id==='neon'){var nr=new THREE.Mesh(new THREE.TorusGeometry(.7,.05,8,26),new THREE.MeshStandardMaterial({color:0x39ff88,emissive:0x39ff88,emissiveIntensity:1.6}));nr.rotation.x=Math.PI/2;nr.position.y=-.42;group.add(nr);spark(.05,0x39ff88,.55,.35,0);}
  if(mut.id==='galaxy'){for(var si2=0;si2<9;si2++){var sa=si2/9*Math.PI*2;spark(.032,0xffffff,Math.cos(sa)*.66,-.2+((si2*53)%90)/100,Math.sin(sa)*.66,si2%3?0xcfb8ff:0xffffff);}}
  if(mut.id==='celestial'){var halo=new THREE.Mesh(new THREE.TorusGeometry(.34,.05,8,24),new THREE.MeshStandardMaterial({color:0xffd76a,roughness:.25,metalness:.7,emissive:0xcc8f00,emissiveIntensity:.9}));halo.rotation.x=Math.PI/2.4;halo.position.y=.78;group.add(halo);for(var ci=0;ci<5;ci++){var ca=ci/5*Math.PI*2;spark(.045,0xffe98a,Math.cos(ca)*.6,.3+((ci*29)%40)/100,Math.sin(ca)*.6);}}
}
/* ============ WORLD ============ */
function buildWorld(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0x8fd0f7);scene.fog=new THREE.Fog(0x8fd0f7,110,340);
  camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,500);
  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  if('outputColorSpace' in renderer&&THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  document.getElementById('game').appendChild(renderer.domElement);
  /* Ruangan Rahasia Mythic dibangun di grup TERSEMBUNYI — wujudnya tidak terlihat sama sekali
     sampai reveal katalog ke-15. Yang terlihat pemain hanya tebing raksasa di utara Sang Legenda. */
  secretGroup=new THREE.Group();secretGroup.visible=false;scene.add(secretGroup);
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
    var par=room.id===4?secretGroup:scene;
    var depth=room.zMax-room.zMin,cz=(room.zMax+room.zMin)/2;
    var fl=new THREE.Mesh(new THREE.PlaneGeometry(96,depth),mat(room.floor,1));fl.rotation.x=-Math.PI/2;fl.position.set(0,0,cz);fl.receiveShadow=true;par.add(fl);
    var pl=new THREE.PointLight(room.accent,room.id>=4?.85:.55,34,1.6);pl.position.set(0,6.5,cz);par.add(pl);
  });
  var path=new THREE.Mesh(new THREE.PlaneGeometry(6,140),mat(0xd9905f,1));path.rotation.x=-Math.PI/2;path.position.set(0,.012,-37);path.receiveShadow=true;scene.add(path);
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
    var par=b.north===4?secretGroup:scene;
    var segW=48-b.gap;
    [-1,1].forEach(function(sgn){
      var w=new THREE.Mesh(new THREE.BoxGeometry(segW,3,.7),mat(room.accent,.8));
      w.position.set(sgn*(b.gap+segW/2),1.5,b.z);w.castShadow=true;w.receiveShadow=true;par.add(w);
      var post=box(1.1,4.6,1.1,room.accent,sgn*b.gap,2.3,b.z);par.add(post);
      var orb=sph(.48,room.accent,sgn*b.gap,4.95,b.z);orb.material=new THREE.MeshStandardMaterial({color:room.accent,emissive:room.accent,emissiveIntensity:.55});par.add(orb);
    });
    var lbl=makeLabel(room.name.toUpperCase()+'  •  '+room.rarities.toUpperCase(),room.accentCss,13);
    lbl.position.set(0,6.4,b.z);par.add(lbl);
    var barrier=new THREE.Mesh(new THREE.PlaneGeometry(b.gap*2,3.1),new THREE.MeshBasicMaterial({color:0xef3b3b,transparent:true,opacity:.32,side:THREE.DoubleSide}));
    barrier.position.set(0,1.55,b.z);par.add(barrier);gateBarriers[room.id]=barrier;
  });
  /* Dinding tebing raksasa menutup utara Ruangan Sang Legenda — Ruangan Rahasia Mythic
     bersembunyi di dalam bumi di baliknya sampai katalog ke-15 terkumpul. Saat reveal,
     tebing ini bergetar lalu tenggelam ke dalam bumi. */
  secretCover=new THREE.Group();
  var cliff=new THREE.Mesh(new THREE.BoxGeometry(96,7.5,2.6),mat(0x4a4036,.95));cliff.position.set(0,3.75,-79.4);cliff.castShadow=true;cliff.receiveShadow=true;secretCover.add(cliff);
  var cliffTop=new THREE.Mesh(new THREE.BoxGeometry(96,1.1,3.6),mat(0x5d7a35,.95));cliffTop.position.set(0,7.55,-79.4);cliffTop.castShadow=true;secretCover.add(cliffTop);
  [[-38,6.2,2.6],[-24,7.4,3.4],[-9,6.4,2.8],[4,7.6,3.8],[18,6.3,2.7],[31,7.2,3.2],[43,6.5,2.5],[-31,3.2,3.0],[12,2.6,3.4],[26,4.0,2.6],[-14,4.4,2.9],[38,2.8,3.1]].forEach(function(bp,i){
    var bld=new THREE.Mesh(new THREE.IcosahedronGeometry(bp[2]*.42,0),mat(i%3?0x554a3c:0x3e362c,.95));
    bld.position.set(bp[0],bp[1],-78.6+(i%2?.5:-.3));bld.scale.set(1.4,.8,1);bld.castShadow=true;secretCover.add(bld);
  });
  scene.add(secretCover);
  /* Outer fences */
  function fenceRun(x1,z1,x2,z2){var dx=x2-x1,dz=z2-z1,len=Math.sqrt(dx*dx+dz*dz),n=Math.floor(len/2.2);for(var i=0;i<=n;i++){var t=i/n;var post=cyl(.07,.07,1.1,0x8a5a2b,x1+dx*t,.55,z1+dz*t,6);scene.add(post);}var rail=box(len,.12,.12,0xa06a35,(x1+x2)/2,.85,(z1+z2)/2);rail.rotation.y=-Math.atan2(dz,dx);scene.add(rail);}
  fenceRun(-47,-108,47,-108);fenceRun(-47,-108,-47,12);fenceRun(47,-108,47,12);fenceRun(-47,32,-7,32);fenceRun(7,32,47,32);fenceRun(-47,12,-47,32);fenceRun(47,12,47,32);
  function tree(x,z,s){var g=new THREE.Group();g.add(cyl(.16,.22,1.4,0x8a5a2b,0,.7,0,7));var c1=sph(1.05,0x3f9e4d,0,2.0,0);var c2=sph(.75,0x55b862,.6,1.6,.2);var c3=sph(.7,0x2f8a3e,-.6,1.7,-.15);g.add(c1,c2,c3);g.position.set(x,0,z);g.scale.setScalar(s||1);scene.add(g);}
  [[-40,-6,1.2],[-18,-10,1],[38,-4,1.25],[44,-30,1],[-44,-52,1.15],[26,22,1.2],[-26,24,1.15],[-24,17,1],[24,28,1.1],[-40,-92,1.1],[42,-122,1.15],[40,-14,1],[-38,-140,1.05]].forEach(function(t){tree(t[0],t[1],t[2]);});
  /* Per-room decorations */
  ROOMS.forEach(function(room){
    var par=room.id===4?secretGroup:scene;
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
        orb2.position.set(ox,3.4,oz);par.add(orb2);animDeco.push({mesh:orb2,baseY:3.4,ph:oi*1.3});}
    }
    if(room.id===5){
      [-38,-13,13,38].forEach(function(x){scene.add(cyl(.7,.85,4.6,0xd9a441,x,2.3,room.zMin+2.5,12));scene.add(cyl(.7,.85,4.6,0xd9a441,x,2.3,room.zMax-2.5,12));
        var capG=sph(.55,0xffc93c,x,5,room.zMin+2.5);capG.material=new THREE.MeshStandardMaterial({color:0xffc93c,emissive:0xcc8f00,emissiveIntensity:.8});});
      [[-26,.4],[26,.6]].forEach(function(cf){var z=room.zMin+cf[1]*depth;scene.add(box(1.6,1,1.1,0xb57a3e,cf[0],.5,z));scene.add(box(1.66,.22,1.16,0xffc93c,cf[0],1.05,z));});
    }
    if(room.id===4){
      var portal=new THREE.Mesh(new THREE.TorusGeometry(2.6,.28,10,32),new THREE.MeshStandardMaterial({color:0x8a4de0,roughness:.3,emissive:0x5b21b6,emissiveIntensity:1.1}));
      portal.position.set(0,3.1,room.zMin+1.6);par.add(portal);animDeco.push({mesh:portal,baseY:3.1,ph:0,spin:true});
      for(var si=0;si<12;si++){var sx=-42+(si*7.3)%84,sz=room.zMin+((si*29)%80)/100*depth+.1*depth;
        var star2=sph(.14,0xffffff,sx,4.5+(si%3),sz);star2.material=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xcfb8ff,emissiveIntensity:1.2});par.add(star2);}
    }
  });
  /* Fluffy low-poly clouds + sun glow for a softer high-render sky */
  var cloudM=mat(0xffffff,1);
  [[-30,26,-60],[18,30,-110],[-8,28,-20],[34,27,-150],[-38,31,-135],[8,29,6]].forEach(function(cp,ci2){
    var cg=new THREE.Group();
    [[0,0,0,2.6],[2.2,.2,.4,1.9],[-2.1,.1,-.3,1.7],[.8,.5,-.6,1.5]].forEach(function(bp){var bs=sph(bp[3],0xffffff,bp[0],bp[1],bp[2]);bs.material=cloudM;bs.scale.y=.55;cg.add(bs);});
    cg.position.set(cp[0],cp[1],cp[2]);scene.add(cg);animDeco.push({mesh:cg,baseY:cp[1],ph:ci2*1.7,drift:true});
  });
  var sunGlow=new THREE.Mesh(new THREE.SphereGeometry(3.4,16,12),new THREE.MeshBasicMaterial({color:0xfff3b0,transparent:true,opacity:.85}));
  sunGlow.position.set(38,34,-120);scene.add(sunGlow);
  /* Mosque silhouette far north, beyond the Ruangan Rahasia Mythic */
  var mosqueG=new THREE.Group();
  mosqueG.add(box(10,4,6,0xe8f4f2,0,2,0));var md=sph(3.1,0x2f9e8f,0,5.4,0);md.scale.y=.8;mosqueG.add(md);mosqueG.add(cyl(.3,.3,2.6,0xffc93c,0,8.2,0,8));
  mosqueG.add(cyl(.7,.9,9,0xe8f4f2,-7,4.5,0,10));mosqueG.add(cyl(.7,.9,9,0xe8f4f2,7,4.5,0,10));
  var mc1=new THREE.Mesh(new THREE.ConeGeometry(1,2,10),mat(0x2f9e8f));mc1.position.set(-7,10,0);var mc2=mc1.clone();mc2.position.x=7;mosqueG.add(mc1,mc2);
  mosqueG.position.set(0,0,-126);scene.add(mosqueG);
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
  player=makeAvatar(OUTFITS[0].shirt,OUTFITS[0].pants,0xffd9a0,OUTFITS[0]);playerPos=new THREE.Vector3(0,0,22);player.position.copy(playerPos);player.rotation.y=Math.PI;scene.add(player);
  var botDefs=[{s:OUTFITS[1].shirt,p:OUTFITS[1].pants,x:-9,z:20,st:OUTFITS[1]},{s:0x23242a,p:0x2a2d34,x:9,z:20,st:OUTFITS[2]}];
  botDefs.forEach(function(d,i){var b=makeAvatar(d.s,d.p,0xffd9a0,d.st);b.position.set(d.x,0,d.z);b.userData.ai={t:Math.random()*3,target:new THREE.Vector3(d.x,0,d.z),carry:null,phase:'idle',wait:1+i*2};scene.add(b);bots.push(b);});
  /* Guardians: one Penjaga Jahat (rock monster) per room — patrols its own room, but chases thieves across the whole map to the safe gate */
  ROOMS.forEach(function(room){
    var g=makeMonster(room);
    var band=cyl(.98,1.08,.18,room.accent,0,.32,0,20);g.add(band);
    var ring=new THREE.Mesh(new THREE.TorusGeometry(1.15,.06,8,28),new THREE.MeshBasicMaterial({color:room.glow||room.accent}));
    ring.rotation.x=Math.PI/2;ring.position.y=.07;g.add(ring);
    var lbl=makeLabel(room.guardName.toUpperCase(),room.glowCss||room.accentCss,room.id===4?6.2:(room.guardName.length>20?7.8:6.4));lbl.position.set(0,5.6,0);g.add(lbl);
    g.scale.setScalar([0.82,1.0,1.28,1.65][room.id-1]||1); /* ukuran berjenjang: Pemula kecil, Penakluk sedang, Sang Legenda besar, Rahasia Mythic RAKSASA */
    var cz=(room.zMax+room.zMin)/2;
    g.position.set(0,0,cz);(room.id===4?secretGroup:scene).add(g);
    var pts=[[-32,.3],[30,.62],[0,.85],[-24,.68],[34,.28]].map(function(p){return new THREE.Vector3(p[0],0,room.zMin+p[1]*(room.zMax-room.zMin));});
    guardians.push({mesh:g,room:room,state:'patrol',idx:0,pts:pts,alertTimer:0,roarTimer:0,home:new THREE.Vector3(0,0,cz)});
  });
  /* Stealable items: each room spawns its own pool */
  var spotFrac=[[-30,.3],[-11,.68],[12,.35],[32,.72],[-20,.52]];
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
  var par=(roomId===4&&secretGroup)?secretGroup:scene;
  var g=makeItemMesh(base);g.position.set(x,1.05,z);
  var ped=cyl(.55,.7,.5,0xfdf6e3,x,.25,z,12);par.add(ped);
  var ring=new THREE.Mesh(new THREE.TorusGeometry(.85,.05,8,26),new THREE.MeshBasicMaterial({color:0xffc93c}));
  ring.rotation.x=Math.PI/2;ring.position.set(x,.55,z);par.add(ring);
  par.add(g);
  items.push({id:itemIdSeq++,base:base,group:g,ped:ped,ring:ring,x:x,z:z,room:roomId||1,taken:false,bob:Math.random()*6});
}
function respawnLater(base,roomId){
  var room=ROOMS[(roomId||1)-1]||ROOMS[0];
  var delay=room.id===4?12000:4000; /* Ruangan Rahasia Mythic stock is deliberately scarce */
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
    if(room.secret&&!S.secretRevealed)return; /* titik ruangan rahasia pun belum kelihatan sebelum reveal */
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
  it.taken=true;[it.group,it.ped,it.ring].forEach(function(o){if(o.parent)o.parent.remove(o);});
  items=items.filter(function(x){return x!==it;});
  S.carrying={base:it.base,room:it.room};S.steals++;
  carryMesh=makeItemMesh(it.base);carryMesh.scale.setScalar(1.1);scene.add(carryMesh);
  var gd=guardianOf(it.room);
  if(gd){gd.state='alert';gd.alertTimer=gd.room.guard.reaction;gd.mesh.userData.bang.visible=true;}
  sfx('pickup');sfx('roar');
  $('chaseText').textContent=ROOMS[it.room-1].guardName.toUpperCase()+' MENGEJARMU! Lari ke zona aman!';
  $('chaseBanner').classList.add('on');
  toast('😱 KETAHUAN! '+ROOMS[it.room-1].guardName+' mengejarmu — KABUR!',2200);
  respawnLater(it.base,it.room);
  updateHUD();
}
function checkUnlocks(){
  var newly=[];
  ROOMS.forEach(function(room){
    if(room.secret)return; /* Ruangan Rahasia Mythic punya reveal khususnya sendiri di bawah */
    if(isUnlocked(room)&&!S.announced[room.id]){S.announced[room.id]=true;newly.push(room);}
  });
  if(newly.length){refreshGates();sfx('fanfare');toast('🔓 RUANGAN BARU TERBUKA: '+newly.map(function(r){return r.name;}).join(', ')+'!',3600);}
  if(!S.secretRevealed&&!S.secretRevealing&&discoveredCount()>=15)startSecretReveal();
}
/* ===== REVEAL RUANGAN RAHASIA MYTHIC =====
   Katalog ke-15 terkumpul → bumi bergetar ±1,3 detik sambil banner AWAS tampil,
   lalu wujud ruangan muncul dan tebing raksasa tenggelam ke dalam bumi. */
function startSecretReveal(){
  if(S.secretRevealing||S.secretRevealed)return;
  S.secretRevealing=true;reveal.active=true;reveal.t=0;reveal.shown=false;reveal.lastRoar=0;
  var sa=$('secretAlert');if(sa)sa.classList.add('on');
  sfx('roar');
}
function updateSecretReveal(dt){
  if(!reveal.active)return;
  reveal.t+=dt;
  if(reveal.t-reveal.lastRoar>.55){reveal.lastRoar=reveal.t;sfx('roar');}
  if(secretCover&&!reveal.shown){secretCover.position.x=(Math.random()-.5)*.4;secretCover.position.z=(Math.random()-.5)*.25;}
  if(reveal.t>=1.3&&!reveal.shown){reveal.shown=true;if(secretGroup)secretGroup.visible=true;}
  if(reveal.shown&&secretCover){var p=Math.min(1,(reveal.t-1.3)/1.8);secretCover.position.y=-p*9;secretCover.position.x=(Math.random()-.5)*.3*(1-p);secretCover.position.z=0;}
  if(reveal.t>=3.4){
    reveal.active=false;S.secretRevealing=false;S.secretRevealed=true;S.announced[4]=true;
    if(secretCover)secretCover.visible=false;
    var sa=$('secretAlert');if(sa)sa.classList.remove('on');
    sfx('fanfare');refreshGates();updateHUD();
    toast('🔓 RUANGAN RAHASIA MYTHIC TERBUKA! 5 katalog spesial Celestial menanti di balik tebing — dijaga Ketua Para Penjaga Jahat yang RAKSASA!',4800);
  }
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
  toast('💥 TERTANGKAP '+(dropped?ROOMS[dropped.room-1].guardName.toUpperCase():'PENJAGA JAHAT')+'! Barangmu jatuh di '+ (dropped?ROOMS[dropped.room-1].name:'taman') +'. Tidak ada koin untuk barang yang gagal diekstrak!',3200);
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
  var st=$('openStage');st.classList.add('shake');sfx('roar');
  $('rewardName').textContent='Goyang… goyang… goyang…';
  setTimeout(function(){
    st.classList.remove('shake');st.classList.add('pop');
    var rw=rollReward(S.extracted.base,S.extracted.room);S.lastReward=rw;
    st.classList.add('mut-'+rw.mut.id);
    st.innerHTML=visualHTML(rw.base,true,rw.mut);
    var rb=$('rarityBig');rb.textContent='★ '+rw.rarity.name.toUpperCase()+' ★';rb.style.color=rw.rarity.color;
    $('rewardName').textContent=(rw.mut.id==='basic'?'':rw.mut.name+' ')+rw.base.name;
    $('rewardMeta').textContent='Rarity '+rw.rarity.name+' • Mutasi '+rw.mut.name+' • Nilai '+rw.value+' 🪙'+(S.collection[rw.key]?' • (sudah punya — tetap dapat koin!)':' • ✨ BARU di katalog!');
    $('coinGain').textContent=rw.value;
    $('btnCollect').style.display='block';
    if(rw.rarity.id==='legendary'||rw.rarity.id==='secret')sfx('fanfare');else sfx('open');
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
  checkUnlocks();
  if(discoveredCount()>=TOTAL){sfx('fanfare');setTimeout(function(){toast('🏆 TAMAT! 20 / 20 katalog lengkap — kamu resmi Master Steal the Lebaran! 🎉',5200);},2800);}
  refreshStands();updateHUD();
});
/* ============ CATALOGUE UI ============ */
var catFilter='all';
function renderCatalog(){
  $('catProgText').textContent=discoveredCount()+' / '+TOTAL+' ditemukan'+(discoveredCount()>=TOTAL?' • 🏆 TAMAT!':'');
  $('catProgBar').style.width=(discoveredCount()/TOTAL*100)+'%';
  var tabs=$('catTabs');tabs.innerHTML='';
  CATS.forEach(function(c){var b=document.createElement('button');b.className='tab'+(catFilter===c.id?' on':'');b.textContent=c.name;b.addEventListener('click',function(){catFilter=c.id;renderCatalog();});tabs.appendChild(b);});
  var grid=$('catGrid');grid.innerHTML='';
  CATALOG.forEach(function(e){
    if(catFilter!=='all'&&e.cat!==catFilter)return;
    var ownedInst=S.collection[e.key];var owned=!!ownedInst;
    var dispRarity=owned?ownedInst.rarity:e.rarity;
    var card=document.createElement('div');card.className='card'+(owned?'':' locked');
    card.innerHTML='<div class="tile mut-'+e.mut.id+'">'+visualHTML(e.base,false,e.mut)+'</div><div class="nm">'+(owned?(e.mut.id==='basic'?'':e.mut.name+' ')+e.base.name:'???')+'</div><span class="tag" style="background:'+(owned?dispRarity.color:'#7a828e')+'">'+(owned?dispRarity.name:'Undiscovered')+'</span>'+(owned&&S.counts[e.key]>1?'<div style="font-size:11px;font-weight:900">× '+S.counts[e.key]+'</div>':'');
    card.addEventListener('click',function(){showDetail(e,owned);});
    grid.appendChild(card);
  });
}
function showDetail(e,owned){
  var inst=S.collection[e.key];
  $('detTitle').textContent=owned?((e.mut.id==='basic'?'':e.mut.name+' ')+e.base.name):'??? Belum Ditemukan';
  $('detEmo').className='detailEmo'+(owned?' mut-'+e.mut.id:'');
  $('detEmo').innerHTML=owned?visualHTML(e.base,true,e.mut):'<span class="emo-big">❓</span>';
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
    if(room.secret&&!S.secretRevealed){
      row.innerHTML='<div class="swatch" style="background:#3a3630"></div><div class="info"><b>❓ Ruangan Misterius</b><div>Di utara Ruangan Sang Legenda berdiri dinding tebing raksasa. Konon ada ruangan yang tersembunyi di dalam bumi di baliknya…<br>Kumpulkan 15 katalog untuk membukanya. (Kamu: '+discoveredCount()+' / 15)</div></div><span class="st" style="background:#e8e2d4">🪨 TERSEMBUNYI</span>';
      list.appendChild(row);return;
    }
    row.innerHTML='<div class="swatch" style="background:'+room.accentCss+'"></div><div class="info"><b>'+room.name+'</b><div>Rarity: '+room.rarities+'<br>Penjaga: '+room.guardName+' • '+room.diff+' • Kecepatan kejar '+room.guard.chase.toFixed(1)+'<br>Penjaga mengejar sampai gerbang Zona Aman.<br>'+(un?'Sudah bisa dimasuki.':unlockText(room))+'</div></div><span class="st" style="background:'+(un?'#d9f5df':'#f3d7d7')+'">'+(un?'🔓 TERBUKA':'🔒 TERKUNCI')+'</span>';
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
      +'<p class="fineprint" style="margin-top:10px">Harga naik 3× tiap level: 100 → 300 → 900 → 2.700 → 8.100 → 24.300 … Maksimum Level '+MAX_SPEED_LEVEL+'. Upgrade berlaku permanen selama sesi bermain ini.</p>';
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
  var list=$('upgList');list.innerHTML='<p style="font-weight:900;margin-top:0">Saldo: '+fmt(S.coins)+' 🪙 • Untuk kecepatan lari, ketuk tombol ⚡ BELI SPEED di sisi kanan layar.</p>';
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
function setOutfit(i){
  S.outfit=i;var o=OUTFITS[i];
  var np=makeAvatar(o.shirt,o.pants,0xffd9a0,o);
  np.position.copy(playerPos);np.rotation.y=player.rotation.y;
  scene.remove(player);player=np;scene.add(player);
}
$('btnOutfit').addEventListener('click',function(){ac();setOutfit((S.outfit+1)%OUTFITS.length);sfx('open');toast('🧒 Character baru: '+OUTFITS[S.outfit].name+'! Ketuk CHARACTER lagi buat ganti gaya.',2400);});
$('btnSound').addEventListener('click',function(){S.muted=!S.muted;var w=document.querySelector('#btnSound .snd-waves');if(w)w.style.display=S.muted?'none':'';$('btnSound').style.opacity=S.muted?.55:1;if(!S.muted)sfx('coin');});
document.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click',function(){$(b.getAttribute('data-close')).classList.remove('open');});});
$('btnAction').addEventListener('click',doAction);
var speedAlertTimer=null,speedAlertSeen=false;
function showSpeedAlert(ms){var a=$('speedAlert');if(!a)return;a.classList.add('on');speedAlertSeen=true;clearTimeout(speedAlertTimer);speedAlertTimer=setTimeout(function(){a.classList.remove('on');},ms||9000);}
function hideSpeedAlert(){$('speedAlert').classList.remove('on');clearTimeout(speedAlertTimer);}
$('speedAlertClose').addEventListener('click',hideSpeedAlert);
$('btnSpeedAlert').addEventListener('click',function(){hideSpeedAlert();ac();renderSpeedShop();$('speedModal').classList.add('open');});
$('btnStartSpeed').addEventListener('click',function(){ac();renderSpeedShop();$('speedModal').classList.add('open');});
$('btnStart').addEventListener('click',function(){ac();S.started=true;$('start').style.display='none';toast('🏃 Ruangan Pemula ada tepat di depan gerbang. Ambil barang terdekat, lalu kabur!',3400);updateHUD();showSpeedAlert(10000);});
/* ============ INPUT ============ */
window.addEventListener('keydown',function(e){keys[e.key.toLowerCase()]=true;if(e.key===' '||e.key.toLowerCase()==='e'){e.preventDefault();if(S.started)doAction();}});
window.addEventListener('keyup',function(e){keys[e.key.toLowerCase()]=false;});
var dragId=null,lastPX=0;
/* ===== JOYSTICK TRANSPARAN TAK TERLIHAT DI SELURUH LAYAR (mobile) =====
   Tidak ada tombol joystick & tidak ada tombol kursor lagi. Sentuh & seret di mana pun
   pada area game: titik sentuh menjadi pusat joystick tak terlihat — seret ke atas =
   maju, bawah = mundur, kiri/kanan = geser menyamping. Lepas sentuhan = berhenti.
   Pointer mouse (desktop) tetap menyeret untuk memutar kamera; WASD/panah juga bisa. */
var joyTouchId=null,joyOX=0,joyOY=0;
document.addEventListener('pointerdown',function(e){
  if(e.target.closest('button')||e.target.closest('.modal')||e.target.closest('#start')||e.target.closest('#dock'))return;
  if(e.pointerType==='mouse'){dragId=e.pointerId;lastPX=e.clientX;return;}
  if(S.started&&joyTouchId===null){joyTouchId=e.pointerId;joyOX=e.clientX;joyOY=e.clientY;joyVec.x=0;joyVec.y=0;ac();}
});
document.addEventListener('pointermove',function(e){
  if(e.pointerId===dragId){camYaw-=(e.clientX-lastPX)*.005;lastPX=e.clientX;return;}
  if(e.pointerId===joyTouchId){
    var dx=e.clientX-joyOX,dy=e.clientY-joyOY,len=Math.hypot(dx,dy),max=55;
    if(len<7){joyVec.x=0;joyVec.y=0;}
    else{if(len>max){dx=dx/len*max;dy=dy/len*max;}joyVec.x=dx/max;joyVec.y=dy/max;}
  }
});
function ptrEnd(e){if(e.pointerId===dragId)dragId=null;if(e.pointerId===joyTouchId){joyTouchId=null;joyVec.x=0;joyVec.y=0;}}
document.addEventListener('pointerup',ptrEnd);
document.addEventListener('pointercancel',ptrEnd);
/* ============ BOT AI (rival bots stay around Ruangan Pemula + safe zone) ============ */
function updateBot(b,dt,t){
  var ai=b.userData.ai;ai.t-=dt;
  var p=b.position;
  if(ai.t<=0){
    if(ai.phase==='idle'){ai.phase='run';ai.target.set(Math.random()*64-32,0,-2-Math.random()*12);ai.t=6+Math.random()*4;}
    else if(ai.phase==='run'){ai.phase='back';if(!ai.carry&&Math.random()<.8){ai.carry=makeItemMesh(BASES[Math.floor(Math.random()*BASES.length)]);ai.carry.scale.setScalar(.95);b.add(ai.carry);ai.carry.position.set(0,3.7,0);}ai.target.set(Math.random()*16-8,0,22+Math.random()*5);ai.t=7;}
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
    if(gd.alertTimer<=0){gd.state='chase';gd.roarTimer=0;updateRoomUI();}
  }else if(gd.state==='chase'){
    /* The chase does NOT end at the room edge: the guardian pursues across every room
       until the player crosses the safe gate (or drops / loses the loot). */
    if(!S.carrying||playerPos.z>BOUND_Z+0.4){
      gd.state='return';ud.bang.visible=false;$('chaseBanner').classList.remove('on');updateRoomUI();
    }else{
      eTarget=playerPos;eSpeed=room.guard.chase;
      gd.roarTimer-=dt;if(gd.roarTimer<=0){gd.roarTimer=1.15;sfx('roar');}
      var distE=Math.hypot(playerPos.x-ep.x,playerPos.z-ep.z);
      if(distE<room.guard.attack){onCaught();return;}
    }
  }else if(gd.state==='return'){
    eTarget=gd.home;eSpeed=room.guard.patrol*1.9;
    if(Math.hypot(ep.x-gd.home.x,ep.z-gd.home.z)<1.2)gd.state='patrol';
  }else{ /* patrol — also notices a thief carrying this room's loot inside detection radius */
    if(S.carrying&&S.carrying.room===room.id&&playerPos.z<=room.zMax&&playerPos.z>=room.zMin){
      var dd=Math.hypot(playerPos.x-ep.x,playerPos.z-ep.z);
      if(dd<room.guard.detect){gd.state='alert';gd.alertTimer=room.guard.reaction;ud.bang.visible=true;sfx('roar');
        $('chaseText').textContent=room.guardName.toUpperCase()+' MENGEJARMU! Lari ke zona aman!';$('chaseBanner').classList.add('on');updateRoomUI();}
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
    else{ep.z=Math.max(-106,Math.min(BOUND_Z-0.8,ep.z));} /* chase/return roam the whole map — but NEVER enter the safe zone */
    var esw=Math.sin(t*(gd.state==='chase'?13:7))*.55;
    ud.legL.rotation.x=esw;ud.legR.rotation.x=-esw;ud.armR.rotation.x=gd.state==='chase'?Math.sin(t*13)*.8-.4:-.9;
    if(ud.wingL){var wf=.18+Math.sin(t*(gd.state==='chase'?11:3.5))*.2;ud.wingL.rotation.z=-wf;ud.wingR.rotation.z=wf;}
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
      playerPos.z=Math.max(-106,Math.min(31,playerPos.z));
      /* Gate / wall collision: divider walls block outside the gap; locked gates block the gap */
      BOUNDARIES.forEach(function(b){
        if((prevZ-b.z)*(playerPos.z-b.z)<0){
          if(Math.abs(playerPos.x)>b.gap){playerPos.z=prevZ;}
          else if(playerPos.z<prevZ&&!b.always){
            var rm=ROOMS[b.north-1];
            if(!isUnlocked(rm)){playerPos.z=prevZ;
              var now=Date.now();
              if(now-S.lockToastAt>2500){S.lockToastAt=now;
                if(rm.secret&&!S.secretRevealed)toast('🪨 Dinding tebing raksasa menghalangimu! Ada sesuatu yang tersembunyi di dalam bumi di baliknya… Kumpulkan 15 katalog untuk membukanya. ('+discoveredCount()+' / 15)',3200);
                else toast('🔒 '+rm.name+' terkunci! '+unlockText(rm)+' Rarity di sana: '+rm.rarities+'.',3000);}
            }
          }
        }
      });
      player.position.copy(playerPos);player.position.y=Math.abs(Math.sin(t*10.5))*(moving?.06:0)+Math.sin(t*2)*.02;
      if(carryMesh){carryMesh.position.set(playerPos.x,3.85+Math.sin(t*3.2)*.12,playerPos.z);carryMesh.rotation.y=t*1.6;}
      /* Room enter detection + notification */
      var rNow=roomAt(playerPos.z);
      if(rNow!==S.currentRoom){
        S.currentRoom=rNow;
        if(rNow>0){var rm2=ROOMS[rNow-1];toast('🚪 Memasuki '+rm2.name+' — Rarity: '+rm2.rarities+' • Penjaga: '+rm2.guardName+' ('+rm2.diff+')',2600);sfx('open');}
        updateRoomUI();
      }
      if(S.carrying&&playerPos.z>BOUND_Z+1.2)onExtracted();
      items.forEach(function(it){it.group.position.y=1.05+Math.sin(t*2.2+it.bob)*.14;it.group.rotation.y=t*.9+it.bob;it.ring.rotation.z=t*1.4;});
      guardians.forEach(function(gd){if(gd.room.id===4&&!S.secretRevealed)return;updateGuardian(gd,dt,t);});
      updateSecretReveal(dt);
      bots.forEach(function(b){updateBot(b,dt,t);});
      if(scene.userData.beam)scene.userData.beam.material.emissiveIntensity=1.1+Math.sin(t*3)*.5;
      if(scene.userData.line)scene.userData.line.material.opacity=.55+Math.sin(t*3)*.25;
      gateBarriers[4]&&(gateBarriers[4].material.opacity=.22+Math.sin(t*3)*.14);
      animDeco.forEach(function(d){if(d.spin){d.mesh.rotation.z=t*0.8;}else{d.mesh.position.y=d.baseY+Math.sin(t*1.8+d.ph)*.35;if(d.drift)d.mesh.position.x+=Math.sin(t*.11+d.ph)*.006;}});
      rainbowFx.forEach(function(rf){rf.traverse(function(o){if(o.userData.rainbow&&o.material&&o.material.color)o.material.color.setHSL((t*.22+(o.userData.hueOff||0))%1,.85,.6);if(o.userData.rainbowRing&&o.material)o.material.color.setHSL((t*.3)%1,.9,.6);});});
      decorGroup.children.forEach(function(ch,i){if(ch.geometry&&ch.geometry.type==='OctahedronGeometry')ch.rotation.y=t*.7+i;});
    }
    var ar=camera.aspect;
    var camDist=ar<0.75?17.5:(ar<1.1?14.5:11.5),camH=ar<1?9.5:7.2;
    var offX=Math.sin(camYaw)*camDist,offZ=Math.cos(camYaw)*camDist;
    var desired=new THREE.Vector3(playerPos.x+offX,camH,playerPos.z+offZ);
    camera.position.lerp(desired,.08);
    camera.lookAt(playerPos.x,1.6,playerPos.z);
    if(reveal.active){var shAmp=reveal.t<1.3?.55:.25;camera.position.x+=(Math.random()-.5)*shAmp;camera.position.y+=(Math.random()-.5)*shAmp*.7;}
  }catch(err){var d=$('err');d.style.display='block';d.textContent='Error: '+err.message;}
  renderer.render(scene,camera);
}
/* ============ BOOT ============ */
try{
  buildWorld();clock=new THREE.Clock();
  document.getElementById('colProg').textContent='0 / '+TOTAL;
  updateHUD();animate();
}catch(err){var d=$('err');d.style.display='block';d.textContent='Gagal memuat 3D: '+err.message;}

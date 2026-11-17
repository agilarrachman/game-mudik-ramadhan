(function(){
      "use strict";
      var M = window.Matter;
      var Engine=M.Engine, Bodies=M.Bodies, Body=M.Body, Composite=M.Composite,
          Events=M.Events, Vector=M.Vector;

      /* ============ CONFIG ============ */
      var W=420, H=600;
      var DANGER_Y=118, DROP_Y=64, WALL_T=60;
      var LEVELS=[
        {name:"Mini Nastar",        r:17},
        {name:"Jumbo Nastar",       r:25},
        {name:"Kastengel",          r:34},
        {name:"Putri Salju",        r:44},
        {name:"Kue Semprit",        r:55},
        {name:"Lidah Kucing",       r:67},
        {name:"Toples Kue Lebaran", r:82},
        {name:"Hampers Lebaran",    r:99}
      ];
      var MERGE_POINTS=[10,20,40,80,150,250,500]; /* merging two of level i (0-based) */
      var DROP_POOL=[0,0,0,1,1,1,2,2,3];         /* levels 1-4, weighted small */

      /* ============ STATE ============ */
      var started=false, paused=false, gameOver=false, relaxed=false;
      var score=0, displayScore=0, best=0;
      try{ best=parseInt(localStorage.getItem("kueRushBest")||"0",10)||0; }catch(e){ best=0; }
      var combo=0, comboTimer=0;
      var currentLevel=randDrop(), nextLevel=randDrop();
      var aimX=W/2, canDrop=true, dropCooldown=0, previewPop=1;
      var dangerTimer=0, dangerActive=false;
      var hasDropped=false;
      var particles=[], floaters=[];
      var anim=new Map(); /* bodyId -> {pop, squash, born} */

      function randDrop(){ return DROP_POOL[Math.floor(Math.random()*DROP_POOL.length)]; }

      /* ============ DOM ============ */
      function $(id){ return document.getElementById(id); }
      var canvas=$("game"), ctx=canvas.getContext("2d");
      var frame=$("boardFrame");
      var scoreVal=$("scoreVal"), bestVal=$("bestVal"), comboVal=$("comboVal"),
          comboCard=$("comboCard"), scoreCard=$("scoreCard"), modePill=$("modePill");
      bestVal.textContent=best.toLocaleString("id-ID");

      /* HiDPI scaling */
      function fitCanvas(){
        var dpr=Math.min(window.devicePixelRatio||1,2);
        canvas.width=W*dpr; canvas.height=H*dpr;
        ctx.setTransform(dpr,0,0,dpr,0,0);
      }
      fitCanvas();

      /* ============ AUDIO (WebAudio synth) ============ */
      var AC=null, soundOn=true, musicOn=true, musicTimer=null, musicStep=0;
      function audio(){
        if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ AC=null; } }
        if(AC && AC.state==="suspended") AC.resume();
        return AC;
      }
      function tone(freq,t0,dur,type,vol,slideTo){
        if(!soundOn) return; var ac=audio(); if(!ac) return;
        var o=ac.createOscillator(), g=ac.createGain();
        o.type=type||"sine"; o.frequency.setValueAtTime(freq,ac.currentTime+t0);
        if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo,ac.currentTime+t0+dur);
        g.gain.setValueAtTime(0.0001,ac.currentTime+t0);
        g.gain.exponentialRampToValueAtTime(vol||0.16,ac.currentTime+t0+0.015);
        g.gain.exponentialRampToValueAtTime(0.0001,ac.currentTime+t0+dur);
        o.connect(g); g.connect(ac.destination);
        o.start(ac.currentTime+t0); o.stop(ac.currentTime+t0+dur+0.05);
      }
      function sfxDrop(){ tone(340,0,0.12,"sine",0.10,180); }
      function sfxPop(level){
        var base=420+level*45;
        tone(base,0,0.10,"triangle",0.18);
        tone(base*1.335,0.05,0.12,"triangle",0.16);
        tone(base*1.5,0.10,0.16,"sine",0.14);
      }
      function sfxGolden(){
        var notes=[523,659,784,1047,784,1047,1319];
        for(var i=0;i<notes.length;i++) tone(notes[i],i*0.09,0.28,"triangle",0.16);
        tone(262,0,0.5,"sine",0.08); tone(392,0.1,0.5,"sine",0.08);
      }
      function sfxOver(){
        tone(392,0,0.25,"triangle",0.16); tone(330,0.22,0.25,"triangle",0.16); tone(262,0.44,0.45,"triangle",0.18);
      }
      function sfxClick(){ tone(660,0,0.07,"triangle",0.10); }
      /* gentle festive loop: pentatonic plucks + soft bass */
      var MELODY=[392,440,523,587,523,440,392,330, 349,392,440,523,440,392,349,294,
                  392,440,523,587,659,587,523,440, 523,494,440,392,349,330,294,262];
      function musicTick(){
        if(!musicOn || !soundOn) return;
        var n=MELODY[musicStep%MELODY.length];
        tone(n,0,0.34,"triangle",0.055);
        if(musicStep%4===0) tone(n/2,0,0.6,"sine",0.045);
        if(musicStep%8===4) tone(n*2,0,0.2,"sine",0.02);
        musicStep++;
      }
      function startMusic(){
        if(musicTimer) return;
        musicTimer=setInterval(musicTick,265);
      }
      function setSound(on){
        soundOn=on; musicOn=on;
        $("soundIconOn").style.display=on?"":"none";
        $("soundIconOff").style.display=on?"none":"";
        $("soundBtn").classList.toggle("off",!on);
        $("soundToggle").checked=on;
        if(on){ audio(); startMusic(); }
      }

      /* ============ COOKIE ART (canvas, hand-drawn style) ============ */
      var OUTLINE="#6b4226";
      function rr(c,x,y,w,h,r){
        c.beginPath();
        c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r);
        c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath();
      }
      function circle(c,x,y,r,fill){
        c.beginPath(); c.arc(x,y,r,0,Math.PI*2);
        if(fill){ c.fillStyle=fill; c.fill(); }
        c.lineWidth=Math.max(2,r*0.09); c.strokeStyle=OUTLINE; c.stroke();
      }
      function face(c,x,y,r,opts){
        opts=opts||{};
        var ey=r*0.34, ex=r*0.36;
        c.fillStyle="#3a2415";
        c.beginPath(); c.arc(x-ex,y-ey*0.2,r*0.085,0,Math.PI*2); c.fill();
        c.beginPath(); c.arc(x+ex,y-ey*0.2,r*0.085,0,Math.PI*2); c.fill();
        c.fillStyle="#fff";
        c.beginPath(); c.arc(x-ex+r*0.03,y-ey*0.2-r*0.03,r*0.03,0,Math.PI*2); c.fill();
        c.beginPath(); c.arc(x+ex+r*0.03,y-ey*0.2-r*0.03,r*0.03,0,Math.PI*2); c.fill();
        c.strokeStyle="#3a2415"; c.lineWidth=Math.max(1.6,r*0.055); c.lineCap="round";
        c.beginPath(); c.arc(x,y+r*0.08,r*0.20,0.25*Math.PI,0.75*Math.PI); c.stroke();
        c.fillStyle="rgba(255,130,150,.5)";
        c.beginPath(); c.arc(x-r*0.55,y+r*0.16,r*0.13,0,Math.PI*2); c.fill();
        c.beginPath(); c.arc(x+r*0.55,y+r*0.16,r*0.13,0,Math.PI*2); c.fill();
      }
      function star(c,x,y,r,fill){
        c.beginPath();
        for(var i=0;i<10;i++){
          var rad=i%2? r*0.45:r, a=-Math.PI/2+i*Math.PI/5;
          var px=x+Math.cos(a)*rad, py=y+Math.sin(a)*rad;
          i?c.lineTo(px,py):c.moveTo(px,py);
        }
        c.closePath(); c.fillStyle=fill; c.fill();
        c.lineWidth=1.4; c.strokeStyle=OUTLINE; c.stroke();
      }
      function crescent(c,x,y,r,fill){
        c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fillStyle=fill; c.fill();
        c.beginPath(); c.arc(x+r*0.45,y-r*0.3,r*0.82,0,Math.PI*2);
        c.fillStyle="rgba(255,247,230,1)"; c.globalCompositeOperation="destination-out";
        c.fill(); c.globalCompositeOperation="source-over";
      }
      function drawCookie(c,level,x,y,r,angle){
        c.save(); c.translate(x,y); c.rotate(angle||0);
        c.lineJoin="round"; c.lineCap="round";
        switch(level){
          case 0: /* Mini Nastar */
            circle(c,0,0,r,"#f7b733");
            c.beginPath(); c.arc(-r*0.3,-r*0.38,r*0.34,0,Math.PI*2); c.fillStyle="rgba(255,255,255,.35)"; c.fill();
            circle(c,0,-r*0.05,r*0.44,"#a34d12");
            c.beginPath(); c.arc(-r*0.12,-r*0.16,r*0.16,0,Math.PI*2); c.fillStyle="rgba(255,190,90,.55)"; c.fill();
            star(c,r*0.34,-r*0.52,r*0.17,"#5d2f0c");
            face(c,0,r*0.18,r*0.8);
            break;
          case 1: /* Jumbo Nastar */
            circle(c,0,0,r,"#f9a826");
            c.beginPath(); c.arc(-r*0.32,-r*0.4,r*0.36,0,Math.PI*2); c.fillStyle="rgba(255,255,255,.4)"; c.fill();
            c.beginPath(); c.arc(0,0,r*0.58,0,Math.PI*2); c.fillStyle="#f7b733"; c.fill();
            circle(c,0,-r*0.04,r*0.46,"#93390d");
            c.strokeStyle="#c05f1d"; c.lineWidth=r*0.09;
            c.beginPath(); c.arc(0,-r*0.04,r*0.26,0.4,2.4); c.stroke();
            c.beginPath(); c.arc(0,-r*0.04,r*0.13,2.6,5.2); c.stroke();
            star(c,r*0.5,-r*0.42,r*0.14,"#5d2f0c");
            face(c,0,r*0.3,r*0.72);
            break;
          case 2: /* Kastengel */
            rr(c,-r*0.88,-r*0.52,r*1.76,r*1.04,r*0.34);
            c.fillStyle="#f2b13c"; c.fill(); c.lineWidth=Math.max(2,r*0.08); c.strokeStyle=OUTLINE; c.stroke();
            c.strokeStyle="#d98a06"; c.lineWidth=r*0.07;
            for(var i=-2;i<=2;i++){ c.beginPath(); c.moveTo(i*r*0.3-r*0.1,-r*0.3); c.lineTo(i*r*0.3+r*0.06,-r*0.05); c.stroke(); }
            c.fillStyle="#ffe08a";
            for(var j=0;j<7;j++){
              var gx=(Math.sin(j*37.7)*0.6)*r, gy=(Math.cos(j*53.3)*0.26)*r-r*0.12;
              c.save(); c.translate(gx,gy); c.rotate(j*1.1); c.fillRect(-r*0.11,-r*0.03,r*0.22,r*0.06); c.restore();
            }
            face(c,0,r*0.28,r*0.66);
            break;
          case 3: /* Putri Salju */
            circle(c,0,0,r,"#fdfbf5");
            c.fillStyle="rgba(214,228,238,.55)";
            [[-.4,-.3],[.3,-.45],[.45,.25],[-.2,.45],[0,.05]].forEach(function(p){
              c.beginPath(); c.arc(p[0]*r,p[1]*r,r*0.13,0,Math.PI*2); c.fill();
            });
            c.save(); c.translate(r*0.38,-r*0.42); c.rotate(0.5);
            c.beginPath(); c.arc(0,0,r*0.2,0,Math.PI*2); c.fillStyle="#ffd66e"; c.fill();
            c.beginPath(); c.arc(r*0.09,-r*0.06,r*0.16,0,Math.PI*2); c.fillStyle="#fdfbf5"; c.fill();
            c.restore();
            face(c,0,r*0.1,r*0.85);
            break;
          case 4: /* Kue Semprit */
            c.beginPath();
            for(var k=0;k<16;k++){
              var rad2=k%2? r*0.78:r, a2=k*Math.PI/8;
              var px2=Math.cos(a2)*rad2, py2=Math.sin(a2)*rad2;
              k?c.lineTo(px2,py2):c.moveTo(px2,py2);
            }
            c.closePath(); c.fillStyle="#f6c453"; c.fill();
            c.lineWidth=Math.max(2,r*0.07); c.strokeStyle=OUTLINE; c.stroke();
            circle(c,0,0,r*0.52,"#f9d976");
            circle(c,0,-r*0.05,r*0.24,"#ef6f9c");
            c.beginPath(); c.arc(-r*0.07,-r*0.12,r*0.08,0,Math.PI*2); c.fillStyle="rgba(255,255,255,.6)"; c.fill();
            face(c,0,r*0.3,r*0.62);
            break;
          case 5: /* Lidah Kucing */
            c.save(); c.rotate(-0.5);
            rr(c,-r*0.95,-r*0.34,r*1.9,r*0.68,r*0.34);
            c.fillStyle="#eebd6d"; c.fill(); c.lineWidth=Math.max(2,r*0.07); c.strokeStyle=OUTLINE; c.stroke();
            c.strokeStyle="#c98d3d"; c.lineWidth=r*0.08;
            [-0.55,-0.18,0.18,0.55].forEach(function(fx){
              c.beginPath(); c.moveTo(fx*r,-r*0.24); c.lineTo(fx*r+ r*0.08,r*0.24); c.stroke();
            });
            c.restore();
            c.save(); c.rotate(0.85); c.translate(r*0.18,r*0.34);
            rr(c,-r*0.8,-r*0.26,r*1.6,r*0.52,r*0.26);
            c.fillStyle="#f4cd82"; c.fill(); c.lineWidth=Math.max(2,r*0.06); c.strokeStyle=OUTLINE; c.stroke();
            c.restore();
            face(c,-r*0.1,-r*0.02,r*0.6);
            break;
          case 6: /* Toples Kue Lebaran */
            rr(c,-r*0.78,-r*0.55,r*1.56,r*1.34,r*0.22);
            c.fillStyle="rgba(196,232,244,.92)"; c.fill();
            c.lineWidth=Math.max(2.4,r*0.07); c.strokeStyle=OUTLINE; c.stroke();
            c.save(); rr(c,-r*0.78,-r*0.55,r*1.56,r*1.34,r*0.22); c.clip();
            circle(c,-r*0.3,r*0.28,r*0.3,"#f7b733");
            circle(c,r*0.3,r*0.3,r*0.3,"#f2b13c");
            circle(c,0,r*0.02,r*0.3,"#fdfbf5");
            circle(c,-r*0.34,-r*0.18,r*0.27,"#f6c453");
            c.fillStyle="rgba(255,255,255,.5)"; c.fillRect(-r*0.6,-r*0.45,r*0.16,r*1.1);
            c.restore();
            rr(c,-r*0.86,-r*0.86,r*1.72,r*0.34,r*0.15);
            c.fillStyle="#e2543e"; c.fill(); c.lineWidth=Math.max(2.4,r*0.07); c.strokeStyle=OUTLINE; c.stroke();
            star(c,0,-r*0.69,r*0.13,"#ffd66e");
            face(c,0,r*0.42,r*0.55);
            break;
          case 7: /* Hampers Lebaran */
            c.strokeStyle=OUTLINE; c.lineWidth=r*0.09;
            c.beginPath(); c.arc(0,-r*0.28,r*0.55,Math.PI,0); c.stroke();
            rr(c,-r*0.88,-r*0.05,r*1.76,r*0.9,r*0.14);
            c.fillStyle="#c98a4b"; c.fill(); c.lineWidth=Math.max(2.4,r*0.07); c.strokeStyle=OUTLINE; c.stroke();
            c.strokeStyle="#a96f33"; c.lineWidth=r*0.06;
            [-0.5,0,0.5].forEach(function(fx){ c.beginPath(); c.moveTo(fx*r,-r*0.02); c.lineTo(fx*r,r*0.82); c.stroke(); });
            c.beginPath(); c.moveTo(-r*0.85,r*0.4); c.lineTo(r*0.85,r*0.4); c.stroke();
            circle(c,-r*0.42,-r*0.22,r*0.26,"#f7b733");
            circle(c,r*0.4,-r*0.24,r*0.26,"#fdfbf5");
            circle(c,0,-r*0.34,r*0.28,"#f6c453");
            c.fillStyle="#e2543e";
            c.beginPath(); c.ellipse(-r*0.18,-r*0.52,r*0.16,r*0.09,-0.6,0,Math.PI*2); c.fill();
            c.beginPath(); c.ellipse(r*0.18,-r*0.52,r*0.16,r*0.09,0.6,0,Math.PI*2); c.fill();
            c.lineWidth=1.6; c.strokeStyle=OUTLINE;
            c.beginPath(); c.ellipse(-r*0.18,-r*0.52,r*0.16,r*0.09,-0.6,0,Math.PI*2); c.stroke();
            c.beginPath(); c.ellipse(r*0.18,-r*0.52,r*0.16,r*0.09,0.6,0,Math.PI*2); c.stroke();
            circle(c,0,-r*0.48,r*0.07,"#ffd66e");
            face(c,0,r*0.42,r*0.6);
            break;
        }
        c.restore();
      }

      /* ============ PHYSICS WORLD ============ */
      var engine=Engine.create({ enableSleeping:true });
      engine.gravity.y=1.05;
      var world=engine.world;
      var wallOpts={ isStatic:true, friction:0.6, restitution:0.1, render:{visible:false} };
      var floor=Bodies.rectangle(W/2,H+WALL_T/2-6,W+WALL_T*2,WALL_T,wallOpts);
      var wallL=Bodies.rectangle(-WALL_T/2+4,H/2,WALL_T,H*3,wallOpts);
      var wallR=Bodies.rectangle(W+WALL_T/2-4,H/2,WALL_T,H*3,wallOpts);
      Composite.add(world,[floor,wallL,wallR]);

      function makeCookie(level,x,y,opts){
        opts=opts||{};
        var r=LEVELS[level].r;
        var b=Bodies.circle(x,y,r,{
          restitution:0.22, friction:0.45, frictionAir:0.008,
          density:0.0016, slop:0.02,
          label:"cookie"
        });
        b.plugin.level=level;
        b.plugin.bornAt=performance.now();
        b.plugin.fromMerge=!!opts.fromMerge;
        anim.set(b.id,{ pop:opts.fromMerge?0.2:1, squash:0, flash:opts.fromMerge?1:0 });
        Composite.add(world,b);
        return b;
      }
      function cookies(){
        return Composite.allBodies(world).filter(function(b){ return b.label==="cookie"; });
      }

      /* squash on impact */
      Events.on(engine,"collisionStart",function(ev){
        ev.pairs.forEach(function(p){
          [p.bodyA,p.bodyB].forEach(function(b){
            if(b.label!=="cookie") return;
            var sp=b.speed;
            if(sp>3.2){
              var a=anim.get(b.id); if(a) a.squash=Math.min(0.3,sp*0.03);
            }
          });
        });
      });

      /* ============ MERGE LOGIC ============ */
      var merging=new Set();
      function tryMerge(a,b){
        if(a.label!=="cookie"||b.label!=="cookie") return;
        if(a===b) return;
        var la=a.plugin.level, lb=b.plugin.level;
        if(la!==lb || la>=7) return;
        if(merging.has(a.id)||merging.has(b.id)) return;
        if(!a.parent||!b.parent) return;
        merging.add(a.id); merging.add(b.id);
        var mx=(a.position.x+b.position.x)/2, my=(a.position.y+b.position.y)/2;
        var vx=(a.velocity.x+b.velocity.x)/2, vy=(a.velocity.y+b.velocity.y)/2;
        Composite.remove(world,a); Composite.remove(world,b);
        anim.delete(a.id); anim.delete(b.id);
        var nb=makeCookie(la+1,mx,my,{fromMerge:true});
        Body.setVelocity(nb,{x:vx*0.4,y:Math.min(vy*0.4,-1.2)});
        Body.setAngularVelocity(nb,(a.angularVelocity+b.angularVelocity)/2);
        var pts=MERGE_POINTS[la];
        combo = (comboTimer>0)? combo+1 : 1;
        comboTimer=2.5;
        var bonus=(combo>=2)? (combo-1)*5 : 0;
        addScore(pts+bonus,mx,my-LEVELS[la+1].r,la+1,combo);
        burst(mx,my,la+1);
        if(la+1>=6){ sfxGolden(); goldenBurst(mx,my); }
        else sfxPop(la+1);
        setTimeout(function(){ merging.delete(a.id); merging.delete(b.id); },30);
      }
      Events.on(engine,"collisionStart",function(ev){
        ev.pairs.forEach(function(p){ tryMerge(p.bodyA,p.bodyB); });
      });
      /* reliability sweep: resting contacts that never fired a fresh collision */
      var sweepAcc=0;
      function mergeSweep(dt){
        sweepAcc+=dt;
        if(sweepAcc<0.12) return;
        sweepAcc=0;
        var list=cookies();
        for(var i=0;i<list.length;i++){
          for(var j=i+1;j<list.length;j++){
            var a=list[i], b=list[j];
            if(a.plugin.level!==b.plugin.level||a.plugin.level>=7) continue;
            var d=Vector.magnitude(Vector.sub(a.position,b.position));
            var rr2=LEVELS[a.plugin.level].r*2;
            if(d<rr2*0.92){ tryMerge(a,b); return; }
          }
        }
      }

      /* ============ SCORE / FX ============ */
      function addScore(pts,x,y,newLevel,comboN){
        score+=pts;
        floaters.push({x:x,y:y,text:"+"+pts,t:0,big:newLevel>=6,
                       color:newLevel>=6?"#d98a06":(comboN>=3?"#e2543e":"#3d8b4f")});
        if(comboN>=2) floaters.push({x:x,y:y-30,text:"KOMBO x"+comboN,t:0,big:false,color:"#e07b1f"});
        scoreCard.style.transform="scale(1.09)";
        setTimeout(function(){ scoreCard.style.transform=""; },140);
        scoreCard.style.transition="transform .14s ease";
        if(score>best){
          best=score; bestVal.textContent=best.toLocaleString("id-ID");
          try{ localStorage.setItem("kueRushBest",String(best)); }catch(e){}
        }
      }
      function burst(x,y,level){
        var colors=["#ffd66e","#ffb7c9","#8fd07a","#fff3bf","#ffb38a"];
        var n=level>=6?22:12;
        for(var i=0;i<n;i++){
          var a=Math.random()*Math.PI*2, sp=1+Math.random()*3.2;
          particles.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1.4,
            r:2.5+Math.random()*3.5,t:0,life:0.55+Math.random()*0.4,
            color:colors[i%colors.length],shape:i%4===0?"star":"dot",gold:level>=6});
        }
      }
      function goldenBurst(x,y){
        for(var i=0;i<10;i++){
          var a=Math.random()*Math.PI*2, sp=1.4+Math.random()*3.4;
          particles.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,
            r:5+Math.random()*5,t:0,life:0.9+Math.random()*0.5,
            color:"#ffd66e",shape:i%2?"moon":"star",gold:true});
        }
      }

      /* ============ DROP ============ */
      function drop(){
        if(!started||paused||gameOver||!canDrop) return;
        var r=LEVELS[currentLevel].r;
        var x=Math.max(r+8,Math.min(W-r-8,aimX));
        var b=makeCookie(currentLevel,x,DROP_Y,{});
        Body.setVelocity(b,{x:0,y:1});
        sfxDrop();
        currentLevel=nextLevel; nextLevel=randDrop();
        drawNext(); previewPop=0;
        canDrop=false; dropCooldown=0.55;
        if(!hasDropped){ hasDropped=true; var ht=$("handTut"); ht.setAttribute("hidden",""); ht.style.display="none"; }
      }
      function pointerX(clientX){
        var rect=canvas.getBoundingClientRect();
        return (clientX-rect.left)/rect.width*W;
      }
      var pressing=false;
      frame.addEventListener("pointermove",function(e){
        aimX=pointerX(e.clientX);
      });
      frame.addEventListener("pointerdown",function(e){
        if(e.target.closest(".overlay")||e.target.closest("button")) return;
        pressing=true; aimX=pointerX(e.clientX); audio();
      });
      window.addEventListener("pointerup",function(e){
        if(!pressing) return;
        pressing=false;
        if(e.target.closest(".overlay")||e.target.closest("button")||e.target.closest(".modal-back")) return;
        aimX=pointerX(e.clientX);
        drop();
      });
      frame.addEventListener("touchmove",function(e){ e.preventDefault(); },{passive:false});

      /* ============ GAME OVER CHECK ============ */
      function checkDanger(dt){
        if(relaxed||gameOver||!started){ dangerActive=false; dangerTimer=0; return; }
        var now=performance.now(), over=false;
        cookies().forEach(function(b){
          if(now-b.plugin.bornAt<1200) return;
          if(b.position.y-LEVELS[b.plugin.level].r < DANGER_Y && Math.abs(b.velocity.y)<2.2) over=true;
        });
        dangerActive=over;
        if(over){
          dangerTimer+=dt;
          if(dangerTimer>=3) doGameOver();
        } else dangerTimer=Math.max(0,dangerTimer-dt*1.6);
      }
      function doGameOver(){
        gameOver=true; sfxOver();
        $("finalScore").textContent=score.toLocaleString("id-ID");
        $("finalBest").textContent=best.toLocaleString("id-ID");
        $("overOverlay").hidden=false;
      }

      /* ============ RESET / FLOW ============ */
      function resetGame(){
        cookies().forEach(function(b){ Composite.remove(world,b); anim.delete(b.id); });
        particles=[]; floaters=[]; merging.clear();
        score=0; displayScore=0; combo=0; comboTimer=0;
        dangerTimer=0; dangerActive=false; gameOver=false;
        currentLevel=randDrop(); nextLevel=randDrop(); drawNext();
        canDrop=true; dropCooldown=0; previewPop=1;
        scoreVal.textContent="0"; updateComboUI();
      }
      function startGame(){
        started=true; paused=false;
        $("startOverlay").hidden=true;
        $("pauseOverlay").hidden=true;
        $("overOverlay").hidden=true;
        audio(); startMusic();
      }

      /* ============ UI WIRING ============ */
      function drawNext(){
        var nc=$("nextCanvas"), nctx=nc.getContext("2d");
        nctx.clearRect(0,0,76,76);
        drawCookie(nctx,nextLevel,38,40,Math.min(30,LEVELS[nextLevel].r+8),0);
        $("nextName").textContent=LEVELS[nextLevel].name;
      }
      function updateComboUI(){
        if(combo>=2 && comboTimer>0){
          comboVal.textContent="x"+combo;
          comboCard.classList.add("hot");
        } else {
          comboVal.textContent="—";
          comboCard.classList.remove("hot");
        }
      }
      function setPaused(p){
        if(!started||gameOver) return;
        paused=p;
        $("pauseOverlay").hidden=!p;
      }
      function setRelaxed(on){
        relaxed=on;
        $("relaxedToggle").checked=on;
        modePill.textContent=on?"Mode Santai":"Mode Klasik";
        modePill.classList.toggle("relaxed",on);
        if(on){ dangerTimer=0; dangerActive=false; }
      }
      $("startBtn").addEventListener("click",function(){ sfxClick(); resetGame(); startGame(); });
      $("againBtn").addEventListener("click",function(){ sfxClick(); resetGame(); startGame(); });
      $("resumeBtn").addEventListener("click",function(){ sfxClick(); setPaused(false); });
      $("restartFromPauseBtn").addEventListener("click",function(){ sfxClick(); resetGame(); setPaused(false); started=true; $("startOverlay").hidden=true; });
      $("pauseBtn").addEventListener("click",function(){ sfxClick(); setPaused(!paused); });
      $("soundBtn").addEventListener("click",function(){ setSound(!soundOn); if(soundOn) sfxClick(); });
      $("soundToggle").addEventListener("change",function(){ setSound(this.checked); });
      $("settingsBtn").addEventListener("click",function(){
        sfxClick();
        if(started&&!gameOver) setPaused(true);
        $("settingsModal").hidden=false;
      });
      $("closeSettingsBtn").addEventListener("click",function(){
        sfxClick();
        $("settingsModal").hidden=true;
        if(started&&!gameOver) setPaused(false);
      });
      $("settingsModal").addEventListener("click",function(e){
        if(e.target===this){ this.hidden=true; if(started&&!gameOver) setPaused(false); }
      });
      $("relaxedToggle").addEventListener("change",function(){ setRelaxed(this.checked); sfxClick(); });
      $("restartBtn").addEventListener("click",function(){
        sfxClick(); resetGame();
        $("settingsModal").hidden=true;
        if(started){ setPaused(false); $("startOverlay").hidden=true; $("overOverlay").hidden=true; }
      });
      document.addEventListener("keydown",function(e){
        if(e.key===" "||e.key==="Enter"){
          if(started&&!paused&&!gameOver){ drop(); e.preventDefault(); }
        }
        if(e.key==="p"||e.key==="P"||e.key==="Escape"){
          if(!$("settingsModal").hidden){ $("settingsModal").hidden=true; if(started&&!gameOver) setPaused(false); }
          else setPaused(!paused);
        }
        if(e.key==="ArrowLeft") aimX=Math.max(20,aimX-18);
        if(e.key==="ArrowRight") aimX=Math.min(W-20,aimX+18);
      });

      /* evolution bar */
      (function buildEvo(){
        var track=$("evoTrack");
        LEVELS.forEach(function(lv,i){
          if(i>0){
            var ar=document.createElement("div"); ar.className="evo-arrow"; ar.textContent="›";
            track.appendChild(ar);
          }
          var item=document.createElement("div"); item.className="evo-item";
          var badge=document.createElement("div"); badge.className="evo-lv"; badge.textContent=i+1;
          var cv=document.createElement("canvas");
          var size=54; cv.width=size*2; cv.height=size*2; cv.style.width=size+"px"; cv.style.height=size+"px";
          var c2=cv.getContext("2d"); c2.scale(2,2);
          drawCookie(c2,i,size/2,size/2+2,Math.min(size/2-3,lv.r),0);
          var nm=document.createElement("div"); nm.className="evo-name"; nm.textContent=lv.name;
          item.appendChild(badge); item.appendChild(cv); item.appendChild(nm);
          track.appendChild(item);
        });
      })();
      drawNext();

      /* ============ RENDER ============ */
      function drawStarShape(c,x,y,r,fill){
        c.beginPath();
        for(var i=0;i<10;i++){
          var rad=i%2? r*0.45:r, a=-Math.PI/2+i*Math.PI/5;
          var px=x+Math.cos(a)*rad, py=y+Math.sin(a)*rad;
          i?c.lineTo(px,py):c.moveTo(px,py);
        }
        c.closePath(); c.fillStyle=fill; c.fill();
      }
      function drawMoonShape(c,x,y,r,fill){
        c.save();
        c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fillStyle=fill; c.fill();
        c.globalCompositeOperation="destination-out";
        c.beginPath(); c.arc(x+r*0.5,y-r*0.35,r*0.85,0,Math.PI*2); c.fill();
        c.restore();
      }
      var last=performance.now();
      function frameLoop(now){
        requestAnimationFrame(frameLoop);
        var dt=Math.min(0.033,(now-last)/1000); last=now;
        if(started&&!paused&&!gameOver){
          Engine.update(engine,Math.min(16.7,dt*1000));
          mergeSweep(dt);
          checkDanger(dt);
        } else if(started&&!paused&&gameOver){
          Engine.update(engine,Math.min(16.7,dt*1000)*0.25);
        }
        if(dropCooldown>0){ dropCooldown-=dt; if(dropCooldown<=0) canDrop=true; }
        if(previewPop<1) previewPop=Math.min(1,previewPop+dt*4);
        if(comboTimer>0){ comboTimer-=dt; if(comboTimer<=0){ combo=0; } updateComboUI(); }

        /* score count-up */
        if(displayScore!==score){
          var diff=score-displayScore;
          displayScore+=Math.ceil(Math.abs(diff)*0.25)*(diff>0?1:-1);
          if(Math.abs(score-displayScore)<2) displayScore=score;
          scoreVal.textContent=Math.round(displayScore).toLocaleString("id-ID");
        }

        /* ---- draw ---- */
        ctx.clearRect(0,0,W,H);
        /* container inner decorations */
        ctx.save();
        ctx.globalAlpha=0.16; ctx.fillStyle="#e8a33d";
        ctx.beginPath(); ctx.arc(46,540,26,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(382,556,20,0,Math.PI*2); ctx.fill();
        ctx.restore();
        drawMoonShape(ctx,388,44,11,"rgba(245,166,35,.35)");
        drawStarShape(ctx,30,44,8,"rgba(245,166,35,.4)");
        drawStarShape(ctx,352,86,6,"rgba(224,110,140,.35)");

        /* danger line */
        var dangerFlash=dangerActive && Math.floor(now/220)%2===0;
        ctx.save();
        ctx.strokeStyle=dangerActive?(dangerFlash?"#e23b2e":"#ff8a7a"):"rgba(190,90,60,.45)";
        ctx.lineWidth=dangerActive?3:2;
        ctx.setLineDash([9,7]);
        ctx.beginPath(); ctx.moveTo(10,DANGER_Y); ctx.lineTo(W-10,DANGER_Y); ctx.stroke();
        ctx.setLineDash([]);
        if(dangerActive){
          ctx.fillStyle="#e23b2e";
          ctx.font="700 13px Fredoka, sans-serif"; ctx.textAlign="center";
          ctx.fillText("AWAS! Kue hampir penuh!",W/2,DANGER_Y-8);
          ctx.fillStyle="rgba(226,59,46,.85)";
          var tw=(W-120)*(dangerTimer/3);
          rr(ctx,60,DANGER_Y+6,tw,5,2.5); ctx.fill();
        }
        ctx.restore();

        /* guide line + preview */
        if(started&&!paused&&!gameOver&&canDrop){
          var pr=LEVELS[currentLevel].r;
          var gx=Math.max(pr+8,Math.min(W-pr-8,aimX));
          ctx.save();
          ctx.strokeStyle="rgba(107,66,38,.4)"; ctx.lineWidth=2; ctx.setLineDash([6,7]);
          ctx.beginPath(); ctx.moveTo(gx,DROP_Y+pr+4); ctx.lineTo(gx,H-14); ctx.stroke();
          ctx.restore();
          var popScale=0.6+0.4*easeOutBack(previewPop);
          ctx.save();
          ctx.shadowColor="rgba(74,44,20,.25)"; ctx.shadowBlur=6; ctx.shadowOffsetY=3;
          drawCookie(ctx,currentLevel,gx,DROP_Y,pr*popScale,0);
          ctx.restore();
        }

        /* cookies */
        cookies().forEach(function(b){
          var lv=b.plugin.level, r=LEVELS[lv].r;
          var a=anim.get(b.id); if(!a){ a={pop:1,squash:0,flash:0}; anim.set(b.id,a); }
          if(a.pop<1) a.pop=Math.min(1,a.pop+dt*3.2);
          if(a.flash>0) a.flash=Math.max(0,a.flash-dt*2.4);
          if(a.squash>0) a.squash=Math.max(0,a.squash-dt*1.8);
          var scale=easeOutBack(a.pop);
          var sq=a.squash;
          ctx.save();
          ctx.translate(b.position.x,b.position.y);
          /* soft shadow */
          ctx.save();
          ctx.globalAlpha=0.14; ctx.fillStyle="#4a2c14";
          ctx.beginPath(); ctx.ellipse(0,r*0.82,r*0.8,r*0.2,0,0,Math.PI*2); ctx.fill();
          ctx.restore();
          ctx.scale(scale*(1+sq*0.5),scale*(1-sq*0.55));
          if(a.flash>0){
            ctx.save(); ctx.globalAlpha=a.flash*0.75;
            ctx.beginPath(); ctx.arc(0,0,r*1.12,0,Math.PI*2);
            ctx.fillStyle=lv>=6?"#ffd66e":"#fff3bf"; ctx.fill(); ctx.restore();
          }
          drawCookie(ctx,lv,0,0,r,b.angle);
          ctx.restore();
        });

        /* particles */
        particles=particles.filter(function(p){ return p.t<p.life; });
        particles.forEach(function(p){
          p.t+=dt; p.x+=p.vx; p.y+=p.vy; p.vy+=4.5*dt; p.vx*=0.985;
          var al=1-p.t/p.life;
          ctx.save(); ctx.globalAlpha=al;
          if(p.shape==="star") drawStarShape(ctx,p.x,p.y,p.r+2,p.color);
          else if(p.shape==="moon") drawMoonShape(ctx,p.x,p.y,p.r+1,p.color);
          else { ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=p.color; ctx.fill(); }
          ctx.restore();
        });

        /* floating score text */
        floaters=floaters.filter(function(f){ return f.t<1.15; });
        floaters.forEach(function(f){
          f.t+=dt; f.y-=34*dt;
          var al=f.t<0.75?1:1-(f.t-0.75)/0.4;
          ctx.save(); ctx.globalAlpha=Math.max(0,al);
          ctx.font=(f.big?"700 27px":"800 19px")+" Fredoka, Nunito, sans-serif";
          ctx.textAlign="center";
          ctx.lineWidth=4; ctx.strokeStyle="rgba(255,253,246,.95)";
          ctx.strokeText(f.text,f.x,f.y); ctx.fillStyle=f.color; ctx.fillText(f.text,f.x,f.y);
          ctx.restore();
        });
      }
      function easeOutBack(t){
        var c1=1.70158, c3=c1+1;
        return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);
      }
      requestAnimationFrame(frameLoop);
    })();

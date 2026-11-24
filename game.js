// Original low-resolution pixel-art adventure renderer for GitHub Pages.
const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const ui = {
  chapter: document.querySelector('#chapter-name'), number: document.querySelector('#chapter-number'),
  tag: document.querySelector('#chapter-tag'), heading: document.querySelector('#scene-heading'),
  score: document.querySelector('#score'), key: document.querySelector('#key-status'),
  objective: document.querySelector('#objective'), tip: document.querySelector('#scene-tip'),
  start: document.querySelector('#start-screen'), quiz: document.querySelector('#quiz-dialog'),
  quizMeta: document.querySelector('#quiz-meta'), quizTitle: document.querySelector('#quiz-title'),
  quizDescription: document.querySelector('#quiz-description'), answers: document.querySelector('#answers'),
  feedback: document.querySelector('#feedback'), result: document.querySelector('#result-dialog'),
  resultScores: document.querySelector('#result-scores'), progress: document.querySelector('#progress-copy'),
  toast: document.querySelector('#toast'), loading: document.querySelector('#loading-note')
};

const W = 320, H = 180, FLOOR = 145, WORLD = 1040;
canvas.width = W; canvas.height = H;
let level = 1, playerX = 78, jumpY = 0, jumpVelocity = 0, score = [0, 0], misses = [0, 0];
let keyFound = false, enemyAlive = true, running = false, finished = false, attackCooldown = 0;
let heroSheet = makeHeroSheet(), lastToast = 0, audioOn = true, audioContext;
const held = { left: false, right: false };
const colors = [
  { cave:'#15514d', deep:'#0b383d', glow:'#45e9b5', light:'#a3ffe2', gem:'#52d9e2', ground:'#28644b', grass:'#6fb849', grassLight:'#b2df65', pink:'#ff97bf' },
  { cave:'#193d63', deep:'#112b4c', glow:'#6de4ed', light:'#c2f7ff', gem:'#8bc5ff', ground:'#325b70', grass:'#68b976', grassLight:'#c4df83', pink:'#ffa9dc' }
];
const questionData = {
  1: {
    meta:'月光市集・理財小任務', title:'先分配零用錢，再決定想買什麼',
    description:'你有 100 枚星星幣。先存下 30 枚，必需品花 45 枚，剩下最多能花多少買想要的東西？',
    options:['25 枚：先存下來，再付必需品','30 枚：把存款也算成可花的錢','35 枚：忘記把必需品算進去'],
    hint:'試著算算看：100 − 30 − 45。先安排儲蓄與必需品，最後才是想要的東西。',
    correct:'答對了！100 − 30 − 45 = 25 枚。先存錢再消費，星鑰匙是你的！'
  },
  2: {
    meta:'星光樹屋・投資小任務', title:'把星星分放在不同的籃子裡',
    description:'如果把模擬投資星星幣分散在不同類型的籃子裡，最可能有什麼好處？',
    options:['分散風險：單一籃子下跌時，不會影響全部','保證賺錢：投資一定會上漲','完全沒風險：永遠不會虧損'],
    hint:'想想看：如果其中一個籃子遇到變化，其他籃子能不能分擔一部分影響？',
    correct:'答對了！分散投資能降低單一標的帶來的影響，但投資仍有風險。星鑰匙到手！'
  }
};

function makeHeroSheet() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 40;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const p = (f,x,y,w,h,color) => { g.fillStyle=color; g.fillRect(f*32+x*2,y*2,w*2,h*2); };
  const C={o:'#273b3c',hs:'#788b94',h:'#d4dedc',hl:'#f8f4e9',ss:'#d48e86',s:'#f2bda9',sl:'#ffddc7',e:'#327654',el:'#b8e79c',ld:'#245c42',l:'#438b55',ll:'#9bce75',cd:'#28523e',cl:'#438254',ch:'#8abb67',b:'#dfc68b',bd:'#806044',r:'#c95d51',boot:'#76523d',gold:'#f5d07a'};
  for(let f=0;f<2;f++){
    p(f,2,10,3,7,C.o);p(f,2,11,2,5,C.ld);p(f,3,11,2,4,C.l);p(f,3,13,2,1,C.ll);
    p(f,1,7,4,2,C.o);p(f,0,7,3,1,C.ss);p(f,2,7,2,1,C.sl);p(f,12,7,4,2,C.o);p(f,13,7,3,1,C.ss);p(f,13,7,2,1,C.sl);
    p(f,4,5,9,9,C.o);p(f,5,6,7,7,C.s);p(f,6,7,6,5,C.sl);p(f,5,11,2,1,C.ss);p(f,10,11,2,1,C.ss);
    p(f,6,9,2,2,C.o);p(f,10,9,2,2,C.o);p(f,6,9,1,2,C.e);p(f,10,9,1,2,C.e);p(f,6,9,1,1,C.el);p(f,10,9,1,1,C.el);p(f,8,12,2,1,C.ss);
    p(f,4,2,8,4,C.o);p(f,5,1,7,4,C.hs);p(f,5,1,6,3,C.h);p(f,7,1,3,1,C.hl);
    p(f,4,4,3,5,C.hs);p(f,4,5,2,8,C.o);p(f,5,5,2,7,C.h);p(f,5,6,1,5,C.hl);
    p(f,11,4,3,6,C.hs);p(f,12,6,2,9,C.o);p(f,12,7,2,6,C.h);p(f,13,8,1,4,C.hl);
    p(f,7,4,5,2,C.h);p(f,8,4,3,1,C.hl);p(f,9,5,3,2,C.h);p(f,10,6,2,1,C.hl);
    p(f,5,13,8,6,C.o);p(f,6,14,6,4,C.cd);p(f,7,14,4,4,C.cl);p(f,8,14,2,2,C.ch);
    p(f,6,13,6,2,C.r);p(f,10,13,3,1,C.r);p(f,7,17,5,1,C.bd);p(f,8,17,3,1,C.b);p(f,9,17,1,1,C.gold);
    p(f,4,14,2,3,C.ss);p(f,4,14,1,2,C.sl);p(f,12,14,2,3,C.ss);p(f,12,14,1,2,C.sl);
    p(f,3,13,2,2,C.ld);p(f,3,12,2,2,C.l);p(f,4,12,1,1,C.ll);
    p(f,14,13,1,4,C.bd);p(f,14,12,1,1,C.gold);p(f,13,12,1,1,C.gold);
    if(!f){p(f,6,18,3,1,C.o);p(f,6,19,3,1,C.boot);p(f,6,19,2,1,'#b0855b');p(f,10,18,3,1,C.o);p(f,10,19,3,1,C.boot);p(f,11,19,2,1,'#b0855b');}
    else{p(f,6,18,3,1,C.o);p(f,5,19,3,1,C.boot);p(f,5,19,2,1,'#b0855b');p(f,10,18,3,1,C.o);p(f,11,19,3,1,C.boot);p(f,12,19,2,1,'#b0855b');p(f,3,14,2,1,C.ll);}
  }
  return c;
}

function setProgress() {
  const title=level===1?'月光市集':'星光樹屋';
  ui.chapter.textContent=(level===1?'序章':'第二章')+'・'+title;
  ui.number.textContent='0'+level; ui.tag.textContent=level===1?'生活理財・第一課':'生活理財・第二課';
  ui.heading.textContent=title; ui.score.textContent=String(score[level-1]).padStart(3,'0');
  ui.key.textContent=keyFound?'✦ 星鑰匙已取得':'✧ 星鑰匙待尋';ui.key.classList.toggle('has-key',keyFound);
  ui.objective.textContent=keyFound?(level===1?'帶著星鑰匙走到林間拱門':'兩把星鑰匙都找到了！'):(level===1?'探索森林，找到預算知識石碑':'找到星光石碑，回答風險小問題');
}
function toast(text){ui.toast.textContent=text;ui.toast.classList.add('show');lastToast=performance.now();}
function playTone(freq=680,duration=.12){if(!audioOn)return;try{audioContext??=new AudioContext();const o=audioContext.createOscillator(),a=audioContext.createGain();o.type='square';o.frequency.value=freq;a.gain.setValueAtTime(.035,audioContext.currentTime);a.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);o.connect(a).connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+duration);}catch{}}

function openQuiz(){
  const q=questionData[level];ui.quizMeta.textContent=q.meta;ui.quizTitle.textContent=q.title;ui.quizDescription.textContent=q.description;
  ui.feedback.textContent='';ui.feedback.classList.remove('error');ui.answers.replaceChildren();
  q.options.forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.className='answer-button';b.innerHTML='<span class="choice-mark">'+String.fromCharCode(65+i)+'</span><span></span>';b.querySelector('span:last-child').textContent=label;b.addEventListener('click',()=>answer(i));ui.answers.append(b);});
  ui.quiz.showModal();
}
function answer(choice){
  const q=questionData[level];
  if(choice===0){
    ui.feedback.textContent=q.correct;ui.feedback.classList.remove('error');score[level-1]+=Math.max(60,100-misses[level-1]*10);keyFound=true;setProgress();playTone(880,.2);
    ui.answers.querySelectorAll('button').forEach(b=>b.disabled=true);toast('星鑰匙取得！答題得分 '+Math.max(60,100-misses[level-1]*10));
    setTimeout(()=>{ui.quiz.close();if(level===2)finishGame();},1200);
  }else{misses[level-1]++;ui.feedback.textContent=q.hint;ui.feedback.classList.add('error');playTone(250,.1);}
}
function interact(){
  if(!running||finished||ui.quiz.open)return;
  if(!keyFound&&Math.abs(playerX-600)<32){openQuiz();return;}
  if(keyFound&&level===1&&playerX>855)startLevelTwo();
}
function attack(){
  if(!running||finished||attackCooldown>0)return;attackCooldown=.4;
  if(enemyAlive&&Math.abs(playerX-300)<34){enemyAlive=false;score[level-1]+=20;setProgress();playTone(760,.16);toast('星光擊退了森林小精靈！+20');}
  else toast('星光在葉片間閃爍');
}
function startLevelTwo(){level=2;keyFound=false;enemyAlive=true;playerX=78;jumpY=0;jumpVelocity=0;setProgress();toast('月光市集完成！前往星光樹屋');playTone(620,.14);}
function finishGame(){
  finished=true;running=false;keyFound=true;setProgress();ui.resultScores.replaceChildren();
  for(let i=0;i<2;i++){const row=document.createElement('div');row.className='result-row';const concept=i===0?'先存、再花':'分散風險';const grade=misses[i]===0?'一次答對':'持續練習';row.innerHTML='<span></span><strong>'+score[i]+' 分</strong>';row.querySelector('span').textContent=(i===0?'月光市集':'星光樹屋')+' · '+concept+'（'+grade+'）';ui.resultScores.append(row);}
  const total=document.createElement('div');total.className='result-row';total.innerHTML='<span>兩關總得分</span><strong>'+(score[0]+score[1])+' / 240 分</strong>';ui.resultScores.append(total);
  ui.progress.textContent='你會先分配收入、分清必需與想要，也知道分散投資能降低單一標的的影響。';ui.result.showModal();playTone(988,.3);
}
function restart(){level=1;playerX=78;jumpY=0;jumpVelocity=0;score=[0,0];misses=[0,0];keyFound=false;enemyAlive=true;finished=false;running=true;setProgress();ui.result.close();}

// ---- Pixel-art forest painting ------------------------------------------------
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function poly(points,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fill();}
function sparkle(x,y,r,color,time){const twinkle=.65+.35*Math.sin(time*3+x);ctx.globalAlpha=twinkle;rect(x-r,y-1,r*2+1,2,color);rect(x-1,y-r,2,r*2+1,color);rect(x-1,y-1,2,2,'#fff8c5');ctx.globalAlpha=1;}
function leafCluster(x,y,s,colors){rect(x,y,s*2,s,colors[0]);rect(x+s,y-s,s*2,s,colors[1]);rect(x+s*2,y,s,s,colors[0]);rect(x+s,y+s,s*2,s,colors[2]);rect(x+s,y,s,s,colors[1]);}
function drawBackground(camera,time){
  const c=colors[level-1];
  rect(0,0,W,H,c.deep);
  // Jewel-toned cave atmosphere in chunky light bands.
  for(let y=0;y<105;y+=9){const shade=['#123f43','#16494a','#19534c','#205a4d'][Math.floor(y/9)%4];rect(0,y,W,9,shade);}
  // Sun shafts and curtains of water.
  poly([[18,0],[41,0],[100,112],[72,112]],'#286d60');poly([[46,0],[57,0],[111,105],[97,105]],'#4a9a79');
  poly([[188,0],[204,0],[174,108],[159,108]],'#2b7164');poly([[279,0],[294,0],[258,104],[245,104]],'#367e6d');
  for(let x=85;x<320;x+=118){rect(x,35,12,62,'#217779');rect(x+3,42,5,63,'#48d4cb');rect(x-3,99,18,3,'#71f1d9');}
  // Crystal alcoves on a distant ledge.
  rect(0,107,W,9,'#26705f');rect(0,111,W,3,'#58a86b');
  for(let x=18;x<350;x+=61){
    const xx=x-(camera*.22%61);poly([[xx,108],[xx+7,94],[xx+13,108]],'#438c7c');poly([[xx+14,108],[xx+24,88],[xx+32,108]],c.gem);rect(xx+22,92,3,13,'#9cecff');
    rect(xx+35,102,4,4,'#ffd486');rect(xx+42,99,3,3,'#ffb4c9');
  }
  // Hanging vines and flowers at the top of the cavern.
  for(let i=0;i<9;i++){
    const x=((i*47-camera*.34)%390+390)%390-24;rect(x,0,2,9+(i%3)*5,'#307854');
    rect(x-4,8+(i%3)*5,2,3,'#53a663');rect(x+2,5+(i%3)*4,2,3,'#76c877');
    if(i%2===0){rect(x-3,9+(i%3)*5,3,3,'#f28eae');rect(x+2,9+(i%3)*5,3,3,'#ffd082');rect(x,7+(i%3)*5,3,3,'#ffe8a1');}
  }
  // Cave roots and shadowy fern silhouettes.
  poly([[0,0],[32,0],[38,18],[30,30],[42,44],[26,60],[37,76],[20,94],[0,100]],'#0d373c');
  poly([[320,0],[290,0],[284,19],[295,31],[280,48],[297,65],[282,82],[301,101],[320,102]],'#0d373c');
  for(let i=0;i<6;i++){
    const x=((i*73-camera*.4)%390+390)%390-30;
    rect(x,84,3,27,'#174d43');leafCluster(x-13,92,4,['#1b6049','#24704e','#318b55']);
  }
  // Floating dust motes.
  for(let i=0;i<20;i++){const x=(i*79+Math.sin(time*1.1+i)*8-camera*.15+5000)%W;const y=18+(i*31%91)+Math.sin(time*1.4+i)*2;sparkle(x,y,i%5===0?2:1,i%3===0?'#d2fff2':'#8dfbe6',time+i);}
}
function drawCrystal(x,y,size,color){
  poly([[x,y],[x+size*.35,y-size],[x+size*.72,y-size*.65],[x+size,y],[x+size*.72,y+size*.55],[x+size*.28,y+size*.45]],color);
  poly([[x+size*.35,y],[x+size*.35,y-size],[x+size*.72,y-size*.65],[x+size*.62,y]],'#b8ffff');
  rect(x+size*.32,y+size*.5,2,size*.38,'#79cfe2');
}
function drawStall(x){
  rect(x-13,116,26,4,'#744c3c');rect(x-11,120,3,21,'#77523c');rect(x+8,120,3,21,'#77523c');
  poly([[x-17,117],[x-12,105],[x+13,105],[x+18,117]],'#ec8090');
  rect(x-11,108,22,5,'#ffd181');rect(x-7,106,5,9,'#c75762');
  rect(x-10,113,5,3,'#8ade81');rect(x-2,112,5,4,'#ffd96f');rect(x+6,113,4,3,'#ed9fc8');
}
function drawTreehouse(x,time){
  rect(x-7,70,14,76,'#604a41');rect(x-3,79,5,66,'#99704e');rect(x-22,90,44,4,'#7e674c');
  rect(x-16,68,32,22,'#8d6964');poly([[x-20,69],[x,54],[x+20,69]],'#70b985');rect(x-4,73,8,10,'#d7f0a0');
  rect(x-28,103,56,4,'#b8a467');rect(x-29,101,3,5,'#ffe283');rect(x+26,101,3,5,'#ffe283');
  for(let i=0;i<5;i++)sparkle(x-25+i*12,58+(i%2)*7,1,'#c7ffff',time+i);
}
function drawShrine(x,time){
  rect(x-17,129,34,9,'#557c61');rect(x-14,126,28,3,'#a4ce7c');rect(x-10,121,20,5,'#8cbf70');
  rect(x-2,111,4,11,'#f6d884');rect(x-5,112,10,3,'#70eac3');rect(x-3,108,6,4,'#d8fff0');
  sparkle(x,107,4,'#e4ffff',time);
  if(keyFound){rect(x-2,102,4,2,'#fff0a1');rect(x-5,103,2,2,'#fff0a1');}
}
function drawGround(camera,time){
  const c=colors[level-1];rect(0,143,W,37,c.ground);
  rect(0,142,W,4,c.grass);rect(0,140,W,2,c.grassLight);
  // Repeating moss blocks and rocky underside.
  for(let x=-((camera|0)%16);x<W;x+=16){
    rect(x,150,8,7,'#39734d');rect(x+8,150,8,7,'#315d4c');rect(x+2,157,7,6,'#284c49');rect(x+10,160,6,7,'#203e43');
    rect(x+1,148,2,2,'#9acb68');rect(x+11,146,2,3,'#b3d66b');
    if(((x+camera)|0)%4===0){rect(x+4,138,2,6,'#79bb55');rect(x+6,137,2,3,'#b8dd70');}
  }
  // Grass tufts, flowers and tiny glowing plants.
  for(let i=0;i<38;i++){
    const x=(i*43-camera%43+430)%W,y=137+(i%3);
    rect(x,y-5,2,7,'#73b64f');rect(x+2,y-7,2,5,'#a2d561');rect(x+4,y-4,2,6,'#488d4c');
    if(i%5===0){rect(x+2,y-10,3,3,i%2?'#ff9fc0':'#ffda84');rect(x+3,y-12,2,2,'#fff0b6');}
  }
  // Foreground crystal clusters.
  for(let i=0;i<4;i++){const x=(i*113+25-camera*.85%113+565)%350-15;drawCrystal(x,141,10+i%3*3,i%2?'#7de8e1':'#85c9f1');}
  // Ivy curls along the stone edge.
  for(let x=14-(camera*.7%48);x<W;x+=48){rect(x,153,2,9,'#5da765');rect(x+2,158,7,2,'#6ec66b');rect(x+8,154,2,4,'#f1d078');}
}
function drawMoth(x,y,time){
  const flap=Math.sin(time*12)>0?0:2;
  // Airy blue-green woodland sprite, made of chunky pixels.
  rect(x-8,y-5,6,4,'#a6fff0');rect(x-7,y-7-flap,4,3,'#63d7cb');
  rect(x+2,y-5,6,4,'#a6fff0');rect(x+3,y-7-flap,4,3,'#63d7cb');
  rect(x-3,y-5,7,9,'#3e7e87');rect(x-2,y-4,5,6,'#8be6c8');
  rect(x-2,y-2,2,2,'#23485b');rect(x+2,y-2,2,2,'#23485b');rect(x-1,y+2,4,2,'#f3c28c');
  rect(x-5,y-9,2,4,'#f4d48a');rect(x+4,y-9,2,4,'#f4d48a');
}
function drawFairy(x,y,time){
  const flap=Math.sin(time*15)>0?0:3;
  rect(x-9,y-8,5,7,'#d3fff7');rect(x-8,y-10-flap,4,4,'#8be9d8');
  rect(x+4,y-8,5,7,'#d3fff7');rect(x+4,y-10-flap,4,4,'#8be9d8');
  rect(x-4,y-5,8,8,'#f398b0');rect(x-3,y-4,6,5,'#ffcfb1');
  rect(x-3,y-2,2,2,'#43875d');rect(x+1,y-2,2,2,'#43875d');
  rect(x-2,y+3,4,4,'#3b9565');rect(x-1,y+6,2,4,'#2a654f');
  rect(x-6,y-6,3,2,'#fff3af');rect(x+4,y-6,3,2,'#fff3af');
}
function drawCritter(x,y,time){
  // A friendly acorn-capped forest helper, echoing the storybook reference.
  rect(x-8,y-5,16,11,'#81563d');rect(x-6,y-3,12,8,'#e6c78b');
  rect(x-9,y-9,18,5,'#ad733d');rect(x-6,y-13,12,5,'#d3a94e');rect(x-3,y-15,6,3,'#edcf77');
  rect(x-4,y-2,3,3,'#252c37');rect(x+2,y-2,3,3,'#252c37');rect(x-2,y+3,4,2,'#98664d');
  rect(x-5,y+6,3,3,'#9d6c50');rect(x+3,y+6,3,3,'#9d6c50');
  rect(x-10,y-1,3,4,'#b78759');rect(x+7,y-1,3,4,'#b78759');
}
function drawGate(x){
  rect(x-12,112,4,32,'#66855e');rect(x+8,112,4,32,'#66855e');rect(x-15,110,30,4,'#c7a86a');
  for(let i=0;i<4;i++){rect(x-7+i*5,116,2,24,'#a8d49a');}
  rect(x-1,104,3,3,'#fff2a8');rect(x-5,107,3,3,'#f4d37d');rect(x+3,107,3,3,'#f4d37d');
}
function drawScene(time){
  const camera=Math.max(0,Math.min(WORLD-W,playerX-130));
  drawBackground(camera,time);
  // A far-side moon pool, oversized leaves and glowing cave crystals.
  for(let i=0;i<5;i++){const x=((i*237-camera*.48)%1100+1100)%1100;drawCrystal(x,119,16+(i%3)*5,i%2?'#61d9e0':'#78aef0');}
  if(level===1){
    drawStall(190-camera);drawStall(760-camera);
    drawShrine(600-camera,time);drawGate(925-camera);
  }else{
    drawTreehouse(500-camera,time);drawShrine(600-camera,time);drawGate(925-camera);
  }
  // Flowers and ferns tucked beside the walking path.
  for(let i=0;i<16;i++){
    const wx=60+i*61, sx=wx-camera;
    if(sx>-12&&sx<W+12){const green=['#438955','#5daa60','#78b85f'][i%3];leafCluster(sx-5,132,3,[green,'#8bc96d','#326c49']);}
  }
  // Hovering woodland friends and light particles.
  drawFairy(235-camera,77+Math.sin(time*1.8)*3,time);
  drawFairy(850-camera,65+Math.sin(time*2.1+1)*4,time);
  drawCritter(460-camera,126+Math.sin(time*2)*1,time);
  if(enemyAlive)drawMoth(300-camera,115+Math.sin(time*3)*3,time);
  for(let i=0;i<8;i++){const x=(i*57+time*7-camera*.2+900)%W; sparkle(x,65+(i*31)%65,1,'#e3fff5',time+i);}
  drawGround(camera,time);
  const px=playerX-camera;
  const frame=held.left||held.right||jumpY>0?Math.floor(time*8)%2:0;
  ctx.drawImage(heroSheet,frame*32,0,32,40,Math.round(px-16),Math.round(FLOOR-jumpY-40),32,40);
  if(attackCooldown>0){
    ctx.globalAlpha=Math.min(1,attackCooldown*2.8);
    ctx.strokeStyle='#c5fff2';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px+12,FLOOR-jumpY-20,18+(0.42-attackCooldown)*16,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
  }
  // Small floating key glitter appears after a correct answer.
  if(keyFound){const kx=(level===1?600:600)-camera; sparkle(kx,FLOOR-47+Math.sin(time*3)*3,4,'#ffe99b',time);rect(kx+5,FLOOR-52,3,10,'#f4d179');rect(kx+8,FLOOR-45,4,2,'#f4d179');}
}

function frame(now){
  const time=now/1000, dt=Math.min(.04,(now-(frame.last||now))/1000);frame.last=now;
  if(running&&!finished&&!ui.quiz.open){
    const dir=Number(held.right)-Number(held.left);playerX=Math.max(24,Math.min(WORLD-50,playerX+dir*94*dt));
    if(jumpY>0||jumpVelocity>0){jumpVelocity-=540*dt;jumpY=Math.max(0,jumpY+jumpVelocity*dt);if(jumpY===0)jumpVelocity=0;}
    attackCooldown=Math.max(0,attackCooldown-dt);
    const nearMoth=enemyAlive&&Math.abs(playerX-300)<36,nearShrine=!keyFound&&Math.abs(playerX-600)<35,nearGate=keyFound&&level===1&&playerX>855;
    if(nearMoth)ui.objective.textContent='按 F 揮出星光，替自己開路；按 E 靠近石碑答題';
    else if(nearShrine)ui.objective.textContent='按 E 回答理財問題，答對就能拿到星鑰匙';
    else if(nearGate)ui.objective.textContent='按 E 穿過拱門，前往第二關';
    else ui.objective.textContent=keyFound?'帶著星鑰匙走到林間拱門':(level===1?'探索森林，找到預算知識石碑':'找到星光石碑，回答風險小問題');
  }
  ctx.clearRect(0,0,W,H);drawScene(time);
  if(now-lastToast>2200)ui.toast.classList.remove('show');
  requestAnimationFrame(frame);
}

function beginGame(){
  if(running||finished)return;
  running=true;ui.start.classList.add('hidden');toast('沿著森林小徑前進，靠近石碑按 E');playTone(560,.12);
}
const startButton=document.querySelector('#start-button');
startButton.addEventListener('click',beginGame);
startButton.addEventListener('pointerup',e=>{if(e.pointerType==='touch')beginGame();});
ui.start.addEventListener('click',e=>{if(e.target===ui.start)beginGame();});
document.querySelector('#replay-button').addEventListener('click',restart);
document.querySelector('#sound-toggle').addEventListener('click',e=>{audioOn=!audioOn;e.currentTarget.classList.toggle('active',audioOn);e.currentTarget.setAttribute('aria-label',audioOn?'音效開啟':'音效關閉');if(audioOn)playTone();});
window.addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','ArrowUp',' '].includes(e.key))e.preventDefault();
  if(e.repeat)return;
  if(!running&&!finished&&!ui.start.classList.contains('hidden')&&[' ','Enter','ArrowUp'].includes(e.key)){beginGame();return;}
  if(['a','A','ArrowLeft'].includes(e.key))held.left=true;
  if(['d','D','ArrowRight'].includes(e.key))held.right=true;
  if([' ','w','W','ArrowUp'].includes(e.key)&&running&&jumpY===0)jumpVelocity=245;
  if(['e','E','Enter'].includes(e.key))interact();
  if(['f','F'].includes(e.key))attack();
});
window.addEventListener('keyup',e=>{if(['a','A','ArrowLeft'].includes(e.key))held.left=false;if(['d','D','ArrowRight'].includes(e.key))held.right=false;});
window.addEventListener('blur',()=>{held.left=false;held.right=false;});
document.querySelectorAll('[data-hold]').forEach(b=>{
  const d=b.dataset.hold;b.addEventListener('pointerdown',e=>{e.preventDefault();held[d]=true;b.setPointerCapture(e.pointerId);});
  for(const t of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(t,()=>held[d]=false);
});
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',e=>{
  e.preventDefault();if(b.dataset.action==='jump'&&running&&jumpY===0)jumpVelocity=245;
  if(b.dataset.action==='interact')interact();if(b.dataset.action==='wave')attack();
}));
setProgress();ui.loading.textContent='像素森林已點亮';setTimeout(()=>ui.loading.hidden=true,1400);requestAnimationFrame(frame);

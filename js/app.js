if(typeof ReflexCore==="undefined"){document.body.innerHTML="<p style=\"padding:24px;font-family:sans-serif\">ReflexX could not load js/core.js. Upload the js folder next to index.html.</p>";throw new Error("ReflexCore missing")}
const {mean,stdDev,level,percentile,scoreRun,isAnticipation}=ReflexCore;
const $=id=>document.getElementById(id);
const arena=$('arena'),signal=$('signal'),title=$('title'),subtitle=$('subtitle'),start=$('start');
const COLORS={pink:'#e83e9f',violet:'#635bff',orange:'#f28b32',green:'#19a875'},NAMES=Object.keys(COLORS);
const store={
  get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
};
let mode='classic',state='idle',timer=null,targetTimer=null,startedAt=0,rounds=[],challengeRound=0,streak=0,runFalse=0,targetColor='pink',audioCtx=null;
let hapticOn=store.get('reflexxHaptic','on')!=='off';
let soundOn=store.get('reflexxSound','on')!=='off';

const cap=s=>s[0].toUpperCase()+s.slice(1);
const runs=()=>store.get('reflexxRuns',[]).map(r=>({...r,mode:String(r.mode).toLowerCase(),score:Number(r.score)})).filter(r=>r.score>0);
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1800)}
function beep(f=700,d=.07){if(!soundOn)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=f;g.gain.value=.035;o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+d)}catch(e){}}
function buzz(p){if(!hapticOn)return;try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}}

function stats(){
  const mb=runs().filter(r=>r.mode===mode).map(r=>r.score).concat(rounds);
  const b=mb.length?Math.min(...mb):null,a=rounds.length?Math.round(mean(rounds)):null;
  $('best').textContent=b?b+' ms':'—';$('avg').textContent=a?a+' ms':'—';
  $('last').textContent=rounds.length?rounds[rounds.length-1]+' ms':'—';
  $('round').textContent=mode==='challenge'?Math.min(rounds.length,5)+'/5':(rounds.length?1:0)+'/1';
  $('level').textContent=level(rounds.length?rounds[rounds.length-1]:b);$('streak').textContent=streak;
}
function insights(){
  const h=runs(),f=store.get('reflexxFalse',0);
  $('iRuns').textContent=h.length;$('iFalse').textContent=f;
  if(!h.length){$('iAvg').textContent=$('iSd').textContent='—';$('rank').textContent='Complete a run to see how you compare.';$('spark').innerHTML='';return}
  const s=h.map(r=>r.score),m=mean(s),sd=stdDev(s);
  $('iAvg').textContent=Math.round(m)+' ms';$('iSd').textContent=s.length>1?'±'+Math.round(sd)+' ms':'—';
  const p=percentile(h[0].score);
  $('rank').textContent='Latest '+h[0].score+' ms — faster than roughly '+Math.max(1,Math.min(99,p))+'% of people (rough estimate; real results vary with device and screen).';
  const pts=s.slice(0,20).reverse(),lo=Math.min(...pts),hi=Math.max(...pts),r=hi-lo||1;
  $('spark').innerHTML='<polyline fill="none" stroke="var(--accent2)" stroke-width="2" vector-effect="non-scaling-stroke" points="'+pts.map((v,i)=>(pts.length>1?i*200/(pts.length-1):100)+','+(54-(v-lo)/r*48)).join(' ')+'"/>';
}
const MODE_LABELS={classic:'Classic',random:'Random',precision:'Precision',challenge:'Challenge',color:'Color Rush',reverse:'Reverse'};
function renderPbs(){const h=runs();$('pbs').innerHTML=Object.keys(MODE_LABELS).map(m=>{const v=h.filter(r=>r.mode===m).map(r=>r.score);return `<div class="record"><span>${MODE_LABELS[m]}</span><b>${v.length?Math.min(...v)+' ms · '+level(Math.min(...v)):'—'}</b></div>`}).join('')}
function renderHistory(){renderToday();renderPbs();
  const h=runs();
  $('history').innerHTML=h.length?h.slice(0,7).map((x,i)=>`<div class="record"><span>${i+1}. ${cap(x.mode)}${x.date?' · '+x.date:''}</span><b>${x.score} ms</b></div>`).join(''):'<div class="empty">No runs yet. Set your first record.</div>';
  insights();
}
function setStartBtn(txt){start.style.display='inline-block';start.textContent=txt}
function reset(t='Ready?',p='Press start to begin.'){
  clearTimeout(timer);clearTimeout(targetTimer);state='idle';arena.className='arena ready';
  signal.textContent='⚡';signal.style.background='';signal.style.color='';
  title.textContent=t;subtitle.textContent=p;setStartBtn('START TEST');stats();
}
function setMode(m){
  mode=m;document.querySelectorAll('.mode').forEach(b=>{b.classList.toggle('active',b.dataset.mode===m);b.setAttribute('aria-pressed',b.dataset.mode===m)});
  rounds=[];challengeRound=0;streak=0;runFalse=0;
  reset('Ready?',{color:'Target color: prepare to match it.',reverse:'Green is a decoy. Tap only when red appears.',challenge:'Five rounds. Your average decides the result.',precision:'Every false start adds 50 ms to your score.'}[m]||'Press start, then react when the signal appears.');
}
function begin(){
  if(['waiting','decoy','go'].includes(state))return;
  if(mode==='challenge'&&challengeRound>=5){challengeRound=0;rounds=[]}
  if(mode!=='challenge'&&state==='result')rounds=[];
  state='waiting';arena.className='arena wait';signal.textContent='…';signal.style.background='';signal.style.color='';
  title.textContent='Get ready';start.style.display='none';
  targetColor=NAMES[Math.floor(Math.random()*4)];
  subtitle.textContent=mode==='reverse'?'Green is a decoy — wait for red.':mode==='color'?'Target: '+targetColor.toUpperCase():'Don’t tap yet.';
  const min=mode==='random'?900:1000,max=mode==='random'?3300:3200;
  timer=setTimeout(()=>{
    if(mode==='reverse'){
      state='decoy';arena.className='arena go';signal.textContent='●';title.textContent='WAIT';subtitle.textContent='Green is a decoy — do not tap.';beep(620);
      targetTimer=setTimeout(()=>{state='go';startedAt=performance.now();arena.className='arena false';title.textContent='TAP RED';subtitle.textContent='Now!';beep(420,.11)},350+Math.random()*350);
    }else if(mode==='color'){
      state='decoy';const decoy=NAMES.filter(c=>c!==targetColor)[Math.floor(Math.random()*3)];
      arena.className='arena go';signal.textContent='●';signal.style.background=COLORS[decoy];signal.style.color='#fff';title.textContent='WAIT';subtitle.textContent='Target: '+targetColor.toUpperCase();beep(600);
      targetTimer=setTimeout(()=>{state='go';startedAt=performance.now();signal.style.background=COLORS[targetColor];title.textContent='TAP '+targetColor.toUpperCase();subtitle.textContent='Now!';beep(980,.11)},300+Math.random()*400);
    }else{
      state='go';startedAt=performance.now();arena.className='arena go';signal.textContent='⚡';title.textContent='TAP NOW';subtitle.textContent='Go!';beep(980,.11);
    }
  },Math.random()*(max-min)+min);
}
function falseStart(msg){
  clearTimeout(timer);clearTimeout(targetTimer);const wasDecoy=state==='decoy';
  state='false';streak=0;runFalse++;store.set('reflexxFalse',store.get('reflexxFalse',0)+1);insights();
  beep(180,.14);buzz(120);arena.className='arena false';signal.textContent='×';signal.style.background='';signal.style.color='';
  title.textContent=msg||(wasDecoy?'Decoy!':'Too early!');
  subtitle.textContent=mode==='precision'?'+50 ms penalty added to this run.':wasDecoy?'That was a decoy — wait for the target.':'Wait for the target signal.';
  setStartBtn('TRY AGAIN');stats();
}
function react(){
  if(state==='waiting'||state==='decoy'){falseStart();return}
  if(state!=='go')return;
  const ms=Math.max(1,Math.round(performance.now()-startedAt));
  if(isAnticipation(ms)){falseStart('Anticipated!');subtitle.textContent='Under 100 ms is faster than humanly possible — wait for the signal.';return}
  beep(ms<250?1150:720,.06);buzz(15);rounds.push(ms);streak++;
  title.textContent=ms+' ms';subtitle.textContent=ms<220?'Lightning fast.':ms<280?'Great reaction.':'Good run — chase the next record.';
  arena.className='arena ready';signal.style.background='';signal.style.color='';signal.textContent=ms<250?'✓':'•';state='result';
  if(mode==='challenge'){challengeRound++;if(challengeRound<5)setStartBtn('NEXT ROUND');else{saveRun();setStartBtn('NEW CHALLENGE')}}
  else{saveRun();setStartBtn('TRY AGAIN')}
  stats();
}
function saveRun(){
  if(!rounds.length)return;
  const score=scoreRun(rounds,mode,runFalse);
  const h=runs(),prev=h.filter(r=>r.mode===mode).map(r=>r.score),record=!prev.length||score<Math.min(...prev);
  h.unshift({score,mode,date:new Date().toLocaleDateString(),rounds:rounds.slice(),falseStarts:runFalse});
  store.set('reflexxRuns',h.slice(0,100));runFalse=0;renderHistory();checkAch(score);addXp(score);
  if(record){title.textContent='NEW BEST · '+cap(mode);subtitle.textContent=score+' ms'+(mode==='challenge'?' average':'')+' • '+level(score)+' level';beep(1320,.18);buzz([30,40,30])}
}
start.addEventListener('click',()=>{start.blur();if(mode==='challenge'&&challengeRound>=5){rounds=[];challengeRound=0}begin()});
arena.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;react()});
document.querySelectorAll('.mode').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$('clear').addEventListener('click',()=>{if(confirm('Clear all saved runs and stats?')){localStorage.removeItem('reflexxRuns');localStorage.removeItem('reflexxFalse');localStorage.removeItem('reflexxAch');localStorage.removeItem('reflexxXp');renderXp();renderAch();renderHistory();stats()}});
$('export').addEventListener('click',()=>{
  const h=runs();if(!h.length)return toast('Nothing to export yet');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(h,null,2)],{type:'application/json'}));
  a.download='reflexx-runs.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
});
$('share').addEventListener('click',async()=>{
  const h=runs();if(!h.length)return toast('Complete a run first');
  const best=Math.min(...h.map(r=>r.score)),text=`⚡ ReflexX — my best reaction time is ${best} ms (${level(best)} level). Can you beat it?`;
  try{if(navigator.share){await navigator.share({text});return}await navigator.clipboard.writeText(text);toast('Result copied')}catch(e){toast('Sharing unavailable')}
});
function applySound(){$('sound').textContent=soundOn?'🔊 Sound: On':'🔇 Sound: Off'}
$('sound').addEventListener('click',()=>{soundOn=!soundOn;store.set('reflexxSound',soundOn?'on':'off');applySound()});
function applyTheme(t){document.documentElement.dataset.theme=t;$('theme').textContent='🌙 Theme: '+(t==='dark'?'Dark':'Light');document.querySelector('meta[name=theme-color]').content=t==='dark'?'#0e1320':'#eef2f7'}
$('theme').addEventListener('click',()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';store.set('reflexxTheme',t);applyTheme(t)});
window.addEventListener('blur',()=>{if(['waiting','decoy','go'].includes(state))reset('Paused','The test paused because the page lost focus.')});
document.addEventListener('keydown',e=>{
  if(e.code!=='Space'||e.repeat||e.target.tagName==='INPUT'||!$('v-play').classList.contains('active'))return;e.preventDefault();
  if(state==='idle'||state==='result'||state==='false')begin();else react();
});
const ACH=[
  {id:'first',i:'🎯',n:'First Run',t:c=>c.runs.length>=1},
  {id:'s300',i:'🥉',n:'Under 300',t:c=>c.score<300},
  {id:'s250',i:'🥈',n:'Under 250',t:c=>c.score<250},
  {id:'s200',i:'🥇',n:'Under 200',t:c=>c.score<200},
  {id:'s180',i:'👑',n:'S Rank',t:c=>c.score<180},
  {id:'streak',i:'🔥',n:'5 Streak',t:()=>streak>=5},
  {id:'chal',i:'🏁',n:'Challenger',t:c=>c.mode==='challenge'},
  {id:'all',i:'🧭',n:'All Modes',t:c=>new Set(c.runs.map(r=>r.mode)).size>=6},
  {id:'pro',i:'💪',n:'25 Runs',t:c=>c.runs.length>=25}
];
function renderAch(){
  const got=store.get('reflexxAch',[]);
  $('ach').innerHTML=ACH.map(a=>`<div class="badge-a${got.includes(a.id)?' on':''}"><i>${a.i}</i>${a.n}</div>`).join('');
  $('achCount').textContent='· '+got.length+'/'+ACH.length;
}
function checkAch(score){
  const got=store.get('reflexxAch',[]),ctx={score,mode,runs:runs()},fresh=ACH.filter(a=>!got.includes(a.id)&&a.t(ctx));
  if(fresh.length){store.set('reflexxAch',got.concat(fresh.map(a=>a.id)));toast('🏆 Unlocked: '+fresh.map(a=>a.n).join(', '))}
  renderAch();
}
function showTab(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='v-'+id));
  document.querySelectorAll('.tabbtn').forEach(b=>{const on=b.dataset.tab===id;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
  if(id!=='play'&&['waiting','decoy','go'].includes(state))reset();window.scrollTo(0,0);buzz(8)}
document.querySelectorAll('.tabbtn').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
function addXp(score){const g=20+Math.max(0,Math.round((300-score)/5)),before=lvl(store.get('reflexxXp',0));store.set('reflexxXp',store.get('reflexxXp',0)+g);renderXp();
  if(lvl(store.get('reflexxXp',0))>before)setTimeout(()=>toast('⬆ Level up! You are now Lv '+lvl(store.get('reflexxXp',0))),1900)}
const lvl=x=>Math.floor(Math.sqrt(x/60))+1;
function renderXp(){const x=store.get('reflexxXp',0),L=lvl(x),lo=60*(L-1)**2,hi=60*L*L;$('lv').textContent='Lv '+L;$('xpfill').style.width=Math.round((x-lo)/(hi-lo)*100)+'%'}
function renderToday(){const n=runs().filter(r=>r.date===new Date().toLocaleDateString()).length;$('todayTxt').textContent=Math.min(n,5)+'/5'+(n>=5?' ✓':'');$('todayFill').style.width=Math.min(n,5)*20+'%'}
$('pname').addEventListener('input',e=>{store.set('reflexxName',e.target.value.trim());$('greet').textContent=e.target.value.trim()?'Hey, '+e.target.value.trim():'Reaction Lab'});
$('haptic').addEventListener('click',()=>{hapticOn=!hapticOn;store.set('reflexxHaptic',hapticOn?'on':'off');applyHaptic();buzz(20)});
function applyHaptic(){$('haptic').textContent=hapticOn?'📳 Haptics: On':'📴 Haptics: Off'}
let deferred=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('install').style.display='inline-block'});
$('install').addEventListener('click',async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;$('install').style.display='none'});
window.addEventListener('appinstalled',()=>toast('ReflexX installed'));
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
applyTheme(store.get('reflexxTheme',matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
applySound();applyHaptic();renderHistory();renderAch();renderXp();stats();{const n=store.get('reflexxName','');$('pname').value=n;if(n)$('greet').textContent='Hey, '+n}

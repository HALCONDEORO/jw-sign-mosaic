const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(__dirname+'/../index.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const grab=(re)=>script.match(re)[0];
const ctx=vm.createContext({URLSearchParams,Number,Math,String,Array});
vm.runInContext([
  grab(/function syncTarget\([\s\S]*?\n}/),
  grab(/function positionFor\([\s\S]*?\n}/),
  grab(/function skipTarget\([\s\S]*?\n}/),
  grab(/function clampVolume\([^\n]*\n/),
  grab(/function validLanguageCode\([\s\S]*?\n}/),
  grab(/function buildShareHash\([\s\S]*?\n}/),
  grab(/function parseShareHash\([\s\S]*?\n}/),
].join('\n'),ctx);
const COLLS=['StudioMonthlyPrograms','VODStudio','VODMusicVideos'];

// --- synchronized start ---
test('syncTarget: furthest timestamp, inside the shortest video',()=>{
  assert.equal(ctx.syncTarget([0,0,0],[100,100,100]),0);
  assert.equal(ctx.syncTarget([5,12,7],[100,100,100]),12);
  assert.equal(ctx.syncTarget([50,60],[100,55]),54);
  assert.equal(ctx.syncTarget([NaN],[100]),0);
  assert.equal(ctx.syncTarget([],[]),0);
});

// --- volume ---
test('clampVolume bounds and defaults',()=>{
  assert.equal(ctx.clampVolume(0.4),0.4);assert.equal(ctx.clampVolume(7),1);assert.equal(ctx.clampVolume(-1),0);
  assert.equal(ctx.clampVolume('abc'),1);assert.equal(ctx.clampVolume(undefined),1);
});
test('one volume slider, one audible tile, native controls respected (static)',()=>{
  assert.ok(html.includes('id="vol"'));
  const m=grab(/function muteOthers\(except\) \{[\s\S]*?\n}/);
  assert.match(m,/x\.video\.muted = !on/);assert.match(m,/x\.video\.volume = masterVol/);
  const n=grab(/function onNativeVolume\(entry\) \{[\s\S]*?\n}/);
  assert.match(n,/setMasterVolume\(v\.volume\)/,'native volume drives the single slider');
  assert.match(script,/muteOthers\(audible === entry \? null : entry\)/,'speaker toggles');
  assert.match(script,/addEventListener\('volumechange'/);
});

// --- share link ---
test('share hash round trip',()=>{
  const h=ctx.buildShareHash(['LSE','ASL'],'VODStudio','pub-jwb-142_LSE_1_VIDEO');
  assert.equal(h,'l=LSE,ASL&c=VODStudio&p=pub-jwb-142_LSE_1_VIDEO');
  const r=ctx.parseShareHash('#'+h,COLLS);
  assert.deepEqual(JSON.parse(JSON.stringify(r)),{langs:[{code:'LSE',coll:'VODStudio',prog:'pub-jwb-142_LSE_1_VIDEO'},{code:'ASL',coll:'VODStudio',prog:'pub-jwb-142_LSE_1_VIDEO'}]});
});
test('share hash validates everything and ignores junk',()=>{
  const P=(h)=>JSON.parse(JSON.stringify(ctx.parseShareHash(h,COLLS)));
  assert.equal(P(''),null);assert.equal(P('#x=1'),null);assert.equal(P('#l=../x,<script>,lower'),null);
  assert.deepEqual(P('#l=LSE,LSE,ASL'),{langs:[{code:'LSE'},{code:'ASL'}]},'deduplicated');
  assert.deepEqual(P('#l=LSE&c=Evil&p=a b'),{langs:[{code:'LSE'}]},'unknown collection and bad publication dropped');
  assert.deepEqual(P('#l=LSE&c=VODStudio&p=%3Cb%3E'),{langs:[{code:'LSE',coll:'VODStudio'}]});
  const many=Array.from({length:500},(_,i)=>'S'+i).join(',');assert.equal(P('#l='+many).langs.length,300);
});
test('share link is consumed once on load and wired to a button',()=>{
  assert.ok(html.includes('id="shareBtn"'));
  assert.match(script,/const state = shared \|\| loadState\(\)/);
  assert.match(script,/history\.replaceState\(null, '', location\.pathname \+ location\.search\)/);
});

// --- jump to the same position ---
test('positionFor keeps the same relative position inside each video',()=>{
  assert.equal(ctx.positionFor(0.5,101),50);assert.equal(ctx.positionFor(1,101),100);assert.equal(ctx.positionFor(-3,101),0);
  assert.equal(ctx.positionFor(0.5,NaN),null);assert.equal(ctx.positionFor(0.5,0),null);
});
test('skipTarget moves all tiles to one timestamp, bounded',()=>{
  assert.equal(ctx.skipTarget([10,12],[100,100],10),22);
  assert.equal(ctx.skipTarget([10,12],[100,100],-30),0);
  assert.equal(ctx.skipTarget([95],[100,98],10),97);
});

// --- retry failed ---

// --- i18n for the new UI ---
const dictKeys=(lang)=>{const m=script.match(new RegExp('  '+lang+': \\{([\\s\\S]*?)\\n  \\}'));return [...m[1].matchAll(/(?:^|,)\s*(\w+):\s/gm)].map(x=>x[1]).sort();};
test('new keys exist in both languages',()=>{
  for(const k of ['syncing','syncSkipped','volLbl','shareBtn','shareCopied','sharePrompt','jumpLbl','back10','fwd10','posLbl','retryFailed']){
    assert.ok(dictKeys('es').includes(k)&&dictKeys('en').includes(k),k);}
  assert.deepEqual(dictKeys('es'),dictKeys('en'));
});
test('JS parses',()=>new vm.Script(script));

// ================= behavioural tests (fake videos, real functions from index.html) =================
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
class FV extends EventTarget{
  constructor(o={}){super();this._t=0;this.seekMode='ok';Object.assign(this,{src:'u',error:null,readyState:4,duration:100,paused:true,muted:true,volume:1,played:0},o);}
  get currentTime(){return this._t}
  set currentTime(x){
    if(this.seekMode==='never')return;
    setTimeout(()=>{this._t=this.seekMode==='wrong'?x+5:x;this.dispatchEvent(new Event('seeked'))},2);
  }
  pause(){this.paused=true} play(){this.paused=false;this.played++;return Promise.resolve()}
  ready(){this.readyState=4;this.dispatchEvent(new Event('loadeddata'))}
}
const mkEntry=(video)=>({video,tile:{classList:{contains:()=>false}},audioBtn:{textContent:''}});
function syncWorld(videos){
  const notice={textContent:''};
  const c=vm.createContext({setTimeout,clearTimeout,Promise,Math,Number,Array,Map,Object,
    document:{getElementById:()=>notice},t:(k)=>k==='syncSkipped'?(n=>'skipped '+n):k,tiles:new Map()});
  vm.runInContext([
    grab(/function activeVideos\([^\n]*/),
    grab(/function syncTarget\([\s\S]*?\n}/),
    grab(/function waitReady\([\s\S]*?\n}/),
    grab(/function seekTo\([\s\S]*?\n}/),
    grab(/function flashNotice\([\s\S]*?\n}/),
    grab(/const SYNC_TIMEOUTS[^\n]*/),
    grab(/let syncGen = 0[^\n]*/),
    grab(/function cancelSync\([^\n]*/),
    grab(/function snapshotOf\([^\n]*/),
    grab(/function stillValid\(s\) \{[\s\S]*?\n}/),
    grab(/function entryOf\([^\n]*/),
    grab(/function markSkipped\([^\n]*/),
    grab(/async function startTogether\(\) \{[\s\S]*?\n}/),
    grab(/function autoResume\(\) \{[\s\S]*?\n}/),
    'SYNC_TIMEOUTS.ready=80;SYNC_TIMEOUTS.seek=80;SYNC_TIMEOUTS.settle=80;',
  ].join('\n'),c);
  videos.forEach((v,i)=>c.tiles.set('L'+i,mkEntry(v)));
  return {c,notice,run:(code)=>vm.runInContext(code,c)};
}
test('sync success: every ready tile seeks to the common time and plays',async()=>{
  const vs=[new FV({_t:5}),new FV({_t:12}),new FV({_t:7})];
  const w=syncWorld(vs);await w.run('startTogether()');
  assert.deepEqual(vs.map(v=>v.currentTime),[12,12,12]);assert.deepEqual(vs.map(v=>v.played),[1,1,1]);assert.equal(w.notice.textContent,'');
});
test('Pause all during the wait cancels: nothing seeks or plays afterwards',async()=>{
  const slow=new FV({readyState:0});const ok=new FV();
  const w=syncWorld([slow,ok]);const p=w.run('startTogether()');
  await sleep(10);w.run('cancelSync()');slow.ready();await p;await sleep(20);
  assert.equal(slow.played+ok.played,0);assert.equal(slow.currentTime,0);assert.equal(w.run('syncing'),false);
});
test('a newer sync supersedes the older one; only the newest plays',async()=>{
  const slow=new FV({readyState:0});const w=syncWorld([slow]);
  const p1=w.run('startTogether()');await sleep(10);const p2=w.run('startTogether()');slow.ready();await Promise.all([p1,p2]);await sleep(20);
  assert.equal(slow.played,1);
});
test('removing a tile during the wait: its video is not touched, the rest play',async()=>{
  const gone=new FV({readyState:0});const keep=new FV();
  const w=syncWorld([gone,keep]);const p=w.run('startTogether()');
  await sleep(10);w.c.tiles.delete('L0');gone.ready();await p;
  assert.equal(gone.played,0);assert.equal(gone.currentTime,0);assert.equal(keep.played,1);
});
test('changing a tile source during the wait excludes it',async()=>{
  const sw=new FV({readyState:0});const keep=new FV();
  const w=syncWorld([sw,keep]);const p=w.run('startTogether()');
  await sleep(10);sw.src='other';sw.ready();await p;
  assert.equal(sw.played,0);assert.equal(keep.played,1);assert.match(w.notice.textContent,/skipped 1/);
});
test('a tile marked with an error during the wait is skipped',async()=>{
  const bad=new FV({readyState:0});const keep=new FV();
  const w=syncWorld([bad,keep]);const p=w.run('startTogether()');
  await sleep(10);bad.error={code:4};bad.ready();await p;assert.equal(bad.played,0);assert.equal(keep.played,1);
});
test('not ready within the limit: skipped and reported, others still start',async()=>{
  const never=new FV({readyState:0});const keep=new FV();
  const w=syncWorld([never,keep]);await w.run('startTogether()');
  assert.equal(never.played,0);assert.equal(keep.played,1);assert.match(w.notice.textContent,/skipped 1/);
});
test('seek that never confirms (timeout) is not a sync: skipped, not played',async()=>{
  const stuck=new FV({seekMode:'never',_t:3});const keep=new FV({_t:9});
  const w=syncWorld([stuck,keep]);await w.run('startTogether()');
  assert.equal(stuck.played,0);assert.equal(keep.played,1);assert.match(w.notice.textContent,/skipped 1/);
});
test('seek confirmed but readback is wrong: skipped, not played',async()=>{
  const off=new FV({seekMode:'wrong'});const keep=new FV({_t:4});
  const w=syncWorld([off,keep]);await w.run('startTogether()');
  assert.equal(off.played,0);assert.equal(keep.played,1);assert.match(w.notice.textContent,/skipped 1/);
});
test('readiness lost after the seek: skipped, not played',async()=>{
  const v=new FV({_t:3});const keep=new FV({_t:9});
  const w=syncWorld([v,keep]);
  v.addEventListener('seeked',()=>{v.readyState=1});
  await w.run('startTogether()');assert.equal(v.played,0);assert.equal(keep.played,1);
});
test('auto-resume: restarts browser-paused tiles but never undoes Pause all or a sync in progress',async()=>{
  const v=new FV();const w=syncWorld([v]);
  w.run('autoResume()');assert.equal(v.played,0,'a tile that never started is not started by the safety net');
  w.c.tiles.get('L0').shouldPlay=true;w.run('autoResume()');assert.equal(v.played,1,'resumes a tile the browser paused after it was playing');
  v.pause();w.run('userPaused=true;autoResume()');assert.equal(v.played,1,'Pause all is respected');
  w.run('userPaused=false;syncing=true;autoResume()');assert.equal(v.played,1,'no interference with a sync');
  assert.match(script,/getElementById\('pauseAll'\)\.addEventListener\('click', \(\) => \{ cancelSync\(\); userPaused = true;/);
  assert.match(script,/getElementById\('playAll'\)\.addEventListener\('click', startTogether\)/);
  assert.match(grab(/async function startTogether\(\) \{[\s\S]*?\n}/),/userPaused = false/);
});
test('remove all cancels a pending sync',()=>{assert.match(script.match(/function removeAllTiles\(\) \{[\s\S]*?\n}\n/)[0],/cancelSync\(\)/);assert.match(script.match(/getElementById\('rmAll'\)\.addEventListener\('click'[\s\S]*?\n\}\);/)[0],/removeAllTiles\(\)/)});

// --- native volume with real volumechange events ---
function volWorld(){
  const slider={value:1};
  const c=vm.createContext({Math,Number,String,document:{getElementById:()=>slider},localStorage:{getItem:()=>null,setItem(){}},tiles:new Map()});
  vm.runInContext(['const VOL_KEY = \'k\';',grab(/function clampVolume\([^\n]*\n/),'let masterVol = 0.3; let audible = null;',
    grab(/function muteOthers\(except\) \{[\s\S]*?\n}/),grab(/function writeStored\([\s\S]*?\n}/),grab(/function setMasterVolume\(v\) \{[\s\S]*?\n}/),grab(/function onNativeVolume\(entry\) \{[\s\S]*?\n}/)].join('\n'),c);
  return {c,run:code=>vm.runInContext(code,c),slider};
}
test('new tile arriving unmuted at volume .8 with master .3 keeps .8 and silences the others',()=>{
  const w=volWorld();
  const a=new FV({muted:true,volume:0.3}),b=new FV({muted:true,volume:0.3}),n=new FV({muted:false,volume:0.8});
  const ents=[a,b,n].map(v=>Object.assign(mkEntry(v),{}));ents.forEach((e,i)=>w.c.tiles.set('L'+i,e));
  const entry=ents[2];
  entry.video.addEventListener('volumechange',()=>w.c.onNativeVolume(entry)); // the real wiring in addTile
  entry.video.dispatchEvent(new Event('volumechange'));
  assert.equal(n.volume,0.8,'native volume not overwritten');assert.equal(w.run('masterVol'),0.8);assert.equal(w.slider.value,0.8);
  assert.equal(a.muted,true);assert.equal(b.muted,true);assert.equal(n.muted,false);assert.equal(a.volume,0.8);
});
test('native mute of the audible tile silences all; native volume change moves the slider',()=>{
  const w=volWorld();const a=new FV({muted:false,volume:0.3}),b=new FV({muted:true});
  const ents=[a,b].map(mkEntry);ents.forEach((e,i)=>w.c.tiles.set('L'+i,e));w.run('audible=tiles.get("L0")');
  a.volume=0.6;w.c.onNativeVolume(ents[0]);assert.equal(w.run('masterVol'),0.6);assert.equal(b.volume,0.6);
  a.muted=true;w.c.onNativeVolume(ents[0]);assert.equal(w.run('audible'),null);
});

// --- listing errors: partial results are kept, flagged and retried; empty is not a failure ---
function listWorld(handler){
  const c=vm.createContext({API:'A',fetchJSON:async(u)=>handler(u),Array,Promise});
  vm.runInContext(grab(/async function fetchCollection\([\s\S]*?\n}\n/),c);return c;
}
const vid=(k)=>({type:'video',naturalKey:k,title:k,languageAgnosticNaturalKey:k});
test('fetchCollection: top-level failure is failed, genuinely empty is not',async()=>{
  let r=await listWorld(()=>{throw new Error('HTTP 500')}).fetchCollection('LSE','X');assert.equal(r.failed,true);assert.equal(r.length,0);
  r=await listWorld(()=>({category:{}})).fetchCollection('LSE','X');assert.ok(!r.failed&&!r.partial);assert.equal(r.length,0);
});
test('fetchCollection: a failing subcategory keeps the rest and is flagged partial (not failed, not silent)',async()=>{
  const c=listWorld((u)=>{
    if(u.includes('/SubBad'))throw new Error('HTTP 503');
    if(u.includes('/SubOk'))return {category:{media:[vid('b')]}};
    return {category:{media:[vid('a')],subcategories:[{key:'SubOk',name:'ok'},{key:'SubBad',name:'bad'}]}};
  });
  const r=await c.fetchCollection('LSE','X');
  assert.deepEqual(Array.from(r,x=>x.naturalKey),['a','b']);assert.equal(r.partial,true);assert.ok(!r.failed);
});
test('partial tiles count as failed, are retried list-only, and a failed refresh keeps the old list',()=>{
  assert.match(grab(/function isFailed\(x\)[^\n]*/),/x\.partial \|\| statusFailed\(x\)/);
  const r=grab(/async function retryEntry\(x\) \{[\s\S]*?\n}/);
  assert.match(r,/if \(x\.partial && \(!failedVideo || x\.video\.src\)\) await fillPrograms\(x, x\.prog, false, false, true\)/);
  assert.ok(r.indexOf('fillPrograms(x, x.prog, false, false, true)')<r.indexOf('x.video.load()'));
  const f=grab(/async function fillPrograms\([\s\S]*?\n}\n/);
  assert.match(f,/if \(items\.failed && listOnly\) return;/);
  assert.ok(f.indexOf('fetchCollection')<f.indexOf("sel.innerHTML = ''"),'list is fetched before the old one is cleared');
  assert.match(f,/if \(listOnly\) \{ sel\.selectedIndex/,'list-only refresh never reloads the video');
  assert.match(f,/if \(items\.failed\) \{ setStatus\(entry, 'loadErr'/);
});
test('new keys incl. partialTip exist in both languages',()=>{for(const k of ['partialTip'])assert.ok(dictKeys('es').includes(k)&&dictKeys('en').includes(k),k)});
test('workflow checkout does not persist credentials',()=>{
  const w=fs.readFileSync(__dirname+'/../.github/workflows/test.yml','utf8');
  assert.match(w,/actions\/checkout@[0-9a-f]{40}\n\s+with:\n\s+persist-credentials: false/);
});

// ================= round 3: skipped tiles stay paused; strict publication + partial list =================
test('sync failure then auto-resume: skipped tiles stay paused, others untouched',async()=>{
  const stuck=new FV({seekMode:'never',_t:3});const keep=new FV({_t:9});
  const w=syncWorld([stuck,keep]);await w.run('startTogether()');
  assert.equal(w.run('syncing'),false);
  keep.pause();w.run('autoResume()');
  assert.equal(stuck.played,0,'skipped tile is not resumed out of sync');assert.equal(keep.played,2,'a normal tile still is');
});
test('rejected play() counts as a failed sync and keeps the tile paused',async()=>{
  const bad=new FV();bad.play=()=>Promise.reject(new Error('NotAllowed'));const keep=new FV();
  const w=syncWorld([bad,keep]);await w.run('startTogether()');
  assert.match(w.notice.textContent,/skipped 1/);bad.play=function(){this.paused=false;this.played++;return Promise.resolve()};
  w.run('autoResume()');assert.equal(bad.played,0);
});
test('a new Sync re-evaluates skipped tiles; a new source clears the skip',async()=>{
  const v=new FV({seekMode:'never',_t:3});const keep=new FV({_t:9});
  const w=syncWorld([v,keep]);await w.run('startTogether()');assert.equal(v.played,0);
  v.seekMode='ok';await w.run('startTogether()');assert.equal(v.played,1);assert.equal(v.currentTime,9);
  const u=new FV({seekMode:'never',_t:1});const k2=new FV({_t:6});const w2=syncWorld([u,k2]);await w2.run('startTogether()');
  w2.c.tiles.get('L0').shouldPlay=true;u.src='new';w2.run('autoResume()');assert.equal(u.played,1,'intent kept, different source clears the skip mark');
});
test('sync that skips every tile marks them all',async()=>{
  const a=new FV({readyState:0}),b=new FV({readyState:0});const w=syncWorld([a,b]);await w.run('startTogether()');
  w.run('autoResume()');assert.equal(a.played+b.played,0);
});
test('Retry clears the skip mark',()=>assert.match(grab(/async function retryEntry\(x\) \{[\s\S]*?\n}/),/x\.syncSkipSrc = ''/));

// --- integration: shared link -> subcategory holding the publication fails -> Retry succeeds -> same publication ---
function tileWorld(handler){
  const el=()=>({children:[],style:{},dataset:{},selectedIndex:0,textContent:'',title:'',value:'',
    classList:{_s:new Set(),add(x){this._s.add(x)},remove(x){this._s.delete(x)},contains(x){return this._s.has(x)},toggle(x,f){f?this._s.add(x):this._s.delete(x)}},
    appendChild(c){this.children.push(c)},set innerHTML(v){this.children=[]},get innerHTML(){return ''}});
  const retryBtn=el();
  const c=vm.createContext({clearTimeout,setTimeout,Array,Promise,Map,Math,String,Number,Object,API:'A',LANG:'en',tiles:new Map(),fetchJSON:async u=>handler(u),
    document:{createElement:()=>el(),getElementById:()=>retryBtn},
    t:(k)=>k==='retryFailed'?(n=>'retry '+n):k,saveState(){},refreshGlobalPicker(){},sortTiles(){}});
  vm.runInContext([grab(/function normKey\([^\n]*/),grab(/const UI_SOURCES[^\n]*/),'const titleCache = new Map();',grab(/function titleKey\([^\n]*/),grab(/function uiTitles\([\s\S]*?\n}\n/),grab(/function localTitle\([^\n]*/),grab(/function localGroup\([^\n]*/),grab(/function pickFile\([\s\S]*?\n}/),grab(/async function fetchCollection\([\s\S]*?\n}\n/),
    grab(/function setStatus\([\s\S]*?\n}/),grab(/function statusFailed\([^\n]*/),grab(/function isFailed\([^\n]*/),grab(/function updateRetryUI\([\s\S]*?\n}/),
    grab(/function markUnavailable\([\s\S]*?\n}/),grab(/function holdIndeterminate\([\s\S]*?\n}/),grab(/function cancelRetry\([^\n]*\n/),grab(/async function loadTileProgram\([\s\S]*?\n}/),
    grab(/async function fillPrograms\([\s\S]*?\n}\n/),grab(/async function retryEntry\([\s\S]*?\n}/)].join('\n'),c);
  const video=new FV({src:''});video.removeAttribute=function(){this.src=''};video.load=function(){};
  const entry={code:'LSE',coll:'VODStudio',prog:'pub-x_LSE_1_VIDEO',video,tile:el(),sel:el(),status:el(),items:[],note:{textContent:''},armWatchdog(){},resetRetry(){}};
  c.tiles.set('LSE',entry);
  return {c,entry,video};
}
const media=(k)=>({type:'video',naturalKey:k,languageAgnosticNaturalKey:k.replace('_LSE','') ,title:k,files:[{mimetype:'video/mp4',progressiveDownloadURL:'https://cdn/'+k+'_r240P.mp4'}]});
test('shared publication in a failed subcategory: held as incomplete, Retry resolves to the SAME publication',async()=>{
  let subOk=false;
  const w=tileWorld((u)=>{
    if(u.includes('/SubPub')){ if(!subOk)throw new Error('HTTP 503'); return {category:{media:[media('pub-x_LSE_1_VIDEO')]}}; }
    return {category:{media:[media('other_LSE_1_VIDEO')],subcategories:[{key:'SubPub',name:'g'}]}};
  });
  const e=w.entry;
  await w.c.fillPrograms(e,'pub-x_LSE_1_VIDEO',true);
  assert.equal(e.statusKey,'listIncomplete');assert.equal(e.status.classList.contains('err'),true,'visible error, retriable');
  assert.equal(e.prog,'pub-x_LSE_1_VIDEO','requested publication kept, not cleared');assert.equal(e.partial,true);assert.notEqual(e.statusKey,'noEquiv');
  assert.equal(w.c.isFailed(e),true);
  subOk=true;await w.c.retryEntry(e);
  assert.equal(e.partial,false);assert.equal(e.prog,'pub-x_LSE_1_VIDEO');assert.equal(e.video.src,'https://cdn/pub-x_LSE_1_VIDEO_r240P.mp4');
  assert.equal(e.tile.classList.contains('novideo'),false,'novideo cleared');assert.equal(w.c.isFailed(e),false);
});
test('complete list without the publication is a definitive "not available"',async()=>{
  const w=tileWorld(()=>({category:{media:[media('other_LSE_1_VIDEO')]}}));
  await w.c.fillPrograms(w.entry,'pub-x_LSE_1_VIDEO',true);
  assert.equal(w.entry.statusKey,'noEquiv');assert.equal(w.entry.prog,'');
});
test('still-incomplete after Retry stays indeterminate and retriable',async()=>{
  const w=tileWorld((u)=>{if(u.includes('/SubPub'))throw new Error('x');return {category:{media:[],subcategories:[{key:'SubPub'}]}}});
  await w.c.fillPrograms(w.entry,'pub-x_LSE_1_VIDEO',true);await w.c.retryEntry(w.entry);
  assert.equal(w.entry.statusKey,'listIncomplete');assert.equal(w.entry.prog,'pub-x_LSE_1_VIDEO');assert.equal(w.c.isFailed(w.entry),true);
});
test('global apply and tap-to-retry use the same indeterminate handling; new key in both languages',()=>{
  assert.match(script,/else if \(x\.partial\) holdIndeterminate\(x, nk\)/);
  assert.match(script,/if \(status\.classList\.contains\('err'\)\) retryEntry\(entry\)/);
  assert.ok(dictKeys('es').includes('listIncomplete')&&dictKeys('en').includes('listIncomplete'));
});

// ================= never show another video: black cell + "not available" =================
function worldWithSel(handler,sel){
  const w=tileWorld(handler);
  vm.runInContext('let SEL = '+JSON.stringify(sel||{coll:'',key:''})+';',w.c);
  return w;
}
const songs=(...ks)=>({category:{media:ks.map(media)}});
test('a requested publication missing from a complete list: black cell, no first-video fallback, even when not strict',async()=>{
  for(const strict of [true,false]){
    const w=tileWorld(()=>songs('rise-again_LSE_1_VIDEO','other_LSE_2_VIDEO'));
    await w.c.fillPrograms(w.entry,'pub-x_LSE_1_VIDEO',strict);
    assert.equal(w.video.src,'','nothing loaded');assert.equal(w.entry.tile.classList.contains('novideo'),true);
    assert.equal(w.entry.statusKey,'noEquiv');assert.equal(w.entry.want,'pub-x_LSE_1_VIDEO','request remembered');
  }
});
test('the remembered request is saved, so a reload cannot turn "not available" into the first video',async()=>{
  const saved=[];
  const w=tileWorld(()=>songs('rise-again_LSE_1_VIDEO'));w.c.saveState=()=>saved.push({prog:w.entry.prog,want:w.entry.want});
  await w.c.fillPrograms(w.entry,'pub-x_LSE_1_VIDEO',true);
  assert.deepEqual(saved.at(-1),{prog:'',want:'pub-x_LSE_1_VIDEO'});
  assert.match(grab(/function saveState\([\s\S]*?\n}/),/want: x\.want \|\| ''/);
  // restoring {coll, prog:'', want}: strict on want
  const w2=tileWorld(()=>songs('rise-again_LSE_1_VIDEO'));
  await w2.c.fillPrograms(w2.entry,w2.entry.prog||'pub-x_LSE_1_VIDEO',true);
  assert.equal(w2.video.src,'');
  assert.match(script,/const wantKey = entry\.prog \|\| entry\.want \|\| inheritProg/);
});
test('when it exists in the list the tile loads exactly it and clears the request',async()=>{
  const w=tileWorld(()=>songs('rise-again_LSE_1_VIDEO','pub-x_LSE_1_VIDEO'));w.entry.want='pub-x_LSE_1_VIDEO';
  await w.c.fillPrograms(w.entry,'pub-x_LSE_1_VIDEO',true);
  assert.equal(w.video.src,'https://cdn/pub-x_LSE_1_VIDEO_r240P.mp4');assert.equal(w.entry.want,'');assert.equal(w.entry.tile.classList.contains('novideo'),false);
});
test('Retry of an unavailable tile uses the remembered request',()=>assert.match(grab(/async function retryEntry\([\s\S]*?\n}/),/fillPrograms\(x, x\.prog \|\| x\.want, !!\(x\.prog \|\| x\.want\)\)/));
test('new tiles take the mosaic selection strictly; selection set by tile choice and by Apply to all, persisted',()=>{
  const a=grab(/async function addTile\([\s\S]*?\n}\n/);
  assert.match(a,/if \(SEL\.key\) \{[\s\S]*?inheritProg = SEL\.key;/);
  assert.match(script,/if \(it\) SEL = \{ coll: entry\.coll, key: normKey\(it\) \}/);
  assert.match(script,/if \(nk\) SEL = \{ coll, key: nk \}/);
  assert.match(grab(/function saveState\([\s\S]*?\n}/),/JSON\.stringify\(\{ langs, sel: SEL \}\)/);
});
test('sanitizeSel rejects junk',()=>{
  const c=vm.createContext({});vm.runInContext(grab(/function sanitizeSel\([\s\S]*?\n}/),c);
  assert.deepEqual(JSON.parse(JSON.stringify(c.sanitizeSel({coll:'VODMusicVideos',key:'pub-sjj_1_VIDEO'}))),{coll:'VODMusicVideos',key:'pub-sjj_1_VIDEO'});
  for(const bad of [null,{},{coll:'<x>',key:'a'},{coll:'A',key:'a b'},{coll:1,key:'a'}])assert.deepEqual(JSON.parse(JSON.stringify(c.sanitizeSel(bad))),{coll:'',key:''});
});
test('unavailable cell is black with translated text, no other video',()=>{
  assert.match(html,/\.tile\.novideo \.nomsg \{ display:flex;[^}]*background:#000/);
  assert.match(html,/\.tile\.novideo video \{ display:none; \}/);
  assert.match(script,/nomsg\.textContent = t\('naText'\)/);
  assert.match(script,/x\.nomsg\.textContent = t\('naText'\)/);
  assert.match(script,/naText: 'No disponible en esta lengua'/);
  assert.ok(dictKeys('es').includes('naText')&&dictKeys('en').includes('naText'));
});

test('older saved states are healed: blank-publication tiles in the selected collection become "not available", not first video',()=>{
  const init=script.slice(script.indexOf('(async function init()'));
  assert.match(init,/if \(!SEL\.key\) \{ const ref = restored\.find\(l => l\.prog\)/);
  assert.match(init,/!l\.prog && !l\.want && l\.coll === SEL\.coll\) \? \{ \.\.\.l, want: SEL\.key \}/);
});

// ================= titles follow the interface language =================
function titleWorld(byCode,lang){
  const calls=[];
  const c=vm.createContext({Array,Promise,Map,Math,String,Number,Object,API:'A',LANG:lang,tiles:new Map(),
    fetchJSON:async u=>{const code=u.split('/categories/')[1].split('/')[0];calls.push(code);const h=byCode[code];if(!h)throw new Error('HTTP 404');return h(u);}});
  vm.runInContext([grab(/function normKey\([^\n]*/),grab(/async function fetchCollection\([\s\S]*?\n}\n/),grab(/const UI_SOURCES[^\n]*/),'const titleCache = new Map();',
    grab(/function titleKey\([^\n]*/),grab(/function uiTitles\([\s\S]*?\n}\n/),grab(/function localTitle\([^\n]*/),grab(/function localGroup\([^\n]*/)].join('\n'),c);
  return {c,calls};
}
const own=(agn,title,group='')=>({naturalKey:agn.replace('_','_LSE_'),agnostic:agn,title,group});
const mk=(agn,title)=>({type:'video',naturalKey:agn.replace('_','_X_'),languageAgnosticNaturalKey:agn,title});
const listing=(group,...ms)=>()=>({category:{media:[],subcategories:[{key:'g',name:group,media:ms}]}});
test('English UI: Spanish sign-language titles are shown in English, groups too; Spanish UI keeps Spanish',async()=>{
  const lse=own('pub-osg_1_VIDEO','Vuelvan a vivir');
  const w=titleWorld({E:listing('Original Songs',mk('pub-osg_1_VIDEO','Rise Again')),ASL:listing('x'),S:listing('Canciones originales',mk('pub-osg_1_VIDEO','Vuelvan a vivir')),LSE:listing('x')},'en');
  const tm=await w.c.uiTitles('VODMusicVideos');
  assert.equal(w.c.localTitle(lse,tm),'Rise Again');assert.equal(w.c.localGroup({...lse,group:'Canciones originales'},tm),'Original Songs');
  const w2=titleWorld({E:listing('Original Songs',mk('pub-osg_1_VIDEO','Rise Again')),S:listing('Canciones originales',mk('pub-osg_1_VIDEO','Vuelvan a vivir')),ASL:listing('x'),LSE:listing('x')},'es');
  assert.equal(w2.c.localTitle(lse,await w2.c.uiTitles('VODMusicVideos')),'Vuelvan a vivir');
  assert.ok(w2.calls.every(c=>['S','LSE'].includes(c)),'Spanish UI never asks the English listing');assert.ok(w.calls.every(c=>['E','ASL'].includes(c)));
});
test('old songbook keys map to the renamed one (sjj -> sjjm), same songs',async()=>{
  const w=titleWorld({E:listing('Meetings',mk('pub-sjjm_1_VIDEO',"1. Jehovah's Attributes")),ASL:listing('x')},'en');
  const tm=await w.c.uiTitles('VODMusicVideos');
  assert.equal(w.c.localTitle(own('pub-sjj_1_VIDEO','1. Las cualidades principales de Jehová'),tm),"1. Jehovah's Attributes");
});
test('items only present in sign languages fall back to an English-locale sign language, then to their own title',async()=>{
  const w=titleWorld({E:listing('x'),ASL:listing('Sing to Jehovah—Meetings',mk('pub-sn_1_VIDEO','001 – Jehovah’s Attributes'))},'en');
  const tm=await w.c.uiTitles('VODMusicVideos');
  assert.equal(w.c.localTitle(own('pub-sn_1_VIDEO','001 – Atributos'),tm),'001 – Jehovah’s Attributes');
  assert.equal(w.c.localTitle(own('pub-zz_9_VIDEO','Título propio'),tm),'Título propio');
  assert.equal(w.c.localTitle(own('pub-zz_9_VIDEO','Título propio'),undefined),'Título propio');
});
test('failed title lookups are not cached and never break the list',async()=>{
  let fail=true;const w=titleWorld({E:()=>{if(fail)throw new Error('x');return listing('g',mk('pub-a_1_VIDEO','A'))()},ASL:()=>{if(fail)throw new Error('x');return {category:{}}}},'en');
  let tm=await w.c.uiTitles('C');assert.equal(tm.size,0);fail=false;tm=await w.c.uiTitles('C');assert.equal(tm.size,1);
});
test('labels use localTitle everywhere: tile lists, global list, and in-place relabel on language switch',()=>{
  assert.match(script,/o\.textContent = localTitle\(it, tm\)/);
  assert.match(script,/og\.label = localGroup\(arr\[0\], tm\)/);
  assert.doesNotMatch(script,/o\.textContent = it\.title/);
  assert.match(grab(/async function refreshGlobalPrograms\([\s\S]*?\n}\n/),/localTitle\(it, tm\)/);
  const sl=grab(/function setLang\([\s\S]*?\n}\n/);assert.match(sl,/for \(const x of tiles\.values\(\)\) relabelTile\(x\)/);
  const r=grab(/async function relabelTile\([\s\S]*?\n}\n/);assert.doesNotMatch(r,/x\.video|\.load\(\)|loadTileProgram|fillPrograms/,'switching language never touches the videos');
  assert.match(script,/if \(lang0 !== LANG\) tm = await uiTitles/);
});

// ================= nothing plays by itself: load paused, then play together =================
test('loading a tile never plays it; the source is set and the video waits paused',async()=>{
  const w=tileWorld(()=>songs('pub-x_LSE_1_VIDEO'));
  await w.c.fillPrograms(w.entry,'pub-x_LSE_1_VIDEO',true);
  assert.equal(w.video.src,'https://cdn/pub-x_LSE_1_VIDEO_r240P.mp4');assert.equal(w.video.played,0);assert.equal(w.video.paused,true);assert.equal(w.entry.shouldPlay,false);
});
test('a new publication on a playing tile loads paused too',async()=>{
  const w=tileWorld(()=>songs('a_LSE_1_VIDEO','b_LSE_2_VIDEO'));w.entry.shouldPlay=true;
  await w.c.fillPrograms(w.entry,'b_LSE_2_VIDEO',true);assert.equal(w.entry.shouldPlay,false);assert.equal(w.video.played,0);
});
test('retry of a failed tile reloads without playing',async()=>{
  const w=tileWorld(()=>songs('pub-x_LSE_1_VIDEO'));await w.c.fillPrograms(w.entry,'pub-x_LSE_1_VIDEO',true);
  w.entry.status.classList.add('err');w.entry.status.style.display='';w.entry.shouldPlay=true;
  await w.c.retryEntry(w.entry);assert.equal(w.video.played,0);assert.equal(w.entry.shouldPlay,false);
});
test('only Play all / Sync start playback; Pause all clears every intent',async()=>{
  const vs=[new FV(),new FV()];const w=syncWorld(vs);
  await sleep(5);assert.deepEqual(vs.map(v=>v.played),[0,0],'nothing plays before Play all');
  await w.run('startTogether()');assert.deepEqual(vs.map(v=>v.played),[1,1]);
  assert.equal([...w.c.tiles.values()].every(x=>x.shouldPlay),true);
  assert.match(script,/for \(const x of tiles\.values\(\)\) \{ x\.shouldPlay = false; x\.video\.pause\(\); \}/);
});
test('static: no autoplay, no play() outside startTogether and the intent-gated safety net',()=>{
  assert.match(script,/video\.autoplay = false/);
  const plays=[...script.matchAll(/\.play\(\)/g)].length;
  assert.equal(plays,3,'startTogether, autoResume, and the verse loop restarting a tile that was already playing');
  assert.match(grab(/function onVerseEnded[\s\S]*?\n}\n/),/!x\.shouldPlay/,'the third play() is only the verse-loop restart, gated on shouldPlay');
  assert.match(grab(/function autoResume\(\) \{[\s\S]*?\n}/),/x\.shouldPlay && x\.video\.src/);
  assert.match(script,/video\.addEventListener\('loadeddata', loaded\)/,'a loaded paused tile does not stay on "Loading…"');
});

test('Remove all: stops a running Add-all loop and a restore, and a late list load never revives a tile',async()=>{
  assert.match(script,/function removeAllTiles\(\) \{\s*mosaicGen\+\+; stopAddingAll = true;/);
  assert.match(script,/if \(stopAddingAll \|\| gen !== mosaicGen\) break;/);
  assert.match(script,/if \(gen0 !== mosaicGen\) break;/);
  assert.match(script,/if \(tiles\.get\(entry\.code\) !== entry\) return;/);
  const mk=()=>({paused:false,pause(){this.paused=true},removeAttribute(){},load(){}});
  const removed=[];
  const c=vm.createContext({tiles:new Map(),clearTimeout,Promise,setTimeout,Array,
    updateRetryUI(){},updateCounter(){},saveState(){},refreshGlobalPicker(){},renderAddList(){},cancelSync(){c.cancelled=true},cancelled:false});
  vm.runInContext('let mosaicGen = 0; let stopAddingAll = false; let audible = {};'+grab(/function cancelRetry\([^\n]*\n/)+grab(/function removeAllTiles\(\) \{[\s\S]*?\n}\n/),c);
  const vids=[mk(),mk(),mk()];
  vids.forEach((v,i)=>c.tiles.set('L'+i,{video:v,tile:{remove(){removed.push(i)}}}));
  vm.runInContext('removeAllTiles()',c);
  assert.equal(c.tiles.size,0);assert.deepEqual(removed,[0,1,2]);assert.ok(vids.every(v=>v.paused));
  assert.equal(vm.runInContext('mosaicGen',c),1);assert.equal(vm.runInContext('stopAddingAll',c),true);
  assert.equal(vm.runInContext('audible',c),null);assert.ok(c.cancelled);
  // the guard in loadTileProgram: a removed entry is ignored
  const c2=vm.createContext({tiles:new Map(),SEL:{},clearTimeout});
  vm.runInContext(grab(/function cancelRetry\([^\n]*\n/)+grab(/async function loadTileProgram\(entry, item\) \{[\s\S]*?\n}\n/),c2);
  const ghost={code:'X',video:mk(),status:{},tile:{classList:{remove(){throw new Error('touched')},add(){}}}};
  await vm.runInContext('loadTileProgram',c2)(ghost,{naturalKey:'k',media:{}}); // not in tiles: returns before touching anything
  assert.equal(ghost.prog,undefined);
});

function retryWorld(){
  const c=vm.createContext({tiles:new Map(),setTimeout,clearTimeout});
  vm.runInContext(grab(/function cancelRetry\([^\n]*\n/)+grab(/function scheduleRetry\([\s\S]*?\n}\n/),c);
  const mkv=(src)=>({src,loads:0,load(){this.loads++}});
  return {c,mkv};
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
test('auto-retry: error then Remove all, the timer never restores the source',async()=>{
  const {c,mkv}=retryWorld();const x={code:'L',video:mkv('A'),armWatchdog(){this.armed=true}};c.tiles.set('L',x);
  c.scheduleRetry(x,20);c.tiles.clear();vm.runInContext('1',c);
  await wait(60);assert.equal(x.video.src,'A');assert.equal(x.video.loads,0);assert.ok(!x.armed);
  // and the explicit cancel clears the timer too
  const y={code:'M',video:mkv('A')};c.tiles.set('M',y);c.scheduleRetry(y,20);c.cancelRetry(y);await wait(60);assert.equal(y.video.loads,0);
});
test('auto-retry: error then another source, the timer never goes back to the old one',async()=>{
  const {c,mkv}=retryWorld();const x={code:'L',video:mkv('songA')};c.tiles.set('L',x);
  c.scheduleRetry(x,20);x.video.src='songB'; // no cancel: the identity guard alone must hold
  await wait(60);assert.equal(x.video.src,'songB');assert.equal(x.video.loads,0);
});
test('auto-retry: a live tile with the same source is reloaded once',async()=>{
  const {c,mkv}=retryWorld();const x={code:'L',video:mkv('songA'),armWatchdog(){this.armed=true}};c.tiles.set('L',x);
  c.scheduleRetry(x,20);await wait(60);assert.equal(x.video.src,'songA');assert.equal(x.video.loads,1);assert.ok(x.armed);
});
test('auto-retry wiring: error handler uses scheduleRetry; source change, tile ✕ and Remove all cancel it',()=>{
  assert.match(script,/setStatus\(entry, 'retrying'\);\s*scheduleRetry\(entry, 3000\);/);
  assert.match(script.match(/async function loadTileProgram[\s\S]*?\n}\n/)[0],/cancelRetry\(entry\)/);
  assert.match(script,/cancelRetry\(entry\); video\.pause\(\)/);
  assert.match(script.match(/function removeAllTiles[\s\S]*?\n}\n/)[0],/cancelRetry\(x\)/);
  assert.match(script.match(/async function retryEntry[\s\S]*?\n}\n/)[0],/removed while queued/);
});

test('Pause all: after it nothing replays by itself, including tiles added later, until Play all',async()=>{
  const a=new FV(),b=new FV();const w=syncWorld([a,b]);
  await w.run('startTogether()');assert.equal(a.played,1);assert.equal(b.played,1);
  // the real Pause all handler
  const h=script.match(/getElementById\('pauseAll'\)\.addEventListener\('click', \(\) => \{([^\n]*)\}\);/)[1];
  w.run('(()=>{'+h+'})()');
  assert.ok(a.paused&&b.paused);assert.ok([...w.c.tiles.values()].every(x=>x.shouldPlay===false));
  const late=new FV();w.c.tiles.set('LATE',(function(v){return {video:v,tile:{classList:{contains:()=>false}},code:'LATE'}})(late));
  for(let i=0;i<4;i++)w.run('autoResume()'); // four 15 s ticks
  assert.equal(a.played,1);assert.equal(b.played,1);assert.equal(late.played,0,'a tile added after Pause all stays paused');
  // even if the pause flag were lost, only tiles that Play all started may be resumed
  w.run('userPaused=false;autoResume()');assert.equal(a.played,1);assert.equal(late.played,0);
  // Play all starts everyone again, together
  await w.run('startTogether()');assert.equal(late.played,1);assert.equal(a.played,2);
});

// ---- Bible passage (book, chapter, verse) ----
function bibleCtx(extra){
  const c=vm.createContext(Object.assign({Map,Number,Math,String,Array,Object,Promise,JSON,encodeURIComponent,setTimeout,clearTimeout,LANG:'es'},extra||{}));
  vm.runInContext([grab(/const PUBMEDIA[^\n]*/),grab(/const BIBLE_NAMES[^\n]*/),grab(/const BIBLE_CHAPTERS[^\n]*/),grab(/let BIBLE_TIMEOUT[^\n]*/),grab(/function bibleKey\([^\n]*/),grab(/function parseBibleKey\([\s\S]*?\n}\n/),grab(/function bibleLabel\([^\n]*/),grab(/function timeToSec\([^\n]*/),'const bibleCache = new Map();',grab(/function fetchBibleChapter\([\s\S]*?\n}\n/)].join('\n'),c);
  return c;
}
test('Bible data: 66 books, 1189 chapters, names in ES and EN, strict keys',()=>{
  const c=bibleCtx();const run=x=>vm.runInContext(x,c);
  assert.equal(run('BIBLE_CHAPTERS.length'),66);assert.equal(run('BIBLE_CHAPTERS.reduce((a,b)=>a+b,0)'),1189);
  assert.equal(run('BIBLE_NAMES.es.length'),66);assert.equal(run('BIBLE_NAMES.en.length'),66);
  assert.equal(run('BIBLE_NAMES.es[42]'),'Juan');assert.equal(run('BIBLE_NAMES.en[42]'),'John');assert.equal(run('BIBLE_NAMES.es[18]'),'Salmos');
  assert.equal(run("bibleKey(43,3,16)"),'bible_43_3_16');assert.equal(run("bibleKey(43,3,0)"),'bible_43_3');
  assert.deepEqual(JSON.parse(run("JSON.stringify(parseBibleKey('bible_43_3_16'))")),{book:43,chapter:3,verse:16});
  assert.deepEqual(JSON.parse(run("JSON.stringify(parseBibleKey('bible_19_150'))")),{book:19,chapter:150,verse:0});
  for(const bad of ['bible_43_22','bible_67_1','bible_0_1','bible_43_0','bible_43_3_x','pub-sjjm_S_1_VIDEO','','bible_43_3_16_1','../x'])assert.equal(run('parseBibleKey('+JSON.stringify(bad)+')'),null,bad);
  assert.equal(run("bibleLabel({book:43,chapter:3,verse:16})"),'Juan 3:16');assert.equal(run("LANG='en';bibleLabel({book:43,chapter:3,verse:0})"),'John 3');
  assert.equal(run("timeToSec('00:03:17.664')"),197.664);assert.ok(Number.isNaN(run("timeToSec('x')")));
});
test('fetchBibleChapter: smallest file, verse markers from the entry that has them, 404 = none, network error = failed and not cached',async()=>{
  const body={files:{ASL:{MP4:[
    {track:3,file:{url:'https://cdn/x_ASL_03_r720P.mp4'},duration:582,markers:{markers:[{verseNumber:1,startTime:'00:00:02.035'},{verseNumber:16,startTime:'00:03:17.664'}]}},
    {track:3,file:{url:'https://cdn/x_ASL_03_r240P.mp4'},duration:582,markers:null},
    {track:3,file:{url:'https://cdn/x_ASL_03_r360P.mp4'},duration:582,markers:null}]}}};
  let mode='ok',calls=[];
  const c=bibleCtx({fetchJSON:async u=>{calls.push(u);if(mode==='ok')return body;if(mode==='404')throw new Error('HTTP 404');throw new Error('network')}});
  const r=await vm.runInContext("fetchBibleChapter('ASL',43,3)",c);
  assert.equal(r.state,'ok');assert.match(r.src,/r240P/);assert.equal(r.verses.get(16),197.664);assert.equal(r.verses.size,2);
  assert.match(calls[0],/langwritten=ASL&booknum=43&track=3/);
  await vm.runInContext("fetchBibleChapter('ASL',43,3)",c);assert.equal(calls.length,1,'cached');
  mode='404';assert.equal((await vm.runInContext("fetchBibleChapter('JSL',43,3)",c)).state,'none');
  mode='net';assert.equal((await vm.runInContext("fetchBibleChapter('ASL',44,3)",c)).state,'failed');
  mode='ok';assert.equal((await vm.runInContext("fetchBibleChapter('ASL',44,3)",c)).state,'ok','a failure is not cached');
  body.files.ASL.MP4=[{track:2,file:{url:'https://cdn/x_ASL_02_r240P.mp4'},duration:1,markers:null}];
  assert.equal((await vm.runInContext("fetchBibleChapter('ASL',43,4)",c)).state,'none','another chapter is never used');
});
function fillWorld(chapter){
  const log=[],side=[];
  const opt=()=>({});
  const sel={innerHTML:'',classList:{remove(){}},options:[],appendChild(o){this.options.push(o)},selectedIndex:-1,title:''};
  const c=bibleCtx({SEL:{coll:'',key:''},tiles:new Map(),saveState(){side.push('save')},cancelRetry(e){side.push('cancelRetry')},sortTiles(){},
    document:{createElement:()=>opt()},
    setStatus:(e,k,a,err)=>{(k==='loading'?side:log).push(k==='loading'?'loading':['status',k,!!err])},
    markUnavailable:(e,k)=>log.push(['unavailable',k]),
    loadTileProgram:async(e,it)=>log.push(['load',it.naturalKey,it.startAt,!!it.verseNote,it.bibleSrc]),
    __ch:chapter});
  vm.runInContext('fetchBibleChapter = async () => __ch;',c);
  vm.runInContext(grab(/function verseEnd\([\s\S]*?\n}\n/),c);
  vm.runInContext(grab(/async function fillBible\([\s\S]*?\n}\n/),c);
  const entry={code:'LSE',coll:'BIBLE',prog:'',want:'',sel,tile:{classList:{add(){},remove(){}}},video:{src:'old.mp4',paused:false,pauses:0,pause(){this.paused=true;this.pauses++},removeAttribute(){this.src=''},load(){}},note:{textContent:'x'},startAt:123,shouldPlay:true,items:[]};
  c.tiles.set('LSE',entry);
  return {c,entry,log,side};
}
test('Bible tile: loads exactly the requested chapter at its verse; no verse = chapter start; missing verse marker = unavailable cell',async()=>{
  const ok={state:'ok',src:'https://cdn/a_r240P.mp4',verses:new Map([[16,197.6]])};
  let w=fillWorld(ok);await vm.runInContext('fillBible',w.c)(w.entry,'bible_43_3_16');
  assert.deepEqual(w.log,[['load','bible_43_3_16',197.6,false,'https://cdn/a_r240P.mp4']]);
  w=fillWorld(ok);await vm.runInContext('fillBible',w.c)(w.entry,'bible_43_3');assert.deepEqual(w.log,[['load','bible_43_3',0,false,'https://cdn/a_r240P.mp4']]);
  w=fillWorld(ok);await vm.runInContext('fillBible',w.c)(w.entry,'bible_43_3_99');assert.deepEqual(w.log,[['unavailable','bible_43_3_99']],'no marker for the verse: black cell, the chapter is not loaded from its start');
  w=fillWorld({state:'ok',src:'https://cdn/a_r240P.mp4',verses:new Map()});await vm.runInContext('fillBible',w.c)(w.entry,'bible_43_3');assert.deepEqual(w.log,[['load','bible_43_3',0,false,'https://cdn/a_r240P.mp4']],'whole chapter is unchanged even without markers');
  w=fillWorld({state:'ok',src:'https://cdn/a_r240P.mp4',verses:new Map([[16,197.6],[17,210]])});await vm.runInContext('fillBible',w.c)(w.entry,'bible_43_3_17');assert.equal(w.log[0][0],'load');
});
test('Bible tile: language without the chapter is a black unavailable cell, never another passage; a failed request is retriable',async()=>{
  let w=fillWorld({state:'none'});await vm.runInContext('fillBible',w.c)(w.entry,'bible_43_3_16');
  assert.deepEqual(w.log,[['unavailable','bible_43_3_16']]);
  w=fillWorld({state:'failed'});await vm.runInContext('fillBible',w.c)(w.entry,'bible_43_3_16');
  assert.deepEqual(w.log,[['status','loadErr',true]]);assert.equal(w.entry.want,'bible_43_3_16');assert.equal(w.entry.prog,'bible_43_3_16');
  w=fillWorld({state:'ok',src:'https://cdn/a.mp4',verses:new Map()});await vm.runInContext('fillBible',w.c)(w.entry,'garbage');
  assert.equal(w.log[0][1],'bible_43_3','an invalid key falls back to the default passage, never to a video of another kind');
});
test('Bible tile: removed tile or replaced request is ignored',async()=>{
  const w=fillWorld({state:'ok',src:'https://cdn/a.mp4',verses:new Map()});
  const p=vm.runInContext('fillBible',w.c)(w.entry,'bible_43_3');w.c.tiles.clear();await p;assert.deepEqual(w.log,[]);
  const w2=fillWorld({state:'ok',src:'https://cdn/a.mp4',verses:new Map()});
  const p2=vm.runInContext('fillBible',w2.c)(w2.entry,'bible_43_3');w2.entry.coll='VODMusicVideos';await p2;assert.deepEqual(w2.log,[],'the tile moved to another section meanwhile');
});
test('Play all on a Bible passage starts each tile at its own verse; other videos keep the common timestamp',async()=>{
  const a=new FV({_t:0}),b=new FV({_t:0}),o=new FV({_t:50});
  const w=syncWorld([a,b,o]);w.c.tiles.get('L0').startAt=179.9;w.c.tiles.get('L1').startAt=197.6;
  await w.run('startTogether()');
  assert.equal(a.played,1);assert.equal(b.played,1);assert.equal(o.played,1);
  assert.ok(Math.abs(a._t-179.9)<0.01);assert.ok(Math.abs(b._t-197.6)<0.01);assert.ok(Math.abs(o._t-50)<0.01);
});
test('Bible wiring: collection, global selects, apply, share link, per-tile seek',()=>{
  assert.match(script,/\['BIBLE', t\('bibleColl'\)\]/);
  assert.match(script,/if \(entry\.coll === 'BIBLE'\) return fillBible\(entry, keepProg, listOnly\)/);
  assert.match(script,/if \(isBible\) \{ x\.coll = coll; x\.prog = ''; x\.want = ''; x\.shouldPlay = false; await fillBible\(x, nk\); return; \}/);
  assert.match(script,/loadedmetadata', \(\) => \{ if \(entry\.startAt > 0/);
  assert.match(script,/const targetOf = s =>/);
  const c=vm.createContext({URLSearchParams,Number,Math,String,Array});
  vm.runInContext([grab(/function validLanguageCode\([\s\S]*?\n}/),grab(/function buildShareHash\([\s\S]*?\n}/),grab(/function parseShareHash\([\s\S]*?\n}/)].join('\n'),c);
  const h=vm.runInContext("buildShareHash(['LSE','ASL'],'BIBLE','bible_43_3_16')",c);
  const r=vm.runInContext("parseShareHash("+JSON.stringify('#'+h)+",['BIBLE','VODBible'])",c);
  assert.deepEqual(JSON.parse(JSON.stringify(r)),{langs:[{code:'LSE',coll:'BIBLE',prog:'bible_43_3_16'},{code:'ASL',coll:'BIBLE',prog:'bible_43_3_16'}]});
});
test('Bible tile: a slow answer for an older passage never overrides the newer request',async()=>{
  const w=fillWorld({state:'none'});
  let rel1;const slow=new Promise(r=>rel1=r);
  vm.runInContext('fetchBibleChapter = async (code, b, ch) => ch === 3 ? __slow : __fast;',w.c);
  w.c.__slow=slow;w.c.__fast={state:'ok',src:'https://cdn/new.mp4',verses:new Map()};
  const first=vm.runInContext('fillBible',w.c)(w.entry,'bible_43_3');
  await vm.runInContext('fillBible',w.c)(w.entry,'bible_43_4');
  rel1({state:'ok',src:'https://cdn/old.mp4',verses:new Map()});await first;
  assert.deepEqual(w.log,[['load','bible_43_4',0,false,'https://cdn/new.mp4']]);
});

test('"For all" follows the restored mosaic selection until the user picks a section by hand',()=>{
  const c=vm.createContext({});vm.runInContext(grab(/function pickGlobalColl\([\s\S]*?\n}\n/),c);
  const keys=['StudioMonthlyPrograms','VODMusicVideos','BIBLE'];const p=(...a)=>vm.runInContext('pickGlobalColl',c)(...a);
  assert.equal(p(keys,{coll:'BIBLE',key:'bible_19_23_4'},'BIBLE','StudioMonthlyPrograms',false),'BIBLE','restored passage: the picker shows the Bible, not the first option');
  assert.equal(p(keys,{coll:'VODMusicVideos',key:'k'},'VODMusicVideos','StudioMonthlyPrograms',false),'VODMusicVideos');
  assert.equal(p(keys,{coll:'BIBLE',key:'bible_19_23_4'},'BIBLE','VODMusicVideos',true),'VODMusicVideos','the user picked a section: it is kept');
  assert.equal(p(keys,{coll:'',key:''},'VODMusicVideos','',false),'VODMusicVideos','no selection: first tile section');
  assert.equal(p(keys,{coll:'GONE',key:'x'},'','',false),'','unknown section is ignored');
  assert.match(script,/addEventListener\('change', \(\) => \{ globTouched = true;/);
  assert.match(script,/pickGlobalColl\(\[\.\.\.gc\.options\]/);
});

test('Bible tile: asking for a new passage stops the old one at once, before the API answers, and keeps the request',async()=>{
  const w=fillWorld({state:'none'});
  let rel;const hang=new Promise(r=>rel=r);w.c.__hang=hang;
  vm.runInContext('fetchBibleChapter = async () => __hang;',w.c);
  const e=w.entry;e.prog='bible_43_1';e.items=[{naturalKey:'bible_43_1'}];
  const pending=vm.runInContext('fillBible',w.c)(e,'bible_43_3_16');
  // the API has not answered yet
  assert.equal(e.video.paused,true);assert.ok(e.video.pauses>=1,'the old video was paused immediately');
  assert.equal(e.video.src,'','the old source was removed');assert.equal(e.startAt,undefined);assert.equal(e.shouldPlay,false);
  assert.equal(e.prog,'','nothing is signed as the old passage');assert.equal(e.want,'bible_43_3_16','the attempt is kept for Retry and saveState');
  assert.equal(e.items.length,0);assert.equal(e.note.textContent,'');
  assert.ok(w.side.includes('cancelRetry')&&w.side.includes('loading')&&w.side.includes('save'),'retry cancelled, loading shown, state saved');
  assert.equal(e.sel.options[0].value,'bible_43_3_16','the selector already shows the requested passage');
  rel({state:'ok',src:'https://cdn/n.mp4',verses:new Map([[16,50]])});await pending;
  assert.deepEqual(w.log,[['load','bible_43_3_16',50,false,'https://cdn/n.mp4']]);
});
test('Bible request that hangs becomes a retriable failure after the timeout',async()=>{
  const c=bibleCtx({fetchJSON:()=>new Promise(()=>{})});vm.runInContext('BIBLE_TIMEOUT = 30;',c);
  assert.equal((await vm.runInContext("fetchBibleChapter('LSE',43,3)",c)).state,'failed');
  vm.runInContext("fetchJSON = async () => ({files:{LSE:{MP4:[{track:3,file:{url:'https://cdn/a_r240P.mp4'},duration:1,markers:null}]}}})",c);
  assert.equal((await vm.runInContext("fetchBibleChapter('LSE',43,3)",c)).state,'ok','the timed-out failure is not cached');
  assert.match(script,/entry\.prog = ''; entry\.want = key;/);
});

// --- a chosen verse repeats instead of running on ---
test('verseEnd: next marker after the verse, none for the last verse',()=>{
  const c=vm.createContext({Infinity});vm.runInContext(grab(/function verseEnd\([\s\S]*?\n}\n/),c);
  const m=new Map([[1,0],[2,10],[3,25.5]]);c.m=m;
  assert.equal(vm.runInContext('verseEnd(m,10)',c),25.5);assert.equal(vm.runInContext('verseEnd(m,0)',c),10);
  assert.equal(vm.runInContext('verseEnd(m,25.5)',c),undefined);
});
function loopCtx(){
  const c=vm.createContext({Number,Promise,syncing:false,userPaused:false,tiles:new Map()});
  vm.runInContext([grab(/function loopVerse\([\s\S]*?\n}\n/),grab(/function onVerseSeek\([^\n]*/),grab(/function onVerseEnded\([\s\S]*?\n}\n/)].join('\n'),c);
  return c;
}
function loopTile(o){
  const v={paused:false,ended:false,seeking:false,currentTime:10,src:'https://cdn/x.mp4',error:null,plays:0,play(){this.plays++;this.paused=false;return Promise.resolve()}};
  const x=Object.assign({code:'ASL',loop:true,startAt:10,endAt:25,shouldPlay:true,loopSrc:'https://cdn/x.mp4',tile:{classList:{contains:()=>false}},video:v},o);
  return x;
}
test('loopVerse wraps on a real crossing of endAt, even after a long throttled gap',()=>{
  const c=loopCtx(),run=x=>{c.x=x;return vm.runInContext('loopVerse(x)',c)};
  const x=loopTile();
  for(const t of [10,15,24.9]){x.video.currentTime=t;assert.equal(run(x),false);}
  x.video.currentTime=25.04;assert.equal(run(x),true);assert.equal(x.video.currentTime,10);
  const y=loopTile();y.video.currentTime=20;run(y);y.video.currentTime=40;assert.equal(run(y),true,'tab throttled for several seconds: crossing still detected');assert.equal(y.video.currentTime,10);
});
test('loopVerse: manual seek to or past the end never rewinds; seeking back inside the verse keeps looping',()=>{
  const c=loopCtx(),run=x=>{c.x=x;return vm.runInContext('loopVerse(x)',c)},seek=x=>{c.x=x;vm.runInContext('onVerseSeek(x)',c)};
  const x=loopTile();x.video.currentTime=15;run(x);
  x.video.currentTime=25.05;seek(x);assert.equal(run(x),false);assert.equal(x.video.currentTime,25.05,'seek to endAt+0.05 while playing');
  x.video.currentTime=60;seek(x);assert.equal(run(x),false);assert.equal(x.video.currentTime,60);
  x.video.currentTime=12;seek(x);run(x);x.video.currentTime=25.2;assert.equal(run(x),true);assert.equal(x.video.currentTime,10);
  const y=loopTile();y.video.currentTime=24;run(y);y.video.currentTime=25.1;y.video.seeking=true;assert.equal(run(y),false,'mid-seek sample ignored');
});
test('loopVerse does nothing when paused, without loop, without an end marker, or with no previous sample',()=>{
  const c=loopCtx(),run=x=>{c.x=x;return vm.runInContext('loopVerse(x)',c)};
  for(const o of [{video:Object.assign(loopTile().video,{paused:true})},{loop:false},{endAt:undefined}]){
    const x=loopTile(o);x.video.currentTime=24;run(x);x.video.currentTime=26;assert.equal(run(x),false);assert.equal(x.video.currentTime,26);
  }
  const z=loopTile();z.video.currentTime=15;run(z);z.video.currentTime=30;c.syncing=true;assert.equal(run(z),false,'no wrap while syncing');c.syncing=false;
  const w=loopTile({loopSrc:'https://cdn/old.mp4'});w.video.currentTime=15;run(w);w.video.currentTime=30;assert.equal(run(w),false,'source changed');
  const x=loopTile();x.video.currentTime=26;assert.equal(run(x),false,'first sample after a (re)load is not a crossing');
});
test('onVerseEnded: the last verse restarts only after natural playback to the chapter end; paused, stopped or non-loop tiles stay put',()=>{
  const c=loopCtx(),end=x=>{c.x=x;c.tiles=new Map([['ASL',x]]);return vm.runInContext('onVerseEnded(x)',c)};
  let x=loopTile({endAt:undefined});x.video.paused=true;x.video.ended=true;x.video.currentTime=99;x.loopPrev=99;
  assert.equal(end(x),true);assert.equal(x.video.plays,1);assert.equal(x.video.currentTime,10);
  x=loopTile({shouldPlay:false,endAt:undefined});x.video.paused=true;x.video.ended=true;x.video.currentTime=99;x.loopPrev=99;
  assert.equal(end(x),false);assert.equal(x.video.plays,0,'paused by the user (shouldPlay false): no play()');assert.equal(x.video.currentTime,99);
  x=loopTile({loop:false,endAt:undefined});x.video.currentTime=99;x.loopPrev=99;assert.equal(end(x),false);assert.equal(x.video.plays,0);
  x=loopTile({endAt:undefined});x.video.src='';x.loopPrev=99;assert.equal(end(x),false);assert.equal(x.video.plays,0);
  const none=(label,f)=>{const t=loopTile({endAt:undefined});t.video.paused=true;t.video.ended=true;t.video.currentTime=99;t.loopPrev=99;c.userPaused=false;c.syncing=false;f(t);assert.equal(end(t),false,label);assert.equal(t.video.plays,0,label);assert.equal(t.video.currentTime,99,label);c.userPaused=false;c.syncing=false;};
  none('Pause all',t=>{c.userPaused=true;});
  none('syncing',t=>{c.syncing=true;});
  none('source changed',t=>{t.video.src='https://cdn/other.mp4';});
  none('load error',t=>{t.video.error={code:2};});
  none('shown as unavailable',t=>{t.tile={classList:{contains:k=>k==='novideo'}};});
  x=loopTile({endAt:undefined});x.video.paused=true;x.video.ended=true;x.loopPrev=99;c.tiles=new Map([['ASL',loopTile()]]);c.x=x;assert.equal(vm.runInContext('onVerseEnded(x)',c),false,'stale entry (tile removed or replaced)');assert.equal(x.video.plays,0);
});
test('onVerseEnded: a seek out of the verse window invalidates the loop; playback inside it still wraps',()=>{
  const c=loopCtx(),run=x=>{c.x=x;return vm.runInContext('loopVerse(x)',c)},seek=x=>{c.x=x;vm.runInContext('onVerseSeek(x)',c)},end=x=>{c.x=x;c.tiles=new Map([['ASL',x]]);return vm.runInContext('onVerseEnded(x)',c)};
  // chosen non-last verse: seek past the verse end, then the chapter ends: no rewind, no play
  let x=loopTile();x.video.currentTime=15;run(x);
  x.video.currentTime=100;seek(x);x.video.paused=true;x.video.ended=true;
  assert.equal(end(x),false);assert.equal(x.video.plays,0,'endAt 25, seek to 100: outside the window');assert.equal(x.video.currentTime,100);
  // seek before the verse start: also outside the window
  x=loopTile({endAt:undefined});x.video.currentTime=5;seek(x);x.video.paused=true;x.video.ended=true;
  assert.equal(end(x),false);assert.equal(x.video.plays,0,'last verse, seek to 5 < startAt 10');assert.equal(x.video.currentTime,5);
  // last verse: natural playback to the chapter end wraps (the interval keeps sampling currentTime)
  x=loopTile({endAt:undefined});x.video.currentTime=40;run(x);x.video.currentTime=99;run(x);x.video.paused=true;x.video.ended=true;
  assert.equal(end(x),true);assert.equal(x.video.plays,1);assert.equal(x.video.currentTime,10);
  // last verse: seek inside the window keeps the loop alive
  x=loopTile({endAt:undefined});x.video.currentTime=50;seek(x);x.video.paused=true;x.video.ended=true;
  assert.equal(end(x),true);assert.equal(x.video.plays,1,'seek to 50 inside [10, end) then ended');assert.equal(x.video.currentTime,10);
  // no sample at all (e.g. source just switched): no wrap
  x=loopTile({endAt:undefined});x.video.paused=true;x.video.ended=true;
  assert.equal(end(x),false);assert.equal(x.video.plays,0,'no previous sample');
  // last verse: a seek to the exact end of the video is not a natural crossing
  x=loopTile({endAt:undefined});x.video.duration=100;x.video.currentTime=100;seek(x);x.video.paused=true;x.video.ended=true;
  assert.equal(end(x),false);assert.equal(x.video.plays,0,'seek to duration exactly');assert.equal(x.video.currentTime,100);
  // last verse: natural playback reaches the end with the last sample before it
  x=loopTile({endAt:undefined});x.video.duration=100;x.video.currentTime=99;run(x);x.video.currentTime=100;x.video.paused=true;x.video.ended=true;
  assert.equal(end(x),true);assert.equal(x.video.plays,1,'last sample before duration');assert.equal(x.video.currentTime,10);
});
test('verse loop wiring: events call the handlers, chosen verse sets loop, a new source resets it, Pause all clears shouldPlay',()=>{
  assert.match(script,/video\.addEventListener\('ended', \(\) => onVerseEnded\(entry\)\)/);
  assert.match(script,/video\.addEventListener\('seeking', \(\) => onVerseSeek\(entry\)\)/);
  assert.match(script,/video\.addEventListener\('seeked', \(\) => onVerseSeek\(entry\)\)/);
  assert.match(script,/loop: !!\(p\.verse && Number\.isFinite\(start\)\)/);
  assert.match(script,/entry\.loop = !!\(item\.bibleSrc && item\.loop\)/);
  assert.match(script,/setInterval\(\(\) => \{ for \(const x of tiles\.values\(\)\) loopVerse\(x\)/);
  assert.equal((script.match(/entry\.loop = false/g)||[]).length,2,'a new source always resets the loop');
  assert.match(script,/pauseAll'\)\.addEventListener\('click', \(\) => \{[^\n]*x\.shouldPlay = false/);
});

// --- Publications (books and brochures) ---
function pubCtx(extra){
  const c=vm.createContext(Object.assign({Map,Number,Math,String,Array,Object,Promise,JSON,encodeURIComponent,setTimeout,clearTimeout,RegExp,LANG:'es'},extra||{}));
  vm.runInContext([grab(/const PUB_MEDIA_URL[^\n]*/),grab(/let BIBLE_TIMEOUT[^\n]*/),grab(/const PUBS = \[[\s\S]*?\n\];/),grab(/const PUB_BY[^\n]*/),grab(/function pubKey\([^\n]*/),grab(/function parsePubKey\([\s\S]*?\n}\n/),grab(/function pubName\([^\n]*/),grab(/function pubLabel\([^\n]*/),'const pubCache = new Map();',grab(/function fetchPubMedia\([\s\S]*?\n}\n/),grab(/async function pubTrackTitles\([\s\S]*?\n}\n/)].join('\n'),c);
  return c;
}
test('Publications: fixed list is well formed and keys are strictly validated',()=>{
  const c=pubCtx(),run=x=>vm.runInContext(x,c);
  assert.ok(run('PUBS.length')>=60);
  assert.equal(run('new Set(PUBS.map(p=>p[0])).size'),run('PUBS.length'),'codes are unique');
  assert.equal(run('PUBS.every(p=>/^[a-z0-9]{2,8}$/.test(p[0])&&Array.isArray(p[1])&&p[1].length>=1&&p[1].every(n=>Number.isInteger(n))&&p[1].every((n,i,a)=>i===0||n>a[i-1])&&p[2].length>2&&p[3].length>2)'),true);
  assert.equal(run("pubKey('lmdv',3)"),'pub_lmdv_3');
  assert.deepEqual(JSON.parse(run("JSON.stringify(parsePubKey('pub_lmdv_3'))")),{code:'lmdv',track:3});
  for(const bad of ['pub_lmdv_0','pub_lmdv_13','pub_nope_1','PUB_lmdv_1','pub_lmdv','bible_43_3','pub_lmdv_1_2','',null,'pub_lmdv_01x'])
    assert.equal(run('parsePubKey('+JSON.stringify(bad)+')'),null,String(bad));
  assert.equal(run("parsePubKey('pub_lmdv_12').track"),12,'last track of a 12-track publication');
  assert.equal(run("PUB_BY.get('ebtv')[1].length"),14);assert.equal(run("PUB_BY.get('ebtv')[1][13]"),103,'track numbers can have gaps: keys hold the position, not the number');
  assert.equal(run("parsePubKey('pub_ebtv_14').track"),14);assert.equal(run("parsePubKey('pub_ebtv_15')"),null);
  assert.equal(run("pubLabel({code:'lmdv',track:2},'T')"),'Hacer discípulos: una obra de amor (videos) - T');
  assert.equal(run("pubLabel({code:'jy',track:1},'ignored')"),run("pubName('jy')"),'single-video publications show only their name');
  c.LANG='en';assert.equal(run("pubName('lmdv')"),'Love People—Make Disciples—Videos');
});
function pubFile(track,res,title){return {track,title:title||('t'+track),file:{url:'https://cdn/x_ASL_'+String(track).padStart(2,'0')+'_r'+res+'P.mp4'}};}
test('fetchPubMedia: exact tracks only, smallest file, 404 = none, wrong track count = none, failure not cached',async()=>{
  let mode='ok',files,calls=[];
  const c=pubCtx({fetchJSON:async u=>{calls.push(u);if(mode==='404')throw new Error('HTTP 404');if(mode==='net')throw new Error('network');const lg=/langwritten=([A-Z]+)/.exec(u)[1];return {files:{[lg]:{MP4:files}}}}});
  const run=x=>vm.runInContext(x,c);
  files=[];for(let i=1;i<=12;i++)files.push(pubFile(i,720),pubFile(i,240));
  let r=await run("fetchPubMedia('ASL','lmdv')");
  assert.equal(r.state,'ok');assert.equal(r.tracks.size,12);assert.match(r.tracks.get(3).src,/_03_r240P/);assert.equal(r.tracks.get(3).title,'t3');
  assert.match(calls[0],/pub=lmdv&langwritten=ASL/);assert.match(calls[0],/fileformat=MP4/);
  await run("fetchPubMedia('ASL','lmdv')");assert.equal(calls.length,1,'cached');
  files=files.filter(f=>f.track!==7);
  assert.equal((await run("fetchPubMedia('ASL','ebtv')")).state,'none','ebtv expects its 14 track numbers, 11 given');
  files=[];for(const n of [1,2,3,4,5,6,7,8,9,10,11,12,13,103])files.push(pubFile(n,720),pubFile(n,240));
  r=await run("fetchPubMedia('LSE','ebtv')");assert.equal(r.state,'ok','gaps in track numbers are fine when they match');assert.ok(r.tracks.has(103));
  files=files.filter(f=>f.track!==13);
  assert.equal((await run("fetchPubMedia('LSF','ebtv')")).state,'none','13 of 14 tracks: pairing not verified, so the language is not used');
  files=[];for(const n of [1,2,3,4,5,6,7,8,9,10,11,12,13,104])files.push(pubFile(n,240));
  assert.equal((await run("fetchPubMedia('KSL','ebtv')")).state,'none','same count but a different track number (104 for 103): not paired');
  files=[];for(let i=1;i<=11;i++)files.push(pubFile(i,240));
  assert.equal((await run("fetchPubMedia('LSF','lmdv')")).state,'none','11 tracks where 12 are expected: never paired by guess');
  files=[];for(let i=1;i<=12;i++)files.push(pubFile(i===5?9:i,240));
  assert.equal((await run("fetchPubMedia('BSL','lmdv')")).state,'none','a missing track number (duplicate 9) is not paired');
  files=[pubFile(0,720,'Only'),pubFile(0,240,'Only')];
  r=await run("fetchPubMedia('DGS','jy')");assert.equal(r.state,'ok','single-video publication ignores the track number');assert.match([...r.tracks.values()][0].src,/r240P/);
  mode='404';assert.equal((await run("fetchPubMedia('JSL','lmdv')")).state,'none');
  mode='net';assert.equal((await run("fetchPubMedia('KSL','lmdv')")).state,'failed');
  mode='ok';files=[];for(let i=1;i<=12;i++)files.push(pubFile(i,240));
  assert.equal((await run("fetchPubMedia('KSL','lmdv')")).state,'ok','a failure is not cached');
  files=[{track:1,title:'x',file:{url:'http://insecure/x_r240P.mp4'}}];
  assert.equal((await run("fetchPubMedia('LSM','jy')")).state,'none','non-https files are ignored');
});
test('fetchPubMedia: a request that hangs becomes a retriable failure',async()=>{
  const c=pubCtx({fetchJSON:()=>new Promise(()=>{})});
  vm.runInContext('BIBLE_TIMEOUT = 30;',c);
  assert.equal((await vm.runInContext("fetchPubMedia('ASL','lmdv')",c)).state,'failed');
  assert.equal(vm.runInContext('pubCache.size',c),0,'not kept');
});
function pubFillWorld(answer){
  const log=[],side=[];
  const sel={innerHTML:'',classList:{remove(){}},options:[],appendChild(o){this.options.push(o)},selectedIndex:-1,title:''};
  const c=pubCtx({SEL:{coll:'',key:''},tiles:new Map(),saveState(){side.push('save')},cancelRetry(){side.push('cancelRetry')},sortTiles(){},
    document:{createElement:()=>({})},
    setStatus:(e,k,a,err)=>{(k==='loading'?side:log).push(k==='loading'?'loading':['status',k,!!err])},
    markUnavailable:(e,k)=>log.push(['unavailable',k]),
    loadTileProgram:async(e,it)=>log.push(['load',it.naturalKey,it.bibleSrc,it.startAt,it.title]),
    __a:answer});
  vm.runInContext('fetchPubMedia = async () => __a; pubTrackTitles = async () => new Map([[3,"Titulo 3"]]);',c);
  vm.runInContext(grab(/async function fillPub\([\s\S]*?\n}\n/),c);
  const entry={code:'LSE',coll:'PUBS',prog:'',want:'',sel,tile:{classList:{add(){},remove(){}}},video:{src:'old.mp4',paused:false,pauses:0,pause(){this.paused=true;this.pauses++},removeAttribute(){this.src=''},load(){}},note:{textContent:'x'},startAt:5,shouldPlay:true,items:[]};
  c.tiles.set('LSE',entry);
  return {c,entry,log,side};
}
test('Publication tile: loads exactly the requested track; missing track or language is the black cell; failure is retriable',async()=>{
  const ok={state:'ok',tracks:new Map([[3,{src:'https://cdn/t3_r240P.mp4',title:'own title'}]])};
  let w=pubFillWorld(ok);await vm.runInContext('fillPub',w.c)(w.entry,'pub_lmdv_3');
  assert.deepEqual(w.log,[['load','pub_lmdv_3','https://cdn/t3_r240P.mp4',0,'Hacer discípulos: una obra de amor (videos) - Titulo 3']],'title in the interface language');
  w=pubFillWorld(ok);await vm.runInContext('fillPub',w.c)(w.entry,'pub_lmdv_4');assert.deepEqual(w.log,[['unavailable','pub_lmdv_4']],'track missing: never another track');
  w=pubFillWorld({state:'none'});await vm.runInContext('fillPub',w.c)(w.entry,'pub_lmdv_3');assert.deepEqual(w.log,[['unavailable','pub_lmdv_3']]);
  w=pubFillWorld({state:'failed'});await vm.runInContext('fillPub',w.c)(w.entry,'pub_lmdv_3');
  assert.deepEqual(w.log,[['status','loadErr',true]]);assert.equal(w.entry.want,'pub_lmdv_3');assert.equal(w.entry.prog,'pub_lmdv_3');assert.equal(w.entry.video.src,'');assert.equal(w.entry.shouldPlay,false);
  w=pubFillWorld(ok);await vm.runInContext('fillPub',w.c)(w.entry,'garbage');assert.match(w.log[0][1],/^pub_[a-z0-9]+_1$/,'an invalid key falls back to a valid publication, never to another kind of video');
});
test('Publication tile: a position past a gap in the track numbers loads that track number',async()=>{
  const ok={state:'ok',tracks:new Map([[103,{src:'https://cdn/t103_r240P.mp4',title:'x'}],[13,{src:'https://cdn/t13_r240P.mp4',title:''}]])};
  let w=pubFillWorld(ok);await vm.runInContext('fillPub',w.c)(w.entry,'pub_ebtv_14');assert.equal(w.log[0][2],'https://cdn/t103_r240P.mp4','position 14 = track 103');
  w=pubFillWorld(ok);await vm.runInContext('fillPub',w.c)(w.entry,'pub_ebtv_13');assert.equal(w.log[0][2],'https://cdn/t13_r240P.mp4');
});
test('Publication tile: asking for a new publication stops the old video at once and a stale answer is ignored',async()=>{
  let release;const slow=new Promise(r=>release=r);
  const w=pubFillWorld(null);
  vm.runInContext('fetchPubMedia = () => __slow;',w.c);w.c.__slow=slow;
  const p=vm.runInContext('fillPub',w.c)(w.entry,'pub_lmdv_3');
  assert.equal(w.entry.video.src,'','old source removed before the API answers');assert.equal(w.entry.video.paused,true);assert.equal(w.entry.shouldPlay,false);assert.equal(w.entry.want,'pub_lmdv_3');assert.ok(w.side.includes('cancelRetry'));
  const p2=vm.runInContext('fillPub',w.c)(w.entry,'pub_lmdv_5'); // newer request replaces it
  release({state:'ok',tracks:new Map([[3,{src:'https://cdn/a.mp4',title:''}],[5,{src:'https://cdn/b.mp4',title:''}]])});
  await Promise.all([p,p2]);
  assert.equal(w.log.filter(l=>l[0]==='load').length,1);assert.equal(w.log.find(l=>l[0]==='load')[1],'pub_lmdv_5');
  const w2=pubFillWorld({state:'ok',tracks:new Map([[3,{src:'https://cdn/a.mp4',title:''}]])});
  const q=vm.runInContext('fillPub',w2.c)(w2.entry,'pub_lmdv_3');w2.c.tiles.delete('LSE');await q;
  assert.deepEqual(w2.log,[],'removed tile: nothing loaded');
});
test('Publications wiring: section, selection, apply, restore and strict statics',()=>{
  assert.match(script,/\['PUBS', t\('pubsColl'\)\]/);
  assert.match(script,/if \(entry\.coll === 'PUBS'\) return fillPub\(entry, keepProg, listOnly\)/);
  assert.match(script,/if \(isPubs\) \{ x\.coll = coll; x\.prog = ''; x\.want = ''; x\.shouldPlay = false; await fillPub\(x, nk\); return; \}/);
  assert.match(script,/if \(gc\.value === 'PUBS'\) \{ await buildGlobalPubs\(\); return; \}/);
  const fp=grab(/async function fillPub\([\s\S]*?\n}\n/);
  assert.doesNotMatch(fp,/\.play\(\)/,'a publication never autoplays');
  assert.match(fp,/markUnavailable\(entry, key\)/);
  const fm=grab(/function fetchPubMedia\([\s\S]*?\n}\n/);
  assert.match(fm,/best\.size !== expected/,'track count must match exactly');
});

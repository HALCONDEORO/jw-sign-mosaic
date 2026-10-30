const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(__dirname+'/../index.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const fn=script.match(/function remainingLanguages\([\s\S]*?\n}/)[0];
const context=vm.createContext({});vm.runInContext(script.match(/function validLanguageCode\([\s\S]*?\n}/)[0]+'\n'+script.match(/function restoredLanguages\([\s\S]*?\n}/)[0]+'\n'+fn,context);
const catalog=Array.from({length:110},(_,i)=>({code:'S'+i,isSignLanguage:true}));
test('JS parses',()=>new vm.Script(script));
test('eight defaults unchanged',()=>assert.match(script,/\['LSE','ASL','BSL','LSB','LSM','LSF','ISL','DGS'\]/));
test('all 110 eligible, not hardcoded playback cap',()=>assert.equal(context.remainingLanguages(catalog,[]).length,110));
test('existing eight leave 102 eligible',()=>assert.equal(context.remainingLanguages(catalog,catalog.slice(0,8).map(x=>x.code)).length,102));
test('duplicates and spoken languages excluded',()=>assert.equal(context.remainingLanguages([...catalog,catalog[0],{code:'EN',isSignLanguage:false},null],[]).length,110));
test('already selected catalogue is empty',()=>assert.equal(context.remainingLanguages(catalog,catalog.map(x=>x.code)).length,0));
test('no forced 16 limit on add or restoration',()=>{assert.doesNotMatch(script,/MAX_TILES|slice\(0,\s*16\)/)});
test('bulk add is explicit and confirmed',()=>{assert.match(script,/confirm\(t\('confirmAll'\)\(pending.length\)\)/);assert.doesNotMatch(script.slice(script.indexOf('(async function init()')),/addCatalogLanguages\(/)});
test('bulk add sequential and stoppable',()=>{assert.match(script,/if \(stopAddingAll\) break/);assert.match(script,/await addTile\(/);assert.match(script,/finally \{/)});
test('strict publication is passed to translations',()=>assert.match(script,/!!inheritProg \|\| !!lang.strictPublication/));
test('restore filters against non-empty catalogue',()=>assert.equal(context.restoredLanguages([{code:'S1'},{code:'S2'},{code:'S1'},{code:'EN'}],catalog).length,2));
test('catalogue failure preserves eight defaults',()=>assert.equal(context.restoredLanguages(['LSE','ASL','BSL','LSB','LSM','LSF','ISL','DGS'].map(code=>({code})),[]).length,8));
test('catalogue failure preserves safe saved codes above16, deduplicated',()=>assert.equal(context.restoredLanguages([...catalog.map(x=>({code:x.code})),{code:'S0'}],[]).length,110));
test('restore rejects malicious or malformed stored codes even if catalogue failed',()=>assert.equal(context.restoredLanguages([{code:'../x'},{code:'<script>'},{code:''},{code:123},{code:'lower'},null,{code:'LSE'}],[]).length,1));
test('invalid saved state is safe',()=>assert.equal(context.restoredLanguages(null,[]).length,0));
test('empty/already-added and stopped summaries are explicit',()=>{for(const x of ['emptyCatalog','allAdded','addedSummary']) assert.match(script,new RegExp("t\\('"+x+"'\\)"))});
test('picker covers every jw.org video-library section incl. ministry tools',()=>{
  const keys=[...script.matchAll(/\['(StudioMonthlyPrograms|VOD[A-Za-z]+)'/g)].map(m=>m[1]);
  const uniq=[...new Set(keys)];
  assert.deepEqual(uniq,['StudioMonthlyPrograms','VODStudio','VODProgramsEvents','VODMusicVideos','VODSeries','VODChildren','VODTeenagers','VODFamily','VODMinistry','VODMinistryTools','VODOurActivities','VODOurOrganization','VODBible','VODMovies','VODIntExp']);
});
test('no picker truncates the 163-song meeting catalog',()=>{
  assert.doesNotMatch(script,/slice\(0,\s*(100|120|200)\)/,'no hard cuts below the full SJJ catalog (163 videos)');
  assert.match(script,/for \(const it of items\)/,'pickers iterate the full collection');
});
test('missing translation is reported, never substituted',()=>{
  assert.match(script,/function markUnavailable\(/);
  assert.match(script,/else markUnavailable\(x\)/,'global apply marks unmatched tiles instead of keeping a different video');
  assert.match(script,/deferLoad/,'fillPrograms can skip the implicit items[0] fallback');
  assert.match(script,/!!lang\.prog\)/,'restoring a saved selection is strict too');
});

// --- i18n: the whole UI must exist in both Spanish and English ---
const dictKeys=(lang)=>{const m=script.match(new RegExp('  '+lang+': \\{([\\s\\S]*?)\\n  \\}'));return [...m[1].matchAll(/(?:^|,)\s*(\w+):\s/gm)].map(x=>x[1]).sort();};
test('es and en dictionaries expose exactly the same keys',()=>assert.deepEqual(dictKeys('es'),dictKeys('en')));
test('every t() key used in the code exists in both dictionaries',()=>{
  const used=[...new Set([...script.matchAll(/\bt\('(\w+)'\)/g)].map(m=>m[1]))];
  const es=dictKeys('es'),en=dictKeys('en');
  for(const k of used){assert.ok(es.includes(k),'missing in es: '+k);assert.ok(en.includes(k),'missing in en: '+k);}
});
test('every getElementById target exists in the HTML',()=>{
  const ids=[...new Set([...script.matchAll(/getElementById\('(\w+)'\)/g)].map(m=>m[1]))];
  for(const id of ids) assert.ok(html.includes('id="'+id+'"'),'missing element #'+id);
});
test('applyI18n translates every static UI element',()=>{
  for(const id of ['tTitle','tSub','playAll','pauseAll','syncAll','addBtn','addSearch','tForAll','globApply','tFooter','addAll','stopAdd','capacityNote'])
    assert.match(script,new RegExp("getElementById\\('"+id+"'\\)[\\s\\S]{0,140}t\\('"),'applyI18n does not translate #'+id);
});
test('tooltips, aria labels and listbox are translated',()=>{
  assert.match(script,/t\('langListLbl'\)/,'add listbox label');
  assert.match(script,/t\('langEsTip'\)/,'ES switch label');
  assert.match(script,/t\('langEnTip'\)/,'EN switch label');
  for(const k of ['audioTip','fsTip','rmTip']) assert.match(script,new RegExp("aria-label', t\\('"+k+"'\\)"),'tile aria for '+k);
});
test('status messages re-render from the active dictionary on language switch',()=>{
  assert.match(script,/function setStatus\(/,'central status helper');
  assert.match(script,/statusKey/,'status key tracked per tile');
  assert.match(script,/statusArg/,'status argument tracked per tile');
  assert.doesNotMatch(script,/x\.status\.textContent = t\('failMsg'\)/,'no failMsg hard reset that loses the real error on language switch');
});
test('no UI string is hardcoded in only one language in the tile template',()=>{
  const tileTpl=script.match(/tile\.innerHTML = `([\s\S]*?)`;/)[1];
  assert.doesNotMatch(tileTpl,/title="[^$"]*[A-Za-z]/,'tile template tooltips must come from t()');
  assert.doesNotMatch(tileTpl,/>\s*[A-Za-z][^<{}$]*</,'tile template static text must come from t()');
});

// --- sorting: tiles with the publication first, unavailable last ---
const sortSrc=script.match(/function sortTiles\(\) \{[\s\S]*?\n\}/)[0];
const mkTile=(nv)=>({classList:{contains:(c)=>c==='novideo'&&nv}});
function runSort(flags){ // flags: true = novideo
  const calls=[];
  const grid={appendChild:(node)=>calls.push(nodes.indexOf(node))};
  const nodes=flags.map(mkTile);
  const tiles=new Map(flags.map((f,i)=>['L'+i,{tile:nodes[i]}]));
  const ctx=vm.createContext({grid,tiles});
  vm.runInContext(sortSrc+'\nsortTiles();',ctx);
  return calls;
}
test('sortTiles keeps playable tiles first, unavailable last, stable within groups',()=>{
  assert.deepEqual(runSort([false,true,false,true,false,true]),[0,2,4,1,3,5]);
  assert.deepEqual(runSort([false,false,false]),[0,1,2]);
  assert.deepEqual(runSort([true,true]),[0,1]);
});
test('sortTiles reorders DOM nodes without rebuilding tiles or videos',()=>{
  assert.match(sortSrc,/grid\.appendChild\(x\.tile\)/,'moves existing nodes only');
  assert.doesNotMatch(sortSrc,/innerHTML|createElement|remove\(\)|load\(\)/,'never rebuilds or reloads');
});
test('re-sort runs whenever a selection changes',()=>{
  const loads=script.match(/function loadTileProgram[\s\S]*?\n\}/)[0];
  assert.match(loads,/sortTiles\(\)/,'individual tile change re-sorts');
  const unavail=script.match(/function markUnavailable[\s\S]*?\n\}/)[0];
  assert.match(unavail,/sortTiles\(\)/,'unavailable tile re-sorts');
  assert.doesNotMatch(script,/sortTiles\(\)[\s\S]{0,60}video\.(pause|load)/,'sort never stops playback');
});
test('sorting keeps every tile, none removed',()=>{
  assert.doesNotMatch(sortSrc,/delete|removeChild/,'sortTiles removes nothing');
});

// --- global apply resolves all tiles in parallel with bounded concurrency ---
test('apply-to-all resolves tiles in parallel, not one by one',()=>{
  const apply=script.match(/globApply'\)\.addEventListener\('click', async \(\) => \{[\s\S]*?\n\}\);/)[0];
  assert.match(apply,/Promise\.all/,'waits a pool of workers');
  assert.match(apply,/Math\.min\(6, queue\.length\)/,'bounded concurrency pool');
  assert.doesNotMatch(apply,/setTimeout/,'no artificial per-tile delay');
  assert.match(apply,/markUnavailable\(x\)/,'still reports, never substitutes');
});

// --- remove-all button ---
test('remove-all button exists, translated and guarded',()=>{
  assert.ok(html.includes('id="rmAll"'),'button in the controls row');
  assert.match(script,/getElementById\('rmAll'\)\.textContent = t\('rmAll'\)/,'translated in applyI18n');
  for(const k of ['rmAll','confirmRmAll']){assert.ok(dictKeys('es').includes(k)&&dictKeys('en').includes(k),k+' in both dictionaries');}
  const h=script.match(/getElementById\('rmAll'\)\.addEventListener\('click'[\s\S]*?\n\}\);/)[0];
  assert.match(h,/confirm\(t\('confirmRmAll'\)\)/,'asks first');
  assert.match(h,/if \(!tiles\.size\) return/,'no-op when empty');
  assert.match(h,/tiles\.clear\(\)/,'clears every tile');
  assert.match(h,/x\.video\.pause\(\)/,'stops playback explicitly');
  assert.doesNotMatch(h,/location\.reload/,'never reloads the page');
});

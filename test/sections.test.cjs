const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const fn=html.match(/function collectionsFor\(\) \{ return \[[\s\S]*?\]; }/)[0];
for(const lang of ['es','en']) test('Bible and Publications lead sections in '+lang,()=>{
 const c=vm.createContext({LANG:lang,t:k=>k});vm.runInContext(fn,c);
 const rows=c.collectionsFor(),keys=Array.from(rows,x=>x[0]);
 assert.deepEqual(keys.slice(0,2),['BIBLE','PUBS']);assert.equal(new Set(keys).size,keys.length);assert.equal(keys.length,17);
 assert.equal(rows.find(x=>x[0]==='VODBible')[1],lang==='es'?'Vídeos sobre la Biblia':'Videos about the Bible');
 assert.deepEqual(keys.slice(2),['StudioMonthlyPrograms','VODStudio','VODProgramsEvents','VODMusicVideos','VODSeries','VODChildren','VODTeenagers','VODFamily','VODMinistry','VODMinistryTools','VODOurActivities','VODOurOrganization','VODBible','VODMovies','VODIntExp']);
});
test('one section order serves global and tile controls without replacing saved selection',()=>{
 assert.ok((html.match(/for \(const \[key, name\] of collectionsFor\(\)\)/g)||[]).length>=2);
 assert.match(html,/const chosen = pickGlobalColl/);
 assert.match(html,/coll: lang.coll \|\| 'StudioMonthlyPrograms'/);
});

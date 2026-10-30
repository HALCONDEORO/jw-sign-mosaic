const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const grab = name => name === 'clampVolume' ? script.match(/function clampVolume[^\n]*/)[0] : script.match(new RegExp('function ' + name + '\\([\\s\\S]*?\\n}'))[0];
function context(storage, blockedGetter = false) {
  const ctx = vm.createContext({});
  if (blockedGetter) Object.defineProperty(ctx, 'localStorage', { get() { throw new Error('SecurityError'); } });
  else ctx.localStorage = storage;
  vm.runInContext(['readStored', 'writeStored', 'loadState', 'saveState', 'clampVolume', 'setMasterVolume'].map(grab).join('\n') + `
    const LS_KEY = 'jwSignMosaic.v2';
    const DEFAULT_CODES = ['LSE', 'ASL'];
    const VOL_KEY = 'jwSignMosaic.vol';
    let SEL = { coll: 'VODStudio', key: 'pub-test' };
    const video = { volume: 1 };
    const tiles = new Map([['LSE', {code:'LSE', coll:'VODStudio', prog:'pub-test', video}]]);
    const slider = {value: 1};
    const document = {getElementById: () => slider};
    let masterVol = 1;
  `, ctx);
  return ctx;
}
test('storage access denied by the property getter falls back safely', () => {
  const ctx = context(null, true);
  assert.equal(ctx.readStored('x'), null);
  assert.equal(ctx.writeStored('x', 'y'), false);
  assert.equal(ctx.loadState().langs[0].code, 'LSE');
  assert.doesNotThrow(() => ctx.saveState());
  assert.doesNotThrow(() => ctx.setMasterVolume(0.3));
  assert.equal(vm.runInContext('video.volume', ctx), 0.3);
  assert.equal(vm.runInContext('slider.value', ctx), 0.3);
});
test('unavailable storage global does not throw', () => {
  const ctx = context(undefined);
  delete ctx.localStorage;
  assert.equal(ctx.readStored('x'), null);
  assert.equal(ctx.writeStored('x', 'y'), false);
});
test('quota errors do not prevent changing the live volume or saving state', () => {
  const ctx = context({getItem: () => null, setItem() { throw new Error('QuotaExceededError'); }});
  assert.doesNotThrow(() => ctx.saveState());
  ctx.setMasterVolume(0.7);
  assert.equal(vm.runInContext('video.volume', ctx), 0.7);
});
test('available storage retains preferences and v2 publication selection', () => {
  const store = new Map();
  const ctx = context({getItem: k => store.get(k) ?? null, setItem: (k,v) => store.set(k,v)});
  assert.equal(ctx.writeStored('lang', 'en'), true);
  assert.equal(ctx.readStored('lang'), 'en');
  assert.equal(ctx.readStored('missing'), null);
  ctx.saveState();
  assert.equal(ctx.loadState().sel.key, 'pub-test');
  assert.equal(ctx.loadState().langs[0].code, 'LSE');
  ctx.setMasterVolume(0.6);
  assert.equal(store.get('jwSignMosaic.vol'), '0.6');
});
test('bad v2 JSON can still migrate the v1 language list', () => {
  const ctx = context({getItem: k => k === 'jwSignMosaic.v2' ? '{bad' : '[{"code":"BSL"}]'});
  assert.equal(ctx.loadState().langs[0].code, 'BSL');
});
test('every preference access uses guarded helpers, including startup and language changes', () => {
  assert.equal([...script.matchAll(/localStorage\.getItem\(/g)].length, 1);
  assert.equal([...script.matchAll(/localStorage\.setItem\(/g)].length, 1);
  assert.match(script, /let LANG = \(readStored\('jwSignMosaic.lang'\)/);
  assert.match(script, /const savedVol = readStored\(VOL_KEY\)/);
  assert.match(grab('setLang'), /writeStored\('jwSignMosaic.lang', l\)/);
});

test('startup defaults survive blocked storage and preserve the browser language', () => {
  const ctx = context(null, true);
  ctx.navigator = {language: 'en-GB'};
  vm.runInContext(script.match(/let LANG = [^\n]*/)[0] + '\n' + script.match(/const savedVol = [^\n]*/)[0], ctx);
  assert.equal(vm.runInContext('LANG', ctx), 'en');
  assert.equal(vm.runInContext('savedVol', ctx), null);
});
test('language changes update the live UI even when persistence fails', () => {
  const ctx = context(null, true);
  vm.runInContext("let LANG = 'es'; let translated = false; const applyI18n = () => { translated = true; }; const refreshGlobalPicker = () => {}; const renderAddList = () => {}; tiles.clear();", ctx);
  vm.runInContext(grab('setLang'), ctx);
  ctx.setLang('en');
  assert.equal(vm.runInContext('LANG', ctx), 'en');
  assert.equal(vm.runInContext('translated', ctx), true);
});

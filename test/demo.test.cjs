const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'demo.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
test('synthetic demo script parses', () => new vm.Script(script));
test('demo cannot request media, remote data or persistent storage', () => {
  assert.doesNotMatch(script, /\b(fetch|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|indexedDB)\b|document\.cookie/);
  assert.doesNotMatch(html, /<(?:video|audio|iframe|img)\b|\b(?:src|href)=["']https?:/);
});
test('demo clearly distinguishes placeholders from signed content', () => {
  for (const phrase of ['Synthetic demo only.', 'not people, signing, translations or recordings', 'not a test of live catalogue availability', 'not sign-language content']) assert.ok(html.includes(phrase));
});
test('demo provides shared playback and explicit language selection', () => {
  for (const id of ['play', 'sync', 'skip', 'language', 'add', 'clock', 'status']) assert.ok(html.includes('id="'+id+'"'));
  assert.match(script, /if\(!code\)/);
  assert.match(script, /seconds=Math\.min\(60,seconds\+10\)/);
  assert.match(script, /feature\.setAttribute\('aria-pressed'/);
});
test('demo respects reduced-motion and keyboard focus', () => {
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /:focus-visible/);
  assert.match(html, /aria-live="polite"/);
});

test('demo clock formats the completed minute correctly', () => {
  const fn = script.match(/function formatTime\(value\)\{[^\n]+\}/)[0];
  const context = vm.createContext({}); vm.runInContext(fn, context);
  assert.equal(context.formatTime(0), '00:00');
  assert.equal(context.formatTime(59.9), '00:59');
  assert.equal(context.formatTime(60), '01:00');
  assert.equal(context.formatTime(70), '01:10');
  assert.match(script, /textContent=formatTime\(seconds\)/);
});

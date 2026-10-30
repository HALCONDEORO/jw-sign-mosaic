const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');

test('page has a description, Open Graph tags and a favicon', () => {
  assert.match(html, /<meta name="description" content="[^"]{20,}"/);
  for (const p of ['og:title', 'og:description', 'og:image', 'og:url']) {
    assert.match(html, new RegExp('<meta property="' + p + '" content="[^"]+"'), p);
  }
  assert.match(html, /<link rel="icon" href="data:image\/svg\+xml,/);
});

test('page shows a noscript fallback', () => {
  assert.match(html, /<noscript>[\s\S]*JavaScript[\s\S]*<\/noscript>/);
});

test('html lang is updated when the interface language changes', () => {
  assert.match(html, /document\.documentElement\.lang = t\('htmlLang'\)/);
});

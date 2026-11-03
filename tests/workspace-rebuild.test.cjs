const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'workspace-rebuild.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'workspace-rebuild.js'), 'utf8');
const pages = ['planner','dashboard','financialStory','obligations','pending','transactions','transfers','accounts','reports','dates','categories','reconciliation','settings'];

test('the existing financial app remains the same document', () => {
  for (const page of pages) assert.match(html, new RegExp('id="' + page + 'Page"'));
  for (const id of ['loginForm','monthInput','transactionForm','accountForm','categoryForm','importJsonInput','exportJsonBtn','lockBtn']) {
    assert.ok(html.includes('id="' + id + '"'), id);
  }
});
test('financial and data scripts remain in order', () => {
  const deps = ['sync-core.js','safe-cloud-sync.js','planner-core.js','financial-story.js','bootstrap-v2.js','v4.js','design.js','workspace-rebuild.js'];
  const positions = deps.map(name => html.indexOf('src="' + name + '?'));
  assert.ok(positions.every(index => index >= 0));
  assert.deepEqual([...positions].sort((a,b)=>a-b),positions);
});
test('design stylesheet is last in the cascade', () => {
  assert.ok(html.indexOf('workspace-rebuild.css') > html.indexOf('financial-story.css'));
  assert.ok(html.indexOf('workspace-rebuild.css') < html.indexOf('</head>'));
});
test('presentation JavaScript is syntactically valid', () => {
  assert.doesNotThrow(() => new vm.Script(js));
});
test('presentation code is isolated from financial state', () => {
  assert.ok(!js.includes('salary_manager_v2'));
  assert.ok(!js.includes('salarySyncCore'));
  assert.ok(!js.includes('firebase.firestore'));
  assert.ok(js.includes('atelierSkip'));
  assert.ok(js.includes('moreGrid'));
});
test('dark/light, responsive, reduced-motion rules are provided', () => {
  assert.match(css, /body\.light/);
  assert.match(css, /max-width:760px/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /focus-visible/);
  assert.match(css, /#atelierPalette/);
  assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});

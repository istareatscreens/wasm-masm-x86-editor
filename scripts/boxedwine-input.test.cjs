const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(resolve(__dirname, '../src/html/boxedwine.html'), 'utf8');
// Runs the page's clipboard and copy-chord listeners with a recording Module.
const start = html.lastIndexOf('      (function () {', html.indexOf('var pendingImport = null'));
const clipboard = html.slice(start, html.indexOf('      // Text in any language:', start));

function setup() {
  const listeners = new Map(), sent = [];
  const context = {
    console: { log() {}, warn() {} },
    performance: { now: () => 0 },
    navigator: { clipboard: { readText: () => Promise.resolve(''), writeText: () => Promise.resolve() } },
    setTimeout: () => 0,
    Module: { sendKey: (keysym, down) => sent.push([keysym, down]) },
    BW_INPUT_OPEN: true,
    addEventListener: (type, fn) => { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(clipboard, context);
  const key = (type, init) => {
    const e = {
      type, code: 'KeyC', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...init,
      prevented: false, stopped: false,
      preventDefault() { this.prevented = true; },
      stopImmediatePropagation() { this.stopped = true; },
    };
    for (const fn of listeners.get(type) || []) { fn(e); if (e.stopped) break; }
    return e;
  };
  return { context, sent, key };
}

// Control_L, Shift_L and c, pressed and released in order
const CHORD = [[0xffe3, true], [0xffe1, true], [0x63, true], [0x63, false], [0xffe1, false], [0xffe3, false]];

test('Ctrl+Shift+C and Cmd+Shift+C are typed into the guest whole and kept from the browser', () => {
  for (const modifier of [{ ctrlKey: true }, { metaKey: true }]) {
    const { sent, key } = setup();
    const down = key('keydown', { ...modifier, shiftKey: true });
    assert.equal(down.prevented, true, 'the browser does not act on the chord');
    assert.equal(down.stopped, true, 'SDL does not see the C');
    assert.deepEqual(sent, CHORD);
    const up = key('keyup', { ...modifier, shiftKey: true });
    assert.equal(up.stopped, true, 'SDL does not see the release of the C either');
    assert.deepEqual(sent, CHORD, 'the release types nothing more');
  }
});

test('other C chords reach SDL untouched', () => {
  const { sent, key } = setup();
  for (const init of [
    { ctrlKey: true }, // Ctrl+C: the console break, or a copy of a selection
    { shiftKey: true },
    { ctrlKey: true, shiftKey: true, altKey: true },
    { ctrlKey: true, metaKey: true, shiftKey: true },
  ]) {
    const e = key('keydown', init);
    assert.equal(e.prevented, false, JSON.stringify(init));
    assert.equal(e.stopped, false, JSON.stringify(init));
  }
  assert.deepEqual(sent, []);
});

test('nothing is typed before the console has input', () => {
  const { context, sent, key } = setup();
  context.BW_INPUT_OPEN = false;
  const e = key('keydown', { ctrlKey: true, shiftKey: true });
  assert.equal(e.prevented, false);
  assert.deepEqual(sent, []);
});

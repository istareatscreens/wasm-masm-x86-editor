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

// The wheel and trackpad mapping (the page's code between its markers), with a recording canvas: what reaches
// SDL is the page's own wheel events, 100 px per row.
const wheelCode = html.slice(html.indexOf('      // Wheel and trackpad:'), html.indexOf('      window.bwOpenInput = function (why) {'));

function wheelSetup(platform) {
  const listeners = [], frames = [], toSdl = [];
  class WheelEvent {
    constructor(type, init) {
      Object.assign(this, { type, deltaX: 0, deltaY: 0, deltaMode: 0, ctrlKey: false }, init);
    }
  }
  const context = {
    navigator: { platform },
    WheelEvent,
    requestAnimationFrame: (fn) => frames.push(fn),
    addEventListener: (type, fn, options) => listeners.push({ type, fn, options }),
    BW_CELL: { w: 11, h: 22 },
    bwGeometryFor: () => ({ rows: 20 }),
  };
  // dispatching on the canvas runs the window's capture listener first, as the browser does
  const canvas = {
    width: 800,
    height: 467,
    dispatchEvent(e) {
      e.stopped = false;
      e.stopPropagation = () => (e.stopped = true);
      e.preventDefault = () => (e.prevented = true);
      for (const l of listeners) if (l.type === 'wheel') l.fn(e);
      if (!e.stopped) toSdl.push(e);
    },
  };
  context.document = { getElementById: (id) => (id === 'canvas' ? canvas : null) };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(wheelCode, context);
  const wheel = (init) => {
    const e = new WheelEvent('wheel', init);
    canvas.dispatchEvent(e);
    return e;
  };
  const frame = () => frames.splice(0).forEach((fn) => fn());
  const rows = () => toSdl.reduce((sum, e) => sum + e.deltaY / 100, 0);
  return { context, listeners, wheel, frame, toSdl, rows };
}

test('wheel rows: lines, pages and pixels by platform, fractions kept and dropped on a new direction', () => {
  const { context } = wheelSetup('Win32');
  const rows = (mode, delta, platform, state = { acc: 0 }) => context.bwWheelRows(mode, delta, platform, 20, state);
  assert.equal(rows(0, 100, 'windows'), 3); // a Chrome notch on Windows: 100/3 px a row
  assert.equal(rows(0, 120, 'linux'), 3); // a Chromium 109+ notch on Linux
  assert.equal(rows(0, 22, 'mac'), 1); // the console's row height
  assert.equal(rows(0, 66, 'other'), 3);
  assert.equal(rows(1, 3, 'windows'), 3); // Firefox: the system's lines per notch
  assert.equal(rows(1, -5, 'linux'), -5);
  assert.equal(rows(2, 1, 'mac'), 19); // a page: the window less a row
  const state = { acc: 0 };
  assert.equal(rows(0, 50, 'windows', state), 1);
  assert.equal(rows(0, 50, 'windows', state), 2); // 1.5 + 1.5
  assert.equal(state.acc, 0);
  assert.equal(rows(0, 30, 'windows', state), 0); // 0.9 kept
  assert.equal(rows(0, -10, 'windows', state), 0); // a new direction: the 0.9 is dropped, -0.3 kept
  assert.equal(rows(0, -30, 'windows', state), -1); // -1.2
  let total = 0;
  const run = { acc: 0 };
  for (let i = 0; i < 37; i++) total += rows(0, 7, 'mac', run);
  assert.equal(total, Math.floor((37 * 7) / 22));
  assert.equal(context.bwWheelPlatform({ userAgentData: { platform: 'macOS' }, platform: 'MacIntel' }), 'mac');
  assert.equal(context.bwWheelPlatform({ platform: 'Linux x86_64' }), 'linux');
  assert.equal(context.bwWheelPlatform({ userAgentData: { platform: 'Chrome OS' } }), 'linux');
  assert.equal(context.bwWheelPlatform({ platform: 'Win32' }), 'windows');
  assert.equal(context.bwWheelPlatform({ platform: 'iPhone' }), 'other');
});

test('a notch is 3 rows in each browser, and only the page\'s own events reach SDL', () => {
  for (const [platform, init] of [
    ['Win32', { deltaMode: 0, deltaY: 100 }], // Chrome on Windows
    ['Win32', { deltaMode: 1, deltaY: 3 }], // Firefox on Windows
    ['Linux x86_64', { deltaMode: 0, deltaY: 120 }], // Chrome on Linux
    ['Linux x86_64', { deltaMode: 1, deltaY: 3 }], // Firefox on Linux
  ]) {
    const { wheel, toSdl, listeners } = wheelSetup(platform);
    assert.deepEqual(listeners.map((l) => [l.type, l.options.capture, l.options.passive]), [['wheel', true, false]]);
    const e = wheel(init);
    assert.equal(e.prevented, true, 'the browser does not scroll');
    assert.equal(e.stopped, true, 'SDL does not see the original');
    assert.equal(toSdl.length, 1, JSON.stringify(init));
    assert.deepEqual([toSdl[0].deltaMode, toSdl[0].deltaY], [0, 300], platform + ' ' + JSON.stringify(init));
  }
  // up is negative
  const up = wheelSetup('Win32');
  up.wheel({ deltaY: -100 });
  assert.equal(up.rows(), -3);
});

test('a trackpad on macOS moves one row per 22 px, at once and then once a frame, in events of at most 10 rows', () => {
  const { wheel, frame, toSdl, rows } = wheelSetup('MacIntel');
  wheel({ deltaY: 8 });
  wheel({ deltaY: 8 });
  assert.equal(rows(), 0); // 16 px
  wheel({ deltaY: 8 }); // 24 px: the first row, at once
  assert.equal(rows(), 1);
  for (let i = 0; i < 5; i++) wheel({ deltaY: 8 }); // 64 px: rows 2 and 3 wait for the frame
  assert.equal(rows(), 1);
  frame();
  assert.equal(rows(), 2); // 64 / 22
  frame(); // nothing new: the next event sends at once again
  wheel({ deltaY: 22 * 25 });
  assert.equal(rows(), 27);
  assert.ok(toSdl.every((e) => Math.abs(e.deltaY) <= 1000), 'no event carries more than 10 rows');
  // Ctrl+wheel (Ctrl+scroll, pinch) reaches SDL untouched
  const pinch = wheelSetup('MacIntel');
  const e = pinch.wheel({ deltaY: 40, ctrlKey: true });
  assert.notEqual(e.prevented, true);
  assert.equal(pinch.toSdl.length, 1);
  assert.equal(pinch.toSdl[0], e);
  // horizontal only: prevented, nothing sent
  const side = wheelSetup('Win32');
  const h = side.wheel({ deltaX: 100, deltaY: 0 });
  assert.equal(h.prevented, true);
  assert.equal(side.toSdl.length, 0);
});

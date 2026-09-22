const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(resolve(__dirname, '../src/html/boxedwine.html'), 'utf8');
// Execute the actual adapter helpers, with canvas extraction denied like a
// hardened browser. No generated glue, WASM, or browser dependency is needed.
const probeStart = html.indexOf('    (function () {', html.indexOf('// SDL exposes'));
const probe = html.slice(probeStart, html.indexOf('    // Presentation:', probeStart));
const resizeStart = html.indexOf('    (function () {', html.indexOf('// Live resize:'));
const resize = html.slice(resizeStart, html.indexOf('    getDisableHideCursor', resizeStart));

function setup() {
  const elements = new Map(), events = new Map(), intervals = new Map(), timeouts = new Map();
  let timerId = 0;
  const deny = () => { throw new Error('Canvas extraction denied'); };
  function element(tag) {
    return {
      tag, style: {}, width: 320, height: 240,
      appendChild(child) { this.firstChild = child; if (child.id) elements.set(child.id, child); },
      getContext() { return { getImageData: deny, putImageData: image => { this.painted = { width: image.width, height: image.height, data: image.data.slice() }; } }; },
      toDataURL: deny,
    };
  }
  const canvas = element('canvas');
  elements.set('canvas', canvas);
  const context = {
    document: { getElementById: id => elements.get(id), createElement: element, body: element('body') },
    console: { log() {}, warn() {} },
    Date, Math,
    Module: { SDL2: { ctxCanvas: canvas }, bwGetScreenSize: () => `${canvas.width}x${canvas.height}`, bwResizeScreen(w, h) { context.requested = [w, h]; } },
    BW_INPUT_OPEN: true, innerWidth: 320, innerHeight: 240,
    BW_CONSOLE_GEOMETRY: { width: 320, height: 240 },
    bwGeometryFor: (width, height) => ({ width, height }),
    addEventListener: (name, fn) => events.set(name, fn),
    setInterval: fn => { intervals.set(++timerId, fn); return timerId; },
    clearInterval: id => intervals.delete(id),
    setTimeout: fn => { timeouts.set(++timerId, fn); return timerId; },
    clearTimeout: id => timeouts.delete(id),
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(probe, context);
  vm.runInContext(resize, context);
  function frame(rgb = [0, 0, 0], border = false) {
    const width = canvas.width, height = canvas.height;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const edge = border && (x < 3 || x >= width - 3 || y < 3 || y >= height - 3);
      data.set(edge ? [128, 128, 128, 255] : [...rgb, 255], (y * width + x) * 4);
    }
    context.Module.SDL2.image = { width, height, data };
    return context.Module.SDL2.image;
  }
  return { context, canvas, frame, elements, events, intervals, timeouts };
}

test('startup rejects missing, blank, and Wine startup frames despite denied canvas reads', () => {
  const { context: c, frame } = setup();
  assert.equal(c.bwConsoleLit(), -1);
  frame();
  assert.equal(c.bwConsoleLit(), 0);
  // The Wine configuration dialog sits on a blue desktop, not a full console.
  frame([58, 110, 165]);
  assert.equal(c.bwConsoleLit(), 0);
  frame([0, 0, 0], true);
  assert.ok(c.bwConsoleLit() > 20);
  assert.equal(c.bwConsoleFillsScreen(), true);
});

test('stale or incomplete renderer frames cannot finish startup or a resize', () => {
  const { context: c, canvas, frame } = setup();
  frame([0, 0, 0], true);
  canvas.width++;
  assert.equal(c.bwConsoleLit(), -1);
  assert.equal(c.bwConsoleFillsScreen(), false);
  frame([0, 0, 0], true);
  c.Module.SDL2.image.data = new Uint8ClampedArray(4);
  assert.equal(c.bwConsoleFrame(), null);
  frame([0, 0, 0], true);
  c.Module.SDL2.ctxCanvas = {};
  assert.equal(c.bwConsoleFrame(), null);
});

test('resize holds copy real pixels at their original size and clear on a completed frame', () => {
  const { context: c, canvas, frame, elements, events, intervals } = setup();
  const before = frame([0, 0, 0], true);
  c.innerWidth = 640;
  events.get('resize')();
  const hold = elements.get('bw-resize-hold'), copy = hold.firstChild;
  assert.equal(copy.tag, 'canvas');
  assert.equal(hold.style.display, 'block');
  assert.equal(copy.width, 320);
  assert.equal(copy.height, 240);
  assert.deepEqual(copy.painted.data, before.data);
  before.data.fill(0);
  assert.ok(copy.painted.data.some(value => value !== 0), 'hold remains frozen when SDL reuses its frame');
  c.bwSyncScreenToPanel();
  assert.deepEqual(Array.from(c.requested), [640, 240]);
  for (const callback of intervals.values()) callback();
  assert.equal(hold.style.display, 'block', 'old geometry cannot release hold');
  canvas.width = 640;
  frame([0, 0, 0], true);
  for (const callback of intervals.values()) callback();
  assert.equal(hold.style.display, 'none');
});

test('resize safety deadline releases a hold even if the guest does not repaint', () => {
  const { context: c, frame, elements, events, timeouts } = setup();
  frame([0, 0, 0], true);
  c.innerWidth = 640;
  events.get('resize')();
  const hold = elements.get('bw-resize-hold');
  assert.equal(hold.style.display, 'block');
  // The first timer is the hard safety deadline; the other is resize debounce.
  timeouts.values().next().value();
  assert.equal(hold.style.display, 'none');
});

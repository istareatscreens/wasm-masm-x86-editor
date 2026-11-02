const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const shell = readFileSync(resolve(__dirname, '../src/js/boxedwine/boxedwine-shell.js'), 'utf8');
// Runs the shell's getEmulatorParams alone, with a stub Config.
const start = shell.indexOf('        function getEmulatorParams() {');
const end = shell.indexOf('\n        }', start) + '\n        }'.length;
const source = shell.slice(start, end);

function emulatorParams(config) {
  const Config = {
    rootZipFile: 'root.zip', extraZipFiles: [], extraPayload: '', appZipFile: '', appPayload: '', payloadZipFile: '',
    appDirPrefix: '/home/username/files/', appSubfolder: '', d_drive: '/d_drive', resolution: null, ddrawOverridePath: null,
    frameSkip: '0', isSoundEnabled: true, audioFreq: 11025, disableHideCursor: false, bpp: 32, cpu: '', envProp: '',
    loadDesktop: false, WorkingDir: '', Program: 'cmd.exe', ProgramArgs: [],
    ...config,
  };
  const context = vm.createContext({ ROOT: '/root', Config, DEFAULT_AUDIO_FREQ: 11025, DEFAULT_BPP: 32, window: {}, console });
  return JSON.parse(JSON.stringify(vm.runInContext(source + '\ngetEmulatorParams();', context)));
}

// Every guest program runs as root: for any other user, only /tmp, /var and /home are writable.
test('the emulator starts the guest as root (-uid 0 -euid 0), before the guest program', () => {
  assert.ok(start > 0 && end > start, 'getEmulatorParams found');
  for (const config of [{}, { loadDesktop: true }, { Program: 'build.bat', ProgramArgs: ['test'] }]) {
    const args = emulatorParams(config);
    for (const flag of ['-uid', '-euid']) {
      const at = args.flatMap((a, i) => (a === flag ? [i] : []));
      assert.equal(at.length, 1, flag + ' exactly once');
      assert.equal(args[at[0] + 1], '0', flag + ' 0');
      assert.ok(at[0] < args.indexOf('/bin/wine'), flag + ' is an emulator option, before /bin/wine');
    }
  }
});

// Inputs whose expected results come from outside this project: binaryCorpus() was run
// through the real isbinaryfile 6.0.0. file-drawer.test.cjs pins those results.

const utf16 = (text, le, bom) => {
  const out = Buffer.alloc((bom ? 2 : 0) + text.length * 2);
  let at = 0;
  const put = (unit) => {
    out[at++] = le ? unit & 0xff : unit >> 8;
    out[at++] = le ? unit >> 8 : unit & 0xff;
  };
  if (bom) put(0xfeff);
  for (let i = 0; i < text.length; i++) put(text.charCodeAt(i));
  return out;
};
// Windows-1252 / Windows-1251 bytes for the few characters the samples use
const CP1252 = { "é": 0xe9, "è": 0xe8, "ï": 0xef, "“": 0x93, "”": 0x94, "—": 0x97, "€": 0x80 };
const CP1251 = "абвгдежзийклмнопрстуфхцчшщъыьэюя";
const eightBit = (text, table) => Buffer.from(Array.from(text, (c) => (c.charCodeAt(0) < 0x80 ? c.charCodeAt(0) : table(c))));
const prng = (seed) => () => ((seed = (seed * 1103515245 + 12345) >>> 0) >>> 16) & 0xff;

function binaryCorpus() {
  const asm = "INCLUDE Irvine32.inc\r\n.code\r\nmain PROC\r\n    exit\r\nmain ENDP\r\nEND main\r\n";
  const rand = prng(42);
  const pe = Buffer.alloc(1024);
  pe.write("MZ", 0, "latin1");
  pe[2] = 0x90;
  pe.writeUInt32LE(0x80, 0x3c);
  pe.write("This program cannot be run in DOS mode.", 0x4e, "latin1");
  pe.write("PE\0\0", 0x80, "latin1");
  const coff = Buffer.alloc(600);
  coff.writeUInt16LE(0x14c, 0);
  coff.write(".text", 20, "latin1");
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d]), Buffer.from("IHDR", "latin1"), Buffer.alloc(300, 7)]);
  const proto = Buffer.concat(Array.from({ length: 12 }, (_, i) => Buffer.from([0x08, 0x96, 0x01, 0x12, 0x07, ...Buffer.from("testin" + String.fromCharCode(97 + i), "latin1")])));
  const boundary = Buffer.concat([Buffer.alloc(511, 0x61), Buffer.from("€", "utf8"), Buffer.from("tail", "latin1")]);
  return [
    ["empty", Buffer.alloc(0)],
    ["ascii-asm", Buffer.from(asm, "latin1")],
    ["utf8-cjk-emoji", Buffer.from("; 你好 мир γειά 🚀 €\nmov eax, 1\n".repeat(20), "utf8")],
    ["utf8-bom", Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("hello\r\n", "latin1")])],
    ["utf16le-bom", utf16("hello world\r\n".repeat(30), true, true)],
    ["utf16be-bom", utf16("hello world\r\n".repeat(30), false, true)],
    ["utf16le-nobom", utf16("hello world, this is text\r\n".repeat(30), true, false)],
    ["utf16be-nobom", utf16("hello world, this is text\r\n".repeat(30), false, false)],
    ["cp1252-text", eightBit("Café résumé “quoted” — naïve €\r\n".repeat(30), (c) => CP1252[c])],
    ["cp1251-text", eightBit("привет мир, это текст\r\n".repeat(20), (c) => 0xe0 + CP1251.indexOf(c))],
    ["ascii-few-latin1", Buffer.concat([Buffer.from("x".repeat(300), "latin1"), Buffer.from([0xe9, 0xe8]), Buffer.from("y".repeat(200), "latin1")])],
    ["control-chars", Buffer.from("\x01\x02\x03 hello \x04\x05\x06 world \x10\x11".repeat(10), "latin1")],
    ["pe-exe", pe],
    ["coff-obj", coff],
    ["png", png],
    ["pdf", Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj\n", "latin1")],
    ["protobuf-like", proto],
    ["random-1k", Buffer.from(Array.from({ length: 1024 }, rand))],
    ["utf8-split-at-512", boundary],
    ["short-binary", Buffer.from([0x01, 0x02])],
    ["tabs-newlines", Buffer.from("\t\r\n\f\v\x0e text \x07\x08", "latin1")],
  ];
}

module.exports = { binaryCorpus };

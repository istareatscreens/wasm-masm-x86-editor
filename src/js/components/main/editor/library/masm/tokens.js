// External tokenizers and keyword specializers for masm.grammar.
//
// * specializeIdentifier / extendIdentifier / specializeDotWord classify words
//   case-insensitively using keywords.js (reference keywords, with provenance)
//   and mnemonics.js (generated from the processor manuals). MASM is
//   case-insensitive by default (syntax/ml-and-ml64-command-line-reference.md,
//   /Cu). The functions are pure (no parse-state dependence) because Lezer may
//   cache a specialized token across GLR stacks.
// * contextTokens recognises the four constructs that are not regular
//   tokens: text literals (<...>), COMMENT blocks, raw text after ECHO/TITLE,
//   and INCLUDE file specifications. It is contextual: it only emits a token
//   when the parser can shift it (stack.canShift), so "<" is still a relational
//   operator inside .IF conditions and ";" still starts a comment elsewhere.

import { ExternalTokenizer } from "@lezer/lr";
import * as T from "./parser.terms.js";
import { SPECIALIZED_KEYWORDS, CONTEXTUAL_ATTRIBUTES, DOT_DIRECTIVES, MNEMONIC_DUALS } from "./keywords.js";
import { MNEMONICS } from "./mnemonics.js";

// ---------------------------------------------------------------------------
// Keyword tables (upper-case word -> term id)
// ---------------------------------------------------------------------------
function termId(name) {
  const id = T[name];
  if (typeof id !== "number") throw new Error(`tokens.js: keywords.js refers to unknown grammar term "${name}"`);
  return id;
}

const SPECIALIZE = Object.create(null);
const EXTEND = Object.create(null);
const DOTS = Object.create(null);

function define(table, word, term, source) {
  const key = word.toUpperCase();
  if (key in SPECIALIZE || key in EXTEND || key in DOTS) {
    throw new Error(`tokens.js: keyword "${word}" (${source}) is defined twice`);
  }
  table[key] = termId(term);
}
for (const [word, term, source] of SPECIALIZED_KEYWORDS) define(SPECIALIZE, word, term, source);
for (const [word, term, source] of CONTEXTUAL_ATTRIBUTES) define(EXTEND, word, term, source);
for (const [word, term, source] of DOT_DIRECTIVES) define(DOTS, word, term, source);
for (const word of MNEMONICS) {
  if (word in SPECIALIZE || word in EXTEND) {
    throw new Error(`tokens.js: mnemonic "${word}" collides with a reference keyword (regenerate with npm run mnemonics)`);
  }
  SPECIALIZE[word] = T.Mnemonic;
}
// Words that are both mnemonics and keywords stay keyword terms here; the
// grammar accepts those terms at instruction position (dualMnemonic).
for (const word of Object.keys(MNEMONIC_DUALS)) {
  if (!(word in SPECIALIZE)) throw new Error(`tokens.js: MNEMONIC_DUALS entry "${word}" is not a reference keyword`);
}

export function specializeIdentifier(value) {
  const id = SPECIALIZE[value.toUpperCase()];
  return id === undefined ? -1 : id;
}

export function extendIdentifier(value) {
  const id = EXTEND[value.toUpperCase()];
  return id === undefined ? -1 : id;
}

export function specializeDotWord(value) {
  const id = DOTS[value.toUpperCase()];
  return id === undefined ? -1 : id;
}

// ---------------------------------------------------------------------------
// Contextual tokenizer
// ---------------------------------------------------------------------------
const NL = 10, SPACE = 32, TAB = 9, CR = 13, LT = 60, GT = 62, BANG = 33, SEMI = 59;

// BNF whiteSpaceCharacter: 8, 9, 11-13, 26, 32
function isSpace(ch) {
  return ch === SPACE || ch === TAB || ch === CR || ch === 11 || ch === 12 || ch === 8 || ch === 26;
}

// BNF textLiteral: "<" text ">"; text may contain nested textLiterals and
// "!" character escapes (operator-logical-not-masm.md). An unterminated literal
// extends to the end of the line so the rest of the file is unaffected.
function readTextLiteral(input) {
  let depth = 0;
  for (;;) {
    const ch = input.next;
    if (ch < 0 || ch === NL) break;
    input.advance();
    if (ch === BANG) {
      if (input.next >= 0 && input.next !== NL) input.advance();
      continue;
    }
    if (ch === LT) depth++;
    else if (ch === GT && --depth === 0) break;
  }
  input.acceptToken(T.TextLiteral);
}

// BNF commentDir: COMMENT delimiter text ... text delimiter text ;;
// delimiter: any character except whiteSpaceCharacter. The token starts at the
// delimiter and ends at the end of the line that holds the closing delimiter.
function readBlockComment(input) {
  const delim = input.next;
  input.advance();
  for (;;) {
    const ch = input.next;
    if (ch < 0) break;
    input.advance();
    if (ch === delim) break;
  }
  while (input.next >= 0 && input.next !== NL) input.advance();
  input.acceptToken(T.BlockComment);
}

// BNF arbitraryText: charList (any characters except linefeed)
function readRawText(input) {
  while (input.next >= 0 && input.next !== NL) input.advance();
  input.acceptToken(T.RawText);
}

// BNF fileSpec: fileCharList | textLiteral; fileChar: delimiter (non-whitespace).
// A ";" ends the specification so a trailing comment stays a comment.
function readFileName(input) {
  while (input.next >= 0 && input.next !== NL && input.next !== SEMI && !isSpace(input.next)) input.advance();
  input.acceptToken(T.FileName);
}

export const contextTokens = new ExternalTokenizer(
  (input, stack) => {
    const ch = input.next;
    // Leading whitespace is left to the skip tokenizer; we are called again after it.
    if (ch < 0 || ch === NL || isSpace(ch)) return;
    if (ch === LT) {
      if (stack.canShift(T.TextLiteral)) readTextLiteral(input);
      return;
    }
    if (stack.canShift(T.BlockComment)) return readBlockComment(input);
    if (stack.canShift(T.RawText)) return readRawText(input);
    if (stack.canShift(T.FileName)) return readFileName(input);
  },
  { contextual: true }
);

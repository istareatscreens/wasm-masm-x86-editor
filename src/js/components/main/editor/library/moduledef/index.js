// CodeMirror 6 language for module-definition (.def) files, the statements LINK reads with /DEF. The format is
// line-oriented with no nesting, so a stream parser reads it: words as Microsoft's reference defines them
// (vocabulary.js), each token named by its category in scripts/module-definition.corpus.json and mapped to the
// STANDARD @lezer/highlight tag the MASM language gives the same kind of word, so every theme colors both alike.
import { StreamLanguage, LanguageSupport } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { STATEMENTS, RESERVED_WORDS, SECTION_WORDS, FILE_NAME_STATEMENTS, LIST_STATEMENTS } from "./vocabulary.js";

const statements = new Set(STATEMENTS);
const reserved = new Set(RESERVED_WORDS);
const sectionWords = new Set(SECTION_WORDS);
const fileNameStatements = new Set(FILE_NAME_STATEMENTS);
const listStatements = new Set(LIST_STATEMENTS);

// A name holds letters, digits, _ ? $ @ (decorated names: _AddTwo@8, ?Area@@YANN@Z, @FastAdd@8) and - (EXECUTE-ONLY),
// and starts with neither a digit nor @ and a digit (an ordinal). Numbers are decimal or 0x hexadecimal; an ordinal is
// @n, or #n after a forwarded export's module. An unquoted file name runs to white space, ";", a quote, "=" or ",".
const NAME = /^(?:@(?!\d)|[A-Za-z_?$])[\w?$@-]*/;
const DIGIT_WORD = /^\d[\w?$@-]*/;
const NUMBER = /^(?:0[xX][0-9A-Fa-f]+|\d+)(?![\w?$@-])/;
const ORDINAL = /^[@#]\d+(?![\w?$@-])/;
const SECTION_NAME = /^\.[\w?$@-]*/;
const FILE_NAME = /^[^\s;"'=,:][^\s;"'=,]*/;

const tokenTable = {
  statement: t.controlKeyword, // as MASM's directives
  reserved: t.modifier, // as MASM's attributes
  filename: t.string, // as MASM's INCLUDE file names
  export: t.function(t.definition(t.variableName)), // as a PROC's name
  section: t.definition(t.typeName), // as a SEGMENT's name
  name: t.variableName,
  number: t.number,
  string: t.string,
  comment: t.lineComment,
  operator: t.operator,
  punctuation: t.punctuation,
  separator: t.separator,
};

// list: the list statement whose definitions follow (EXPORTS, SECTIONS or SEGMENTS), else null; definition: the next
// token starts a definition; fileName: a file name may come next (after LIBRARY or NAME, or STUB and its colon)
const startState = () => ({ list: null, definition: false, fileName: false });

// a word: a statement (which starts its own arguments), a reserved word, else a name by its place
function word(text, state, definition) {
  if (statements.has(text)) {
    state.list = listStatements.has(text) ? text : null;
    state.definition = state.list !== null;
    state.fileName = fileNameStatements.has(text);
    return "statement";
  }
  if (reserved.has(text)) return "reserved";
  const sections = state.list === "SECTIONS" || state.list === "SEGMENTS";
  if (sections && !definition && sectionWords.has(text)) return "reserved";
  if (definition && !/^\d/.test(text)) return sections ? "section" : "export";
  return "name";
}

function token(stream, state) {
  if (stream.sol()) state.definition = state.list !== null;
  if (stream.eatSpace()) return null;
  const ch = stream.peek();
  if (ch === ";") {
    stream.skipToEnd();
    return "comment";
  }
  const definition = state.definition;
  state.definition = false;
  if (ch === '"' || ch === "'") {
    stream.next();
    while (!stream.eol() && stream.next() !== ch);
    state.fileName = false;
    return "string";
  }
  if (state.fileName) {
    const run = stream.match(FILE_NAME, false);
    if (run && !reserved.has(run[0])) {
      stream.match(FILE_NAME);
      state.fileName = false;
      return "filename";
    }
  }
  if (ch === ":") {
    stream.next();
    return "punctuation"; // STUB's colon: the file name still comes
  }
  state.fileName = false;
  if (ch === "=") {
    stream.next();
    return "operator";
  }
  if (ch === ",") {
    stream.next();
    return "separator";
  }
  if (stream.match(ORDINAL) || stream.match(NUMBER)) return "number";
  if (ch === ".") {
    if (definition && state.list !== "EXPORTS" && stream.match(SECTION_NAME)) return "section";
    stream.next();
    return "punctuation";
  }
  const match = stream.match(NAME) || stream.match(DIGIT_WORD);
  if (!match) {
    stream.next();
    return null;
  }
  return match[0] === "@" ? "operator" : word(match[0], state, definition);
}

export const moduleDefinitionParser = {
  name: "module-definition",
  startState,
  token,
  tokenTable,
  languageData: {
    commentTokens: { line: ";" }, // toggle-comment
    wordChars: "@$?", // decorated names, as MASM's identifiers
  },
};

export const moduleDefinitionLanguage = StreamLanguage.define(moduleDefinitionParser);

export function moduleDefinition() {
  return new LanguageSupport(moduleDefinitionLanguage);
}

export default moduleDefinition;

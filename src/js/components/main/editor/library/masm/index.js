// CodeMirror 6 language for MASM, built on the Lezer grammar vendored in this
// directory (parser.js / parser.terms.js generated from masm.grammar; tokens.js,
// keywords.js and mnemonics.js copied from masm-lezer-grammar - see
// Boxedwine/scripts/build-grammar.mjs, which prints the source commit).
//
// Highlighting maps the grammar's node names to STANDARD @lezer/highlight tags
// (highlight.js), so each theme's HighlightStyle colors MASM automatically.
import { parser } from "./parser.js";
import { LRLanguage, LanguageSupport } from "@codemirror/language";
import { masmHighlighting } from "./highlight.js";

export const masmLanguage = LRLanguage.define({
  name: "masm",
  parser: parser.configure({ props: [masmHighlighting] }),
  languageData: {
    // `;` line comments (syntax/operator-semicolon.md) - enables toggle-comment.
    commentTokens: { line: ";" },
    // MASM identifiers may contain @ $ ? (syntax/masm-bnf-grammar.md, alpha).
    wordChars: "@$?",
  },
});

export function masm() {
  return new LanguageSupport(masmLanguage);
}

export default masm;

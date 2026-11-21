// CodeMirror 6 language for MASM. parser.js/parser.terms.js are generated from masm.grammar; tokens.js,
// keywords.js and mnemonics.js come from masm-lezer-grammar (Boxedwine/scripts/build-grammar.mjs).
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

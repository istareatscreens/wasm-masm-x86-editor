// The words of a module-definition (.def) file, as Microsoft's reference gives them
// (https://learn.microsoft.com/en-us/cpp/build/reference/module-definition-dot-def-files and its pages; the reserved
// words as openspec/changes/implement-masm-file-linking/reference/def-vocabulary.py extracts them). Statements,
// attribute keywords and names are case sensitive, so every word here is upper case. scripts/module-definition.corpus.json
// holds the same lists, and the tests hold both apps' highlighters to it.

// the statements LINK documents (SEGMENTS is the synonym of SECTIONS)
export const STATEMENTS = ["EXPORTS", "HEAPSIZE", "LIBRARY", "NAME", "SECTIONS", "SEGMENTS", "STACKSIZE", "STUB", "VERSION"];

// the linker's reserved words, statements included: an argument may be one only in double quotation marks
export const RESERVED_WORDS = [
  "APPLOADER", "BASE", "CODE", "CONFORMING", "DATA", "DESCRIPTION", "DEV386", "DISCARDABLE", "DYNAMIC", "EXECUTE-ONLY",
  "EXECUTEONLY", "EXECUTEREAD", "EXETYPE", "EXPORTS", "FIXED", "FUNCTIONS", "HEAPSIZE", "IMPORTS", "IMPURE", "INCLUDE",
  "INITINSTANCE", "IOPL", "LIBRARY", "LOADONCALL", "LONGNAMES", "MOVABLE", "MOVEABLE", "MULTIPLE", "NAME", "NEWFILES",
  "NODATA", "NOIOPL", "NONAME", "NONCONFORMING", "NONDISCARDABLE", "NONE", "NONSHARED", "NOTWINDOWCOMPAT", "OBJECTS", "OLD",
  "PRELOAD", "PRIVATE", "PROTMODE", "PURE", "READONLY", "READWRITE", "REALMODE", "RESIDENT", "RESIDENTNAME", "SECTIONS",
  "SEGMENTS", "SHARED", "SINGLE", "STACKSIZE", "STUB", "VERSION", "WINDOWAPI", "WINDOWCOMPAT", "WINDOWS",
];

// in a SECTIONS definition, after the section's name: its access specifiers, and the CLASS keyword older versions took
export const SECTION_WORDS = ["CLASS", "EXECUTE", "READ", "SHARED", "WRITE"];

// the statements whose first argument names a file (STUB after its colon)
export const FILE_NAME_STATEMENTS = ["LIBRARY", "NAME", "STUB"];

// the statements followed by definitions, one a line, the first of them possibly on the statement's own line
export const LIST_STATEMENTS = ["EXPORTS", "SECTIONS", "SEGMENTS"];

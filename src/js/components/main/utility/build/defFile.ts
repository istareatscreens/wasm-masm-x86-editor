// Whether a module-definition file makes a DLL, as LINK decides it and the toolchain's JWlink (OPTION DEF) does: the
// first LIBRARY or NAME statement counts, and only LIBRARY with a name makes a DLL. Keywords are upper case; ";"
// starts a comment; the text is ANSI or UTF-8, or after a byte order mark UTF-8 or UTF-16.

function textOf(bytes: Uint8Array): string {
  if (bytes.length >= 2 && ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff))) {
    const big = bytes[0] === 0xfe;
    let text = "";
    for (let i = 2; i + 1 < bytes.length; i += 2) text += String.fromCharCode(big ? (bytes[i] << 8) | bytes[i + 1] : bytes[i] | (bytes[i + 1] << 8));
    return text;
  }
  const start = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
  let text = "";
  for (let i = start; i < bytes.length; i++) text += String.fromCharCode(bytes[i]);
  return text; // the keywords are ASCII: the rest of the bytes need no decoding here
}

// The words of a line split at white space (a quoted run kept whole), before its comment.
function words(line: string): string[] {
  const out: string[] = [];
  let word = "", quote = "";
  for (const c of line) {
    if (quote) {
      word += c;
      if (c === quote) quote = "";
    } else if (c === ";") break;
    else if (c === '"' || c === "'") {
      quote = c;
      word += c;
    } else if (c === " " || c === "\t" || c === "\r") {
      if (word) out.push(word);
      word = "";
    } else word += c;
  }
  if (word) out.push(word);
  return out;
}

export function makesDll(bytes: Uint8Array): boolean {
  return libraryName(bytes) !== null;
}

// The name a LIBRARY statement gives the DLL (unquoted, as its text holds it), or null when the file makes no DLL.
export function libraryName(bytes: Uint8Array): string | null {
  for (const line of textOf(bytes).split("\n")) {
    const w = words(line);
    if (w[0] === "LIBRARY") return w.length >= 2 ? w[1].replace(/^(["'])(.*)\1$/, "$2") : null;
    if (w[0] === "NAME") return null;
  }
  return null;
}

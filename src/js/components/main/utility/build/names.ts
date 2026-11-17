// Names as a MASM source spells them. The plan decides which files a program links by these names; the linker
// then checks the decorated ones, and reports a mismatch as it would for any program.

// The name a source declares for a linker name: _name (C), _name@N (STDCALL) and @name@N (fastcall) are name,
// another is itself. An __imp_ pointer and a C++ name name nothing a source declares by its plain name: null.
export function baseName(linkerName: string): string | null {
  if (/^__imp_/.test(linkerName) || linkerName.charAt(0) === "?") return null;
  const stdcall = /^[_@](.+)@\d+$/.exec(linkerName);
  if (stdcall) return stdcall[1];
  return linkerName.length > 1 && linkerName.charAt(0) === "_" ? linkerName.slice(1) : linkerName;
}

// The base names of a list of linker names, as a set.
export function baseNames(linkerNames: string[]): Set<string> {
  const names = new Set<string>();
  for (const name of linkerNames) {
    const base = baseName(name);
    if (base) names.add(base);
  }
  return names;
}

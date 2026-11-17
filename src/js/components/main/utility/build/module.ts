// One module as the assembler sees it: its source with every INCLUDE it reaches read in place, down to the END
// that ends it. What the module offers other modules (publics) and needs from them or from libraries
// (externals), spelled as its object file spells them (openspec change implement-masm-file-linking, design D1;
// measured with ML 14.44 in reference/masm-externals.py).
import { CaseMap, Statement, Visibility, sourceStatements } from "./sourceFile";
import { fileName } from "./fileNames";

export interface IncludeUse {
  file: string; // the drawer file the line is in
  line: number;
  argument: string;
}

export type IncludeTarget<T> = { target: T; path: string | null; text: string | null }; // path and text: a drawer file to read

export interface ModuleFacts<T> {
  includes: (IncludeUse & { target: T })[];
  includeLibs: IncludeUse[];
  entry: string | null | undefined; // END's label; null for END alone; undefined when the source has no END
  publics: string[];
  externals: string[];
}

// The source's own statements and the includes it reaches; `include` finds the file an INCLUDE names, for the
// files being included (the source first). `nameOf` reads a file name as the toolchain reads it (fileNames.ts).
export function moduleFacts<T>(source: string, text: string, include: (argument: string, includers: string[]) => IncludeTarget<T>,
  nameOf: (raw: string) => string = fileName): ModuleFacts<T> {
  const facts: ModuleFacts<T> = { includes: [], includeLibs: [], entry: undefined, publics: [], externals: [] };
  let caseMap: CaseMap = "notpublic";
  let procDefault: Visibility = "public";
  // keyed as the assembler matches names (with or without case), spelled as the object spells them
  const key = (name: string) => (caseMap === "none" ? name : name.toUpperCase());
  const spelled = (name: string) => (caseMap === "all" ? name.toUpperCase() : name);
  const defined = new Map<string, string>();
  const publicProcs = new Map<string, string>();
  const marked = new Map<string, string>(); // PUBLIC
  const protos = new Map<string, string>();
  const externDefs = new Map<string, string>();
  const externs = new Map<string, string>();
  const texts = new Map<string, string[]>();
  const macros = new Map<string, Statement[]>();
  const uses = new Set<string>();
  const remember = (map: Map<string, string>, name: string) => {
    if (!map.has(key(name))) map.set(key(name), spelled(name));
  };
  let ended = false;

  // a macro's body, where the macro is invoked: what it uses and declares (a template defines nothing)
  const invoked = (body: Statement[]) => {
    for (const statement of body) {
      if (statement.kind === "use") statement.names.forEach((name) => uses.add(key(name)));
      else if (statement.kind === "extern") remember(statement.def ? externDefs : externs, statement.name);
      else if (statement.kind === "proto") remember(protos, statement.name);
    }
  };

  const walk = (file: string, source: string, includers: string[]) => {
    for (const statement of sourceStatements(source)) {
      if (ended) return;
      switch (statement.kind) {
        case "include": {
          const argument = nameOf(statement.argument);
          const found = include(argument, includers);
          facts.includes.push({ file, line: statement.line, argument, target: found.target });
          // a file already being included would include itself without end: ML stops it too
          if (found.path !== null && found.text !== null && includers.indexOf(found.path) < 0) walk(found.path, found.text, includers.concat([found.path]));
          break;
        }
        case "includelib":
          facts.includeLibs.push({ file, line: statement.line, argument: nameOf(statement.argument) });
          break;
        case "casemap":
          caseMap = statement.mode;
          break;
        case "procDefault":
          procDefault = statement.visibility;
          break;
        case "proc":
          remember(defined, statement.name);
          if ((statement.visibility || procDefault) !== "private") remember(publicProcs, statement.name);
          break;
        case "define":
          remember(defined, statement.name);
          break;
        case "proto":
          remember(protos, statement.name);
          break;
        case "extern":
          remember(statement.def ? externDefs : externs, statement.name);
          break;
        case "public":
          remember(marked, statement.name);
          break;
        case "text":
          texts.set(key(statement.name), statement.uses);
          break;
        case "macro":
          macros.set(key(statement.name), statement.body);
          break;
        case "use":
          statement.names.forEach((name) => uses.add(key(name)));
          break;
        case "end":
          facts.entry = statement.entry;
          ended = true; // END ends the assembly, also in an included file
          return;
      }
    }
  };
  walk(source, text, [source]);

  // a macro or text macro used is expanded where it is used: what its text uses is used
  const expanded = new Set<string>();
  for (let more = true; more; ) {
    more = false;
    for (const name of Array.from(uses)) {
      if (expanded.has(name)) continue;
      const body = macros.get(name), textUses = texts.get(name);
      if (!body && !textUses) continue;
      expanded.add(name);
      if (body) invoked(body);
      if (textUses) textUses.forEach((used) => uses.add(key(used)));
      more = true;
    }
  }

  const publics = new Map(publicProcs);
  marked.forEach((name, k) => defined.has(k) && publics.set(k, defined.get(k) as string));
  externDefs.forEach((name, k) => defined.has(k) && publics.set(k, defined.get(k) as string));
  const externals = new Map(externs); // every EXTERN, used or not (as ML writes them)
  protos.forEach((name, k) => uses.has(k) && !defined.has(k) && !externals.has(k) && externals.set(k, name));
  externDefs.forEach((name, k) => uses.has(k) && !defined.has(k) && !externals.has(k) && externals.set(k, name));
  facts.publics = Array.from(publics.values());
  facts.externals = Array.from(externals.values());
  return facts;
}

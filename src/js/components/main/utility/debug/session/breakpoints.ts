// Each breakpoint is bound to addresses in the loaded modules, or is unverified with the reason. The debugger's
// own breakpoints (the entry point, a step's return address) are kept beside them; the engine gets the union.
import { Address, DataWatch, DebugEngine } from "../engine/engine";
import { resolveSymbol } from "../program/symbolLookup";
import { LoadedModule, Modules } from "./modules";

export interface BreakpointOptions {
  enabled?: boolean;
  condition?: string; // an expression, or changed(expression)
  hitCondition?: string; // "= 4", ">= 4", "% 4"
  logMessage?: string; // text with {expression} parts: printed, and the program does not stop
}

export interface Breakpoint {
  id: number;
  kind: "source" | "function" | "instruction";
  options: BreakpointOptions;
  verified: boolean;
  message: string; // why it is not verified
  source?: string; // the host's id of the file
  requestedLine?: number; // in the source as it was built
  line?: number; // where it landed
  name?: string;
  addresses: Address[];
  hits: number; // times reached with its condition true
  lastValue?: string; // changed(...): what the expression was at the previous hit
  hit?: { test: "=" | ">=" | "%"; count: number } | null;
}

export interface DataBreakpoint {
  id: number;
  address: Address;
  size: number;
  label: string; // what it watches, as the user named it
  verified: boolean;
  message: string;
}

export const MESSAGES = {
  notInProgram: "This file is not part of the program being debugged",
  noCodeAtLine: "No code at this line. Data, directives and a macro's body have none: a macro's code belongs to the lines that use it",
  noCodeAfterLine: "No code at or after this line",
  typedSinceBuild: "This line was added after the program was built",
  notLoaded: "Its DLL is not loaded yet",
  hitCount: "A hit count is written like '= 5', '>= 5' or '% 5'",
  dataLimit: "Up to four data breakpoints (an 8-byte one counts twice)",
  dataSize: "A data breakpoint watches 1, 2, 4 or 8 bytes",
};
const DATA_SLOTS = 4;

function counter(): () => number {
  let next = 1;
  return () => next++;
}

export function parseHitCondition(text: string | undefined): Breakpoint["hit"] | "invalid" {
  if (!text || !text.trim()) return null;
  const match = /^\s*(==?|>=|%)?\s*(\d+)\s*$/.exec(text);
  if (!match || !Number(match[2])) return "invalid";
  return { test: match[1] === ">=" ? ">=" : match[1] === "%" ? "%" : "=", count: Number(match[2]) };
}

export class Breakpoints {
  private source = new Map<string, Breakpoint[]>();
  private functions: Breakpoint[] = [];
  private instructions: Breakpoint[] = [];
  private data: DataBreakpoint[] = [];
  private internal = new Map<string, Address[]>();
  private sent = "";

  // `allocate` gives the next id: a front end that names breakpoints before a session exists shares its own.
  constructor(private readonly modules: Modules, private readonly allocate: () => number = counter()) {}

  all(): Breakpoint[] {
    let list: Breakpoint[] = [];
    this.source.forEach((entries) => (list = list.concat(entries)));
    return list.concat(this.functions, this.instructions);
  }

  dataBreakpoints(): DataBreakpoint[] {
    return this.data;
  }

  private make(kind: Breakpoint["kind"], options: BreakpointOptions, previous?: Breakpoint, id?: number): Breakpoint {
    const hit = parseHitCondition(options.hitCondition);
    const same = previous && previous.options.condition === options.condition && previous.options.hitCondition === options.hitCondition;
    return {
      id: id !== undefined ? id : previous ? previous.id : this.allocate(),
      kind,
      options,
      verified: false,
      message: hit === "invalid" ? MESSAGES.hitCount : "",
      addresses: [],
      hits: same ? previous.hits : 0,
      lastValue: same ? previous.lastValue : undefined,
      hit: hit === "invalid" ? null : hit,
    };
  }

  // One file's breakpoints, replacing those it had. A line of `null` was typed after the build.
  setSource(source: string, requests: (BreakpointOptions & { line: number | null; id?: number })[]): Breakpoint[] {
    const before = this.source.get(source) || [];
    const list = requests.map((request) => {
      const breakpoint = this.make("source", request, before.find((old) => old.requestedLine === request.line && request.line !== null), request.id);
      breakpoint.source = source;
      breakpoint.requestedLine = request.line === null ? undefined : request.line;
      this.bind(breakpoint);
      return breakpoint;
    });
    if (list.length) this.source.set(source, list);
    else this.source.delete(source);
    return list;
  }

  setFunctions(requests: (BreakpointOptions & { name: string; id?: number })[]): Breakpoint[] {
    this.functions = requests.map((request) => {
      const breakpoint = this.make("function", request, this.functions.find((old) => old.name === request.name), request.id);
      breakpoint.name = request.name;
      this.bind(breakpoint);
      return breakpoint;
    });
    return this.functions;
  }

  setInstructions(requests: (BreakpointOptions & { address: Address })[]): Breakpoint[] {
    this.instructions = requests.map((request) => {
      const breakpoint = this.make("instruction", request, this.instructions.find((old) => old.addresses[0] === request.address));
      breakpoint.addresses = [request.address >>> 0];
      breakpoint.verified = !breakpoint.message;
      return breakpoint;
    });
    return this.instructions;
  }

  setData(requests: { address: Address; size: number; label: string }[]): DataBreakpoint[] {
    let slots = 0;
    this.data = requests.map((request) => {
      const known = this.data.find((old) => old.address === request.address && old.size === request.size);
      const breakpoint: DataBreakpoint = { id: known ? known.id : this.allocate(), address: request.address >>> 0, size: request.size, label: request.label, verified: false, message: "" };
      const needs = request.size === 8 ? 2 : 1;
      if ([1, 2, 4, 8].indexOf(request.size) < 0) breakpoint.message = MESSAGES.dataSize;
      else if (slots + needs > DATA_SLOTS) breakpoint.message = MESSAGES.dataLimit;
      else {
        slots += needs;
        breakpoint.verified = true;
      }
      return breakpoint;
    });
    return this.data;
  }

  // Binds every breakpoint again: modules were loaded, or moved. Returns the ones that changed.
  rebind(): Breakpoint[] {
    const changed: Breakpoint[] = [];
    for (const breakpoint of this.all()) {
      if (breakpoint.kind === "instruction") continue;
      const before = breakpoint.verified + "|" + breakpoint.line + "|" + breakpoint.addresses.join(",") + "|" + breakpoint.message;
      this.bind(breakpoint);
      if (before !== breakpoint.verified + "|" + breakpoint.line + "|" + breakpoint.addresses.join(",") + "|" + breakpoint.message) changed.push(breakpoint);
    }
    return changed;
  }

  private bind(breakpoint: Breakpoint): void {
    const invalid = breakpoint.message === MESSAGES.hitCount;
    breakpoint.addresses = [];
    breakpoint.verified = false;
    breakpoint.line = breakpoint.requestedLine;
    if (invalid) return;
    breakpoint.message = breakpoint.kind === "source" ? this.bindLine(breakpoint) : this.bindName(breakpoint);
    breakpoint.verified = !breakpoint.message;
  }

  private own(): LoadedModule[] {
    return this.modules.list.filter((module) => module.program && module.program.lines);
  }

  private bindLine(breakpoint: Breakpoint): string {
    if (breakpoint.requestedLine === undefined) return MESSAGES.typedSinceBuild;
    const exact: Address[] = [];
    const moved: { line: number; addresses: Address[] }[] = [];
    let inProgram = false;
    let later = false;
    let waiting = false;
    for (const module of this.own()) {
      for (const file of module.sources.filesOf(breakpoint.source)) {
        inProgram = true;
        const bound = module.program.lines.bindLine(file, breakpoint.requestedLine);
        if (bound === "no-code-at-line") later = true;
        if (typeof bound === "string") continue;
        const addresses = this.placed(module, bound.statements.map((statement) => statement.rva));
        if (!addresses.length) {
          waiting = true;
          continue;
        }
        if (bound.line === breakpoint.requestedLine) exact.push(...addresses);
        else moved.push({ line: bound.line, addresses });
      }
    }
    if (!inProgram) return MESSAGES.notInProgram;
    if (exact.length) {
      breakpoint.addresses = exact;
      return "";
    }
    if (!moved.length) return waiting ? MESSAGES.notLoaded : later ? MESSAGES.noCodeAtLine : MESSAGES.noCodeAfterLine;
    breakpoint.line = Math.min.apply(null, moved.map((entry) => entry.line));
    for (const entry of moved) if (entry.line === breakpoint.line) breakpoint.addresses.push(...entry.addresses);
    return "";
  }

  private bindName(breakpoint: Breakpoint): string {
    const parts = /^\s*(?:([^!\s]+)\s*!\s*)?(\S+)\s*$/.exec(breakpoint.name || "");
    if (!parts) return "A breakpoint needs a procedure's or a label's name";
    const ambiguous: string[] = [];
    let found: { module: LoadedModule; rva: number; defined: boolean }[] = [];
    for (const module of this.own()) {
      const result = resolveSymbol(module.program.info, parts[2], null, parts[1]);
      if ("ambiguous" in result) ambiguous.push(...result.ambiguous);
      if (!("found" in result)) continue;
      if (result.found.kind === "data") return "'" + parts[2] + "' is data: use a data breakpoint to stop when it changes";
      found.push({ module, rva: result.found.rva, defined: result.found.kind !== "public" });
    }
    // a program that imports its own DLL's procedure has the name too, on the jump to it: that is not the procedure
    if (found.some((entry) => entry.defined)) found = found.filter((entry) => entry.defined);
    let waiting = false;
    for (const entry of found) {
      const addresses = this.placed(entry.module, [entry.rva]);
      if (!addresses.length) waiting = true;
      breakpoint.addresses.push(...addresses);
    }
    if (ambiguous.length) {
      breakpoint.addresses = [];
      return "'" + parts[2] + "' is in several modules (" + ambiguous.join(", ") + "): write " + ambiguous[0] + "!" + parts[2];
    }
    if (breakpoint.addresses.length) return "";
    return waiting ? MESSAGES.notLoaded : "No procedure or label named '" + (breakpoint.name || "").trim() + "'";
  }

  // A module's addresses, or none while another image is where it expects to load: every DLL built here asks
  // for the same base, and the loader moves all but one.
  private placed(module: LoadedModule, rvas: number[]): Address[] {
    const addresses: Address[] = [];
    for (const rva of rvas) {
      const address = this.modules.addressOf(module, rva);
      if (address !== null) addresses.push(address);
    }
    return addresses;
  }

  at(address: Address): Breakpoint[] {
    return this.all().filter((breakpoint) => breakpoint.verified && breakpoint.options.enabled !== false && breakpoint.addresses.indexOf(address) >= 0);
  }

  dataAt(address: Address, size: number): DataBreakpoint | null {
    return this.data.find((breakpoint) => breakpoint.verified && breakpoint.address === address && breakpoint.size === size) || null;
  }

  // The debugger's own breakpoints, by owner: an empty list removes them.
  setInternal(owner: string, addresses: Address[]): void {
    if (addresses.length) this.internal.set(owner, addresses.map((address) => address >>> 0));
    else this.internal.delete(owner);
  }

  isInternal(owner: string, address: Address): boolean {
    return (this.internal.get(owner) || []).indexOf(address) >= 0;
  }

  private addresses(): Address[] {
    const wanted = new Set<Address>();
    for (const breakpoint of this.all()) if (breakpoint.verified && breakpoint.options.enabled !== false) breakpoint.addresses.forEach((address) => wanted.add(address));
    this.internal.forEach((addresses) => addresses.forEach((address) => wanted.add(address)));
    return Array.from(wanted).sort((a, b) => a - b);
  }

  // Gives the engine what it does not have yet.
  async sync(engine: DebugEngine): Promise<void> {
    const addresses = this.addresses();
    const watches: DataWatch[] = this.data.filter((breakpoint) => breakpoint.verified).map((breakpoint) => ({ address: breakpoint.address, size: breakpoint.size }));
    const wanted = addresses.join(",") + "|" + watches.map((watch) => watch.address + ":" + watch.size).join(",");
    if (wanted === this.sent) return;
    const [breakpointsBefore, watchesBefore] = this.sent.split("|");
    this.sent = wanted;
    if (addresses.join(",") !== breakpointsBefore) await engine.setBreakpoints(addresses);
    if (wanted.split("|")[1] !== (watchesBefore || "")) await engine.setWatches(watches);
  }
}

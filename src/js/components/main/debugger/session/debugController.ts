// The page's debugger: the adapter, its DAP client, the view store and the UI's commands. It sees the program only
// through DAP.
import { DebugProtocol } from "@vscode/debugprotocol";
import { MasmDebugAdapter } from "../../utility/debug/adapter/masmDebugAdapter";
import { stateLine } from "../../utility/debug/report/failureReport";
import { fromStored, toStored } from "./breakpointModel";
import { BreakpointSync } from "./breakpointSync";
import { ConsoleLog } from "./consoleLog";
import { wireEvents } from "./controllerEvents";
import { DapClient, DapError } from "./dapClient";
import { MessageBox, WebDebugHost, WebHostOptions } from "./debugHost";
import { SectionState, readDebug, updateDebug } from "./debugStorage";
import { DebugSettings, DebugView, FrameView, Phase, Store } from "./debugStore";
import { IDLE_STATUS, LOST_TERMINAL, initialView, settingsOf } from "./initialView";
import { ViewData, showView } from "./viewData";

export interface ControllerHooks extends Pick<WebHostOptions, "openFile" | "showTerminal" | "showBox"> {
  follow(file: string): void; // open the file in the editor, without giving it the focus
  ask(box: MessageBox, choices: { label: string; onSelect?: () => void }[]): void;
  terminalDown(): boolean; // the terminal shows its own crash or freeze notice
}

export type StepCommand = "next" | "stepIn" | "stepOut";

export class DebugController {
  readonly host: WebDebugHost;
  readonly adapter: MasmDebugAdapter;
  readonly client: DapClient;
  readonly store: Store<DebugView>;
  readonly views = new ViewData();
  readonly console = new ConsoleLog();
  readonly breakpoints: BreakpointSync;
  runToAfterEntry: object | null = null; // Run to Cursor with no session: asked for once the program is at its entry
  endStatus: string | null = null; // what the status line says once the session is over
  quietEnd: string | null = null; // endQuietly's words, until the next start: they outlast a failed launch
  private launching = false; // a launch request is unanswered, which can outlast its session (outputs read late)
  private initialized: Promise<void> | null = null;
  private requests = 0;

  constructor(readonly hooks: ControllerHooks) {
    const record = readDebug();
    this.store = new Store<DebugView>(initialView(record));
    this.host = new WebDebugHost({ ...hooks, lastProgram: () => this.store.get().program, onProgram: (program) => this.store.set({ program }) });
    this.adapter = new MasmDebugAdapter(this.host);
    this.adapter.counting = record.counting;
    this.client = new DapClient(this.adapter);
    this.breakpoints = new BreakpointSync(this.client, this.store, (change) => void updateDebug(change));
    wireEvents(this);
  }

  // What the session was doing, for the terminal's crash report: empty with no session.
  crashContext(): string {
    const session = this.adapter.session;
    return session && session.state !== "ended" ? stateLine(this.adapter.reportContext()) : "";
  }

  get view(): DebugView {
    return this.store.get();
  }

  private phase(): Phase {
    return this.store.get().phase;
  }

  ready(): Promise<void> {
    if (!this.initialized) {
      this.initialized = (async () => {
        const capabilities = await this.client.request<DebugProtocol.Capabilities>("initialize", { adapterID: "masm", linesStartAt1: true, columnsStartAt1: true });
        const stored = readDebug().exceptions;
        this.store.set({
          exceptionFilters: (capabilities.exceptionBreakpointFilters || []).map((entry) => ({ filter: entry.filter, label: entry.label, description: entry.description || "", enabled: stored[entry.filter] === undefined ? entry.default !== false : stored[entry.filter] })),
        });
        await this.breakpoints.sendAll();
        await this.client.request("configurationDone");
      })();
    }
    return this.initialized;
  }

  // ---- a request the user asked for: its refusal goes to the status line ----

  private async command(command: string, args?: object): Promise<boolean> {
    try {
      await this.client.request(command, args);
      return true;
    } catch (error) {
      this.refused(error);
      return false;
    }
  }

  refused(error: unknown): void {
    if (!(error instanceof DapError)) throw error;
    // a failure of the debugger itself is told by its own notice (masm/failure)
    if (!error.url && error.message) this.store.set({ note: error.message });
  }

  private threadArgs(): { threadId: number } {
    const stop = this.view.stop;
    return { threadId: stop ? stop.threadId : this.view.threads.length ? this.view.threads[0].id : 1 };
  }

  // ---- starting and ending ----

  async start({ stopOnEntry = false, noDebug = false }: { stopOnEntry?: boolean; noDebug?: boolean } = {}): Promise<void> {
    if (this.view.phase !== "idle") return;
    this.endStatus = null;
    this.quietEnd = null;
    this.store.set({ phase: "launching", status: "Building", note: "", failure: null, stop: null, frames: [], waiting: false });
    this.launching = true;
    try {
      await this.ready();
      await this.client.request("launch", { stopOnEntry, noDebug });
      if (noDebug) this.store.set({ phase: "idle", status: IDLE_STATUS });
      else if (this.phase() === "launching") this.store.set({ status: "Starting" });
    } catch (error) {
      this.runToAfterEntry = null;
      const refusal = error instanceof DapError ? error : null;
      // a refusal the host told in its own message box (showUser false) leaves nothing more to say
      // an ending the user asked for (a reset, Debug switched off) says so, whatever the launch reported
      this.store.set({ phase: "idle", status: this.quietEnd || (!refusal ? IDLE_STATUS : refusal.url ? "The debugger stopped" : (refusal.showUser && refusal.message) || IDLE_STATUS) });
      if (!refusal) throw error;
    } finally {
      this.launching = false;
    }
  }

  // F5, and the banner's RUN: start, or go on
  go(): Promise<unknown> {
    if (this.view.phase === "idle") return this.start();
    if (this.view.phase === "stopped") return this.command("continue", this.threadArgs());
    return Promise.resolve();
  }

  // Stop Debugging: the program ends at once, even while it is stopped.
  stop(): Promise<boolean> {
    return this.view.phase === "idle" ? Promise.resolve(true) : this.command("terminate");
  }

  // with no session there is nothing to restart, as in Visual Studio (Go starts one)
  async restart(): Promise<void> {
    if (this.view.phase === "idle") return;
    this.store.set({ phase: "launching", status: "Building", note: "", stop: null, frames: [], waiting: false });
    await this.command("restart");
  }

  // The user ended the session some other way (terminal reset, Debug switched off): a status line, no notice.
  async endQuietly(message: string): Promise<void> {
    if (this.view.phase === "idle" && !this.launching) return;
    this.endStatus = message;
    this.quietEnd = message;
    this.host.cancelBuild(message);
    await this.client.ask("disconnect", { terminateDebuggee: true });
    this.store.set({ failure: null });
  }

  // The terminal crashed and says so: the session is over, with no notice of the debugger's own.
  terminalLost(): Promise<void> {
    return this.endQuietly(LOST_TERMINAL);
  }

  // ---- running ----

  step(command: StepCommand): Promise<unknown> {
    if (this.view.phase === "idle") return this.start({ stopOnEntry: true }); // F10 and F11 start at the first statement
    return this.command(command, { ...this.threadArgs(), granularity: this.view.settings.instructionStepping ? "instruction" : "line" });
  }

  stepBack(): Promise<boolean> {
    return this.command("stepBack", this.threadArgs());
  }

  pause(): Promise<boolean> {
    return this.command("pause", this.threadArgs());
  }

  // Run to Cursor: to a line of a file, or to an address of the disassembly. With no session the program starts.
  async runTo(target: { file: string; line: number } | { address: string }): Promise<void> {
    const args = "file" in target ? { source: { path: target.file }, line: target.line } : { instructionReference: target.address };
    if (this.view.phase === "idle") {
      this.runToAfterEntry = args;
      return this.start({ stopOnEntry: true });
    }
    await this.command("masm/runTo", args);
  }

  // Set Next Statement. A line outside the current procedure is asked about first: the stack stays as it is.
  async setNext(file: string, line: number): Promise<void> {
    let targets: DebugProtocol.GotoTarget[];
    try {
      targets = (await this.client.request<DebugProtocol.GotoTargetsResponse["body"]>("gotoTargets", { source: { path: file, name: file.replace(/^.*\//, "") }, line })).targets;
    } catch (error) {
      return this.refused(error);
    }
    const target = targets[0];
    const move = (): void => {
      void this.command("goto", { ...this.threadArgs(), targetId: target.id });
    };
    if (!/outside the current procedure/.test(target.label)) return move();
    this.hooks.ask(
      { title: "Set Next Statement", icon: "question", message: ["Line " + target.line + " is outside the procedure the program is in.", "The registers and the stack stay as they are, so the program may not run correctly from there. Set the next statement anyway?"] },
      [{ label: "Yes", onSelect: move }, { label: "No" }],
    );
  }

  animate(on: boolean): Promise<boolean> {
    if (!on) return this.command("masm/stopAnimating");
    return this.command("masm/animate", { speed: this.view.settings.animateSpeed, granularity: this.view.settings.instructionStepping ? "instruction" : "line", into: true });
  }

  // ---- what the views look at ----

  // Draws the change, what `then` sets, and the open sections' rows for it as one update (viewData.ts).
  update(change: Partial<DebugView> | ((view: DebugView) => Partial<DebugView>), then?: () => Promise<void>): Promise<void> {
    return showView(this.store, this.views, change, then);
  }

  selectFrame(id: number): void {
    const frame = this.view.frames.filter((entry) => entry.id === id)[0];
    if (!frame) return;
    void this.update((view) => ({ frame: id, version: view.version + 1 }));
    this.showFrame(frame);
  }

  // The editor opens the frame's file and centres its line; the keyboard focus stays where it is.
  showFrame(frame: FrameView): void {
    if (!frame.file) return;
    this.store.set({ shown: { file: frame.file, line: frame.line, request: ++this.requests } });
    this.hooks.follow(frame.file);
  }

  // Show Next Statement: back to the innermost frame, and to the first line the program's own code is at.
  showNext(): void {
    const frames = this.view.frames;
    if (!frames.length) return;
    void this.update((view) => ({ frame: 1, version: view.frame === 1 ? view.version : view.version + 1 }));
    const own = frames.filter((frame) => frame.file)[0];
    if (own) this.showFrame(own);
  }

  showLine(file: string, line: number): void {
    this.store.set({ shown: { file, line, request: ++this.requests } });
    this.hooks.follow(file);
  }

  openProperties(file: string, line: number): void {
    if (!(this.view.breakpoints[file] || []).some((breakpoint) => breakpoint.line === line)) this.breakpoints.toggle(file, line);
    const breakpoint = (this.view.breakpoints[file] || []).filter((entry) => entry.line === line)[0];
    if (breakpoint) this.store.set({ properties: { file, key: breakpoint.key } });
  }

  // asked first, as Visual Studio asks: removed breakpoints cannot be brought back
  removeAllBreakpoints(): void {
    const count = this.breakpoints.count();
    if (!count) return;
    this.hooks.ask(
      { title: "Remove All Breakpoints", icon: "question", message: [count === 1 ? "Remove the breakpoint?" : "Remove all " + count + " breakpoints?"] },
      [{ label: "Yes", onSelect: () => this.breakpoints.removeAll() }, { label: "No" }],
    );
  }

  // The Console's line, and QuickWatch: an expression or an assignment, with its answer under it.
  async evaluateInConsole(expression: string): Promise<void> {
    this.setSection("console", { open: true });
    this.console.add("input", expression);
    const answer = await this.client.ask<DebugProtocol.EvaluateResponse["body"]>("evaluate", { expression, frameId: this.view.frame, context: "repl", format: { hex: this.view.settings.hex } });
    if ("refused" in answer) return this.console.add("error", answer.refused);
    this.console.add("result", answer.body.result);
    const { result, ...rest } = answer.body;
    this.store.set({ consoleResult: { variable: { ...rest, name: expression, value: result, evaluateName: expression }, stale: false } });
  }

  // "Break When Value Changes" on a row: a data breakpoint on the value's own bytes.
  async breakOnChange(variable: { name: string; evaluateName?: string }, parentReference: number): Promise<void> {
    const args = parentReference ? { variablesReference: parentReference, name: variable.name } : { name: variable.evaluateName || variable.name, frameId: this.view.frame };
    const info = await this.client.ask<DebugProtocol.DataBreakpointInfoResponse["body"]>("dataBreakpointInfo", args);
    if ("refused" in info) return this.store.set({ note: info.refused });
    if (!info.body.dataId) return this.store.set({ note: info.body.description });
    await this.breakpoints.addData(info.body.dataId, info.body.description);
    this.setSection("breakpoints", { open: true });
  }

  viewMemory(address: string): void {
    this.setSection("memory", { open: true });
    this.store.set({ memoryAt: { address, request: ++this.requests } });
  }

  // ---- what is kept ----

  private keep(change: Partial<DebugSettings>): void {
    this.store.set((view) => ({ settings: { ...view.settings, ...change } }));
    updateDebug((record) => ({ ...record, ...change }));
  }

  setSection(id: string, change: Partial<SectionState>): void {
    const before = this.view.settings.sections[id];
    if (!before || Object.keys(change).every((key) => (before as any)[key] === (change as any)[key])) return;
    this.store.set((view) => ({ settings: { ...view.settings, sections: { ...view.settings.sections, [id]: { ...before, ...change } } } }));
    updateDebug((record) => ({ ...record, sections: { ...record.sections, [id]: { ...record.sections[id], ...change } } }));
  }

  setHex(hex: boolean): void {
    updateDebug((record) => ({ ...record, hex }));
    void this.update((view) => ({ settings: { ...view.settings, hex }, version: view.version + 1 }));
  }

  setInstructionStepping(instructionStepping: boolean): void {
    this.keep({ instructionStepping });
  }

  setAnimateSpeed(animateSpeed: number): void {
    this.keep({ animateSpeed });
  }

  setMemoryFollow(memoryFollow: string): void {
    this.keep({ memoryFollow });
  }

  async setCounting(counting: boolean): Promise<void> {
    this.keep({ counting });
    const answer = await this.client.ask("masm/setCounting", { on: counting });
    if ("refused" in answer) this.store.set({ note: answer.refused });
  }

  setWatches(watches: string[]): void {
    this.keep({ watches: watches.map((entry) => entry.trim()).filter((entry) => entry) });
  }

  removeAllWatches(): void {
    const count = this.view.settings.watches.length;
    if (!count) return;
    this.hooks.ask(
      { title: "Remove All Watches", icon: "question", message: [count === 1 ? "Remove the watch?" : "Remove all " + count + " watches?"] },
      [{ label: "Yes", onSelect: () => this.setWatches([]) }, { label: "No" }],
    );
  }

  // another tab changed what is kept: this tab shows it, and tells the adapter
  rereadStored(): void {
    const record = readDebug();
    const view = this.view;
    const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
    if (!same(settingsOf(record), view.settings)) this.store.set({ settings: settingsOf(record) });
    // a session's breakpoints stay as it bound them
    if (view.phase !== "idle") return;
    const names = view.functionBreakpoints.map(({ name, enabled }) => ({ name, enabled }));
    if (same(record.breakpoints, toStored(view.breakpoints)) && same(record.functionBreakpoints, names)) return;
    this.store.set({ breakpoints: fromStored(record.breakpoints), functionBreakpoints: record.functionBreakpoints.map((entry, i) => ({ ...entry, key: -1 - i })) });
    if (this.initialized) void this.breakpoints.sendAll();
  }
}

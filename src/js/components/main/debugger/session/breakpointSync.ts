// Every kind of breakpoint, kept in the store and sent to the adapter. Line and name breakpoints and the exception
// filters are kept between sessions; instruction and data breakpoints last one session.
import { DebugProtocol } from "@vscode/debugprotocol";
import { BreakpointProperties, applied, changed, moved, newKey, requestOf, toStored, toggled, unbound, withEnabled, withProperties } from "./breakpointModel";
import { DapClient } from "./dapClient";
import { DebugStored, dropBreakpoints, rekeyBreakpoints } from "./debugStorage";
import { BreakpointView, DebugView, FunctionBreakpointView, Store } from "./debugStore";

type Save = (change: (record: DebugStored) => DebugStored) => void;

export class BreakpointSync {
  constructor(private readonly client: DapClient, private readonly store: Store<DebugView>, private readonly save: Save) {}

  private live(): boolean {
    return this.store.get().phase !== "idle";
  }

  // ---- by line ----

  private setList(file: string, list: BreakpointView[]): void {
    const breakpoints = { ...this.store.get().breakpoints };
    if (list.length) breakpoints[file] = list;
    else delete breakpoints[file];
    this.store.set({ breakpoints });
  }

  private listOf(file: string): BreakpointView[] {
    return this.store.get().breakpoints[file] || [];
  }

  async sendFile(file: string): Promise<void> {
    const { sent, breakpoints } = requestOf(this.listOf(file));
    const answer = await this.client.ask<DebugProtocol.SetBreakpointsResponse["body"]>("setBreakpoints", { source: { path: file }, breakpoints });
    if ("body" in answer) this.setList(file, applied(this.listOf(file), sent, answer.body.breakpoints, this.live()));
  }

  private change(file: string, list: BreakpointView[]): void {
    this.setList(file, list);
    this.save((record) => {
      const breakpoints = { ...record.breakpoints };
      const stored = toStored({ [file]: list })[file];
      if (stored) breakpoints[file] = stored;
      else delete breakpoints[file];
      return { ...record, breakpoints };
    });
    void this.sendFile(file);
  }

  toggle(file: string, line: number): void {
    this.change(file, toggled(this.listOf(file), line));
  }

  enable(file: string, line: number, enabled?: boolean): void {
    this.change(file, withEnabled(this.listOf(file), line, enabled));
  }

  setProperties(file: string, key: number, properties: BreakpointProperties): void {
    this.change(file, withProperties(this.listOf(file), key, properties));
  }

  remove(file: string, key: number): void {
    this.change(file, this.listOf(file).filter((breakpoint) => breakpoint.key !== key));
  }

  // The editor moved the marks, or removed some with their lines. Moved ones are not sent again: the adapter maps
  // lines through the same edits.
  movedInEditor(file: string, lines: { [key: number]: number }, removed: number[]): void {
    if (removed.length) return this.change(file, moved(this.listOf(file).filter((breakpoint) => removed.indexOf(breakpoint.key) < 0), lines));
    const list = moved(this.listOf(file), lines);
    this.setList(file, list);
    this.save((record) => ({ ...record, breakpoints: { ...record.breakpoints, ...toStored({ [file]: list }) } }));
  }

  // Files renamed or moved in the drawer take their breakpoints along; deleted files take theirs with them.
  relocate(rename: (path: string) => string | null, gone: (path: string) => boolean): void {
    const before = this.store.get().breakpoints;
    const after: { [file: string]: BreakpointView[] } = {};
    const touched: string[] = [];
    for (const file of Object.keys(before)) {
      const to = gone(file) ? null : rename(file) || file;
      if (to !== null) after[to] = before[file];
      if (to !== file) touched.push(file, ...(to === null ? [] : [to]));
    }
    if (!touched.length) return;
    this.store.set({ breakpoints: after });
    this.save((record) => rekeyBreakpoints(dropBreakpoints(record, gone), rename));
    for (const file of touched) void this.sendFile(file);
  }

  // every file's breakpoints again: a new adapter, or another tab's changes
  async sendAll(): Promise<void> {
    for (const file of Object.keys(this.store.get().breakpoints)) await this.sendFile(file);
    await this.sendFunctions();
    await this.sendExceptions();
  }

  // the adapter bound a breakpoint, or moved it
  onChanged(breakpoint: DebugProtocol.Breakpoint): void {
    const file = breakpoint.source && breakpoint.source.path;
    if (file) return this.setList(file, changed(this.listOf(file), breakpoint));
    const view = this.store.get();
    this.store.set({ functionBreakpoints: view.functionBreakpoints.map((entry) => (entry.id === breakpoint.id ? { ...entry, verified: breakpoint.verified, message: breakpoint.message } : entry)) });
  }

  // ---- by name ----

  private async sendFunctions(): Promise<void> {
    const sent = this.store.get().functionBreakpoints.filter((entry) => entry.enabled);
    const answer = await this.client.ask<DebugProtocol.SetFunctionBreakpointsResponse["body"]>("setFunctionBreakpoints", { breakpoints: sent.map((entry) => ({ name: entry.name })) });
    if (!("body" in answer)) return;
    const live = this.live();
    const keys = sent.map((entry) => entry.key);
    this.store.set((view) => ({
      functionBreakpoints: view.functionBreakpoints.map((entry) => {
        const bound = answer.body.breakpoints[keys.indexOf(entry.key)];
        return bound ? { ...entry, id: bound.id, verified: live ? bound.verified : undefined, message: live ? bound.message : undefined } : { ...entry, id: undefined, verified: undefined, message: undefined };
      }),
    }));
  }

  private changeFunctions(list: DebugView["functionBreakpoints"]): void {
    this.store.set({ functionBreakpoints: list });
    this.save((record) => ({ ...record, functionBreakpoints: list.map(({ name, enabled }) => ({ name, enabled })) }));
    void this.sendFunctions();
  }

  addFunction(name: string): void {
    const list = this.store.get().functionBreakpoints;
    if (!name.trim() || list.some((entry) => entry.name.toLowerCase() === name.trim().toLowerCase())) return;
    this.changeFunctions(list.concat({ key: newKey(), name: name.trim(), enabled: true }));
  }

  enableFunction(key: number, enabled: boolean): void {
    this.changeFunctions(this.store.get().functionBreakpoints.map((entry) => (entry.key === key ? { ...entry, enabled } : entry)));
  }

  removeFunction(key: number): void {
    this.changeFunctions(this.store.get().functionBreakpoints.filter((entry) => entry.key !== key));
  }

  // ---- on data, and by address: while a session lasts ----

  private async sendData(list: DebugView["dataBreakpoints"]): Promise<void> {
    const answer = await this.client.ask<DebugProtocol.SetDataBreakpointsResponse["body"]>("setDataBreakpoints", { breakpoints: list.map((entry) => ({ dataId: entry.dataId })) });
    if ("body" in answer) this.store.set({ dataBreakpoints: list.map((entry, i) => ({ ...entry, verified: answer.body.breakpoints[i].verified, message: answer.body.breakpoints[i].message })) });
  }

  addData(dataId: string, label: string): Promise<void> {
    const list = this.store.get().dataBreakpoints;
    if (list.some((entry) => entry.dataId === dataId)) return Promise.resolve();
    return this.sendData(list.concat({ key: newKey(), dataId, label }));
  }

  removeData(key: number): Promise<void> {
    return this.sendData(this.store.get().dataBreakpoints.filter((entry) => entry.key !== key));
  }

  private async sendInstructions(list: DebugView["instructionBreakpoints"]): Promise<void> {
    const answer = await this.client.ask<DebugProtocol.SetInstructionBreakpointsResponse["body"]>("setInstructionBreakpoints", { breakpoints: list.map((entry) => ({ instructionReference: entry.address })) });
    if ("body" in answer) this.store.set({ instructionBreakpoints: list.map((entry, i) => ({ ...entry, verified: answer.body.breakpoints[i].verified })) });
  }

  toggleInstruction(address: string): Promise<void> {
    const before = this.store.get().instructionBreakpoints;
    return this.sendInstructions(before.some((entry) => entry.address === address) ? before.filter((entry) => entry.address !== address) : before.concat({ key: newKey(), address }));
  }

  // ---- all at once: one store update, one stored write, one request per file and kind ----

  count(): number {
    const view = this.store.get();
    const lines = Object.keys(view.breakpoints).reduce((sum, file) => sum + view.breakpoints[file].length, 0);
    return lines + view.functionBreakpoints.length + view.dataBreakpoints.length + view.instructionBreakpoints.length;
  }

  removeAll(): void {
    const view = this.store.get();
    const files = Object.keys(view.breakpoints);
    this.store.set({ breakpoints: {}, functionBreakpoints: [], dataBreakpoints: [], instructionBreakpoints: [] });
    this.save((record) => ({ ...record, breakpoints: {}, functionBreakpoints: [] }));
    for (const file of files) void this.sendFile(file);
    if (view.functionBreakpoints.length) void this.sendFunctions();
    if (view.dataBreakpoints.length) void this.sendData([]);
    if (view.instructionBreakpoints.length) void this.sendInstructions([]);
  }

  // ticks or unticks every breakpoint that has a tick box: by line and by name
  enableAll(enabled: boolean): void {
    const view = this.store.get();
    const breakpoints: { [file: string]: BreakpointView[] } = {};
    for (const file of Object.keys(view.breakpoints)) breakpoints[file] = view.breakpoints[file].map((breakpoint) => ({ ...breakpoint, enabled }));
    const functionBreakpoints = view.functionBreakpoints.map((entry) => ({ ...entry, enabled }));
    this.store.set({ breakpoints, functionBreakpoints });
    this.save((record) => ({ ...record, breakpoints: { ...record.breakpoints, ...toStored(breakpoints) }, functionBreakpoints: functionBreakpoints.map(({ name, enabled }) => ({ name, enabled })) }));
    for (const file of Object.keys(breakpoints)) void this.sendFile(file);
    if (functionBreakpoints.length) void this.sendFunctions();
  }

  // ---- exceptions ----

  private async sendExceptions(): Promise<void> {
    await this.client.ask("setExceptionBreakpoints", { filters: this.store.get().exceptionFilters.filter((entry) => entry.enabled).map((entry) => entry.filter) });
  }

  setFilter(filter: string, enabled: boolean): void {
    this.store.set((view) => ({ exceptionFilters: view.exceptionFilters.map((entry) => (entry.filter === filter ? { ...entry, enabled } : entry)) }));
    this.save((record) => ({ ...record, exceptions: { ...record.exceptions, [filter]: enabled } }));
    void this.sendExceptions();
  }

  setFilters(enabled: boolean): void {
    const filters = this.store.get().exceptionFilters;
    this.store.set({ exceptionFilters: filters.map((entry) => ({ ...entry, enabled })) });
    this.save((record) => {
      const exceptions = { ...record.exceptions };
      for (const entry of filters) exceptions[entry.filter] = enabled;
      return { ...record, exceptions };
    });
    void this.sendExceptions();
  }

  // ---- a session's end ----

  sessionEnded(): void {
    const view = this.store.get();
    const breakpoints: { [file: string]: BreakpointView[] } = {};
    for (const file of Object.keys(view.breakpoints)) breakpoints[file] = unbound(view.breakpoints[file]);
    this.store.set({
      breakpoints,
      functionBreakpoints: view.functionBreakpoints.map((entry): FunctionBreakpointView => ({ ...entry, verified: undefined, message: undefined })),
      dataBreakpoints: [],
      instructionBreakpoints: [],
    });
  }
}

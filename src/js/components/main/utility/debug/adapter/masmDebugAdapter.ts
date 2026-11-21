// The web app's sidebar and VS Code both talk to this adapter and to nothing else.
import { DebugProtocol } from "@vscode/debugprotocol";
import { Decoder } from "../disasm/decoder";
import { DebugEngine, Disposable, EngineRefusal } from "../engine/engine";
import { Expressions } from "../evaluate/expressions";
import { ExpressionError } from "../evaluate/lexer";
import { ValueError, ValueFormat } from "../inspect/values";
import { ProgramCache } from "../program/programCache";
import { DebugFailure, failureOf } from "../report/failure";
import { ReportContext, reportLink } from "../report/failureReport";
import { RequestLog } from "../report/requestLog";
import { Animator } from "../session/animate";
import { DebugSession, SessionError } from "../session/debugSession";
import { CodeLocation } from "../session/modules";
import { Frame } from "../session/stackWalker";
import { DebugHost } from "./host";
import { HANDLERS } from "./handlers/index";
import { References } from "./references";
import { NO_SESSION, RUNNING, RequestError, StoredBreakpoints } from "./shared";

export class MasmDebugAdapter {
  session: DebugSession | null = null;
  engine: DebugEngine | null = null;
  animator: Animator | null = null;
  launchArguments: any = null;
  counting = false; // the user's "Count instructions", kept across sessions
  readonly references = new References();
  readonly stored: StoredBreakpoints = { source: new Map(), functions: [], exceptionFilters: null };
  readonly log = new RequestLog();
  readonly cache = new ProgramCache();
  private decoded: Decoder | null = null;
  private lastBreakpointId = 0;
  private listeners: ((event: DebugProtocol.Event) => void)[] = [];
  private sequence = 1;

  constructor(readonly host: DebugHost) {}

  onEvent(listener: (event: DebugProtocol.Event) => void): Disposable {
    this.listeners.push(listener);
    return { dispose: () => (this.listeners = this.listeners.filter((entry) => entry !== listener)) };
  }

  emit(event: string, body?: object): void {
    const message: DebugProtocol.Event = { seq: this.sequence++, type: "event", event, body };
    for (const listener of this.listeners.slice()) listener(message);
  }

  now(): number {
    return this.host.now ? this.host.now() : Date.now();
  }

  // Breakpoint ids are the adapter's, so that one set before a session keeps its id when a session binds it.
  readonly nextBreakpointId = (): number => ++this.lastBreakpointId;

  // Never throws: a request that cannot be served is answered with why.
  async handle(request: DebugProtocol.Request): Promise<DebugProtocol.Response> {
    const response: DebugProtocol.Response = { seq: 0, type: "response", request_seq: request.seq, command: request.command, success: true };
    const started = this.now();
    this.log.begin(request.command);
    try {
      const handler = HANDLERS[request.command];
      if (!handler) throw new RequestError("The debugger does not know the request '" + request.command + "'");
      response.body = (await handler(this, request.arguments || {})) || undefined;
      this.log.end(request.command, "ok", this.now() - started);
    } catch (error) {
      response.success = false;
      const refusal = this.refusalOf(error);
      if (refusal !== null) {
        this.log.end(request.command, "refused", this.now() - started);
        response.message = refusal;
        response.body = { error: { id: 1, format: refusal, showUser: !(error instanceof RequestError && error.quiet) } };
      } else {
        const failure = failureOf(error);
        const url = this.reportUrl(failure);
        this.log.end(request.command, "failed", this.now() - started);
        response.message = failure.message;
        response.body = { error: { id: 2, format: failure.message, showUser: true, url, urlLabel: "Report bug" } };
        await this.failed(failure, url);
      }
    }
    response.seq = this.sequence++;
    return response;
  }

  // what to tell the user when the request simply cannot be done now; null for a failure of the debugger
  private refusalOf(error: unknown): string | null {
    if (error instanceof RequestError || error instanceof ValueError || error instanceof SessionError || error instanceof ExpressionError) return error.message;
    if (error instanceof EngineRefusal) return error.reason === "not-stopped" ? RUNNING : error.reason === "not-attached" ? "The program has ended" : null;
    return null;
  }

  reportContext(): ReportContext {
    const main = this.session && this.session.modules.main;
    const info = main && main.program && main.program.info;
    return {
      state: this.session ? this.session.state : "no session",
      engine: this.engine ? this.engine.describe() : "none",
      requests: this.log.list(),
      inFlight: this.log.inFlight,
      program: info ? [info.modules.length + " modules, " + info.image.sizeOfImage + " bytes of image" + (this.session.modules.list.filter((module) => module.own).length > 1 ? ", with a DLL of its own" : "")] : [],
      environment: this.host.environment(),
    };
  }

  reportUrl(failure: DebugFailure): string {
    return reportLink((title, body) => this.host.issueUrl(title, body), failure, this.reportContext());
  }

  // A failure of the debugger itself: the front end is told, with the report ready, and the session ends.
  async failed(failure: DebugFailure, url = this.reportUrl(failure)): Promise<void> {
    this.emit("masm/failure", { kind: failure.kind, message: failure.message, url, urlLabel: "Report bug", fatal: true });
    const session = this.session;
    if (session && session.state !== "ended") await session.disconnect().catch((): void => undefined);
  }

  // ---- what the handlers share ----

  need(): DebugSession {
    if (!this.session || this.session.state === "ended") throw new RequestError(NO_SESSION);
    return this.session;
  }

  stopped(): DebugSession {
    const session = this.need();
    if (session.state !== "stopped") throw new RequestError(session.state === "starting" ? "The program has not started yet" : RUNNING);
    return session;
  }

  async decoder(): Promise<Decoder> {
    if (!this.decoded) this.decoded = new Decoder(await this.host.decoder());
    return this.decoded;
  }

  // Frame ids are the frames' places in the call stack, from 1. No id means the innermost frame.
  async frame(frameId: number | undefined): Promise<Frame> {
    const stack = await this.stopped().callStack();
    const frame = stack.frames[(frameId || 1) - 1];
    if (!frame) throw new RequestError("That frame is gone: the program has run since");
    return frame;
  }

  async expressions(frameId: number | undefined): Promise<Expressions> {
    const session = this.stopped();
    const frame = frameId && frameId > 1 ? await this.frame(frameId) : null;
    return new Expressions({ target: session.target(), frame, modules: session.modules, counting: session.counting, constantNamed: this.host.constantNamed ? (name) => this.host.constantNamed(name) : undefined });
  }

  formatOf(args: { format?: DebugProtocol.ValueFormat }): ValueFormat {
    return { hex: !!(args.format && args.format.hex) };
  }

  sourceAt(location: CodeLocation | null): { source: DebugProtocol.Source; line: number } | null {
    if (!location || !location.statement || !location.module.sources) return null;
    const source = location.module.sources.sourceOf(location.statement.file);
    if (!source) return null;
    const line = this.host.lineMapper.toCurrent(source.id, location.statement.line);
    return { source: { name: source.name, path: source.id }, line: line === null ? location.statement.line : line };
  }
}

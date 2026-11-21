// The app's DebugHost: RUN's build with debug information, the emulator engine, the drawer's files, bug reports.
import { buildRequest, BuildRequest } from "../../banner/build/buildRequest";
import { TITLE, base64Of, isAsm, messageOf, prepareBuild } from "../../banner/build/buildSteps.js";
import { emulatorPageInfo } from "../../cmd/emulatorPage";
import { environmentLines, invalidOpcodeIssue, issueUrl } from "../../crash/bugReport";
import { InvalidOpcode } from "../../crash/invalidOpcode";
import { loadX86Decoder } from "../../crash/x86Decoder";
import { planFile } from "../../utility/build/BuildService";
import { Plan } from "../../utility/build/plan";
import { DebugHost, LaunchPlan, ReadyPlan } from "../../utility/debug/adapter/host";
import { BUILD_FAILED } from "../../utility/debug/adapter/handlers/lifecycle";
import { DebugEngine } from "../../utility/debug/engine/engine";
import { EmulatorEngine } from "../../utility/debug/engine/emulator/emulatorEngine";
import { BRIDGE_PROTOCOL } from "../../utility/debug/engine/emulator/protocol";
import { guestPath, outputPath } from "../../utility/filesystem/paths";
import { buildPlanInEmulator, getBwApp } from "../../../../utility/utilityFunctions";
import { EmulatorTransport, connectEmulator } from "./emulatorTransport";
import { LineMaps } from "./lineMaps";
import { drawerSources } from "./sourceFiles";

export const NOT_AVAILABLE = "Debugging is not available in this terminal. Reload the page to update it.";
export const NOT_READY = "The terminal is still starting. Try again when it shows its prompt.";
const NO_PROGRAM = "Open the program's .asm file to debug it.";
const WAIT_MARGIN_MS = 3000;

export interface MessageBox {
  title: string;
  icon: "warning" | "information" | "error" | "question";
  message: string[];
  details?: string[];
}

export interface WebHostOptions {
  openFile(): string; // the file the editor shows
  lastProgram(): string | null; // the program last debugged in this tab
  onProgram(program: string): void;
  showTerminal(focus: boolean): void;
  showBox(box: MessageBox): void;
}

// what a plan hands its build: the request, with the files as they were read when the plan was made
interface Token {
  request: BuildRequest;
}

type BuildOutcome = { ok: boolean; message?: string };

// The build's outcome, as the emulator page reports it once the outputs are read back; `cancel` ends the wait.
function buildOutcome(request: BuildRequest): { outcome: Promise<BuildOutcome>; cancel(message: string): void } {
  const name = request.waitFor.replace(/\.[^./]*$/, "");
  let finish = (_: BuildOutcome): void => undefined;
  const outcome = new Promise<BuildOutcome>((resolve) => {
    const done = (result: BuildOutcome) => {
      clearTimeout(timer);
      window.removeEventListener("build-outputs", onOutputs);
      window.removeEventListener("run-refused", onRefused);
      resolve(result);
    };
    finish = done;
    const onOutputs = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      if (detail.name === name) done({ ok: !!detail.ok });
    };
    const onRefused = () => done({ ok: false, message: "Nothing was built: the file's drive has no letter in the terminal" });
    const timer = setTimeout(() => done({ ok: false, message: "The build did not finish" }), request.ceilingMs + WAIT_MARGIN_MS);
    window.addEventListener("build-outputs", onOutputs);
    window.addEventListener("run-refused", onRefused);
  });
  return { outcome, cancel: (message) => finish({ ok: false, message }) };
}

export class WebDebugHost implements DebugHost {
  readonly resolver = drawerSources;
  readonly lineMapper = new LineMaps();
  private transport: EmulatorTransport | null = null;
  private engine: DebugEngine | null = null;
  private cancelPending: ((message: string) => void) | null = null;
  private ending: string | null = null; // the session ended quietly before its build finished

  constructor(private readonly options: WebHostOptions) {}

  async plan(program: string | undefined, { debug }: { debug: boolean }): Promise<LaunchPlan> {
    this.ending = null;
    const open = this.options.openFile();
    const file = program || (isAsm(open) ? open : this.options.lastProgram());
    if (!file) return { ok: false, message: NO_PROGRAM };
    prepareBuild(file);
    this.options.showTerminal(!debug); // a plain run types into the terminal next; a debugger's keys stay here
    let plan: Plan;
    try {
      plan = await planFile(file);
    } catch (error) {
      return { ok: false, message: NOT_READY };
    }
    const box = (message: string[], details?: string[]) => {
      this.options.showBox({ title: debug ? "Debug" : TITLE, icon: "warning", message, details });
      return { ok: false as const, message: "" };
    };
    if (debug && plan.programs.length > 1)
      return box([guestPath(plan.file) + " is a module of more than one program.", "Open one of the programs, and debug that: the breakpoints in this file are kept."], plan.programs.map(guestPath));
    const problem = messageOf(plan);
    if (problem) return box(problem.message, problem.details);
    if (plan.problems.length) return { ok: false, message: "" };
    if (debug && plan.output === "dll" && plan.program) return this.buildLibrary(plan.program, buildRequest(plan, base64Of, { debug }));
    if (!plan.program) return { ok: false, message: NO_PROGRAM };
    this.options.onProgram(plan.program);
    // the files are read for the build now: the line maps count the edits made from this text on
    const token: Token = { request: buildRequest(plan, base64Of, { debug }) };
    if (debug) this.lineMapper.built();
    return { ok: true, programPath: guestPath(outputPath(plan.program, ".exe")), token };
  }

  // A DLL runs only inside the program that uses it. It is built with debug information, so that the program's
  // session binds the DLL's breakpoints when it loads; nothing is debugged now.
  private async buildLibrary(library: string, request: BuildRequest): Promise<LaunchPlan> {
    const built = await this.awaitBuild(request);
    if (!built.ok) return { ok: false, message: built.message || BUILD_FAILED };
    this.options.showBox({
      title: "Debug",
      icon: "information",
      message: [guestPath(outputPath(library, ".dll")) + " is built with debug information. A DLL does not run by itself.", "Open the program that uses it, and debug that: the breakpoints in the DLL's files stop it there."],
    });
    return { ok: false, message: "" };
  }

  async build(ready: ReadyPlan): Promise<BuildOutcome> {
    return this.awaitBuild((ready.token as Token).request);
  }

  private awaitBuild(request: BuildRequest): Promise<BuildOutcome> {
    if (this.ending) return Promise.resolve({ ok: false, message: this.ending });
    const wait = buildOutcome(request);
    this.cancelPending = wait.cancel;
    buildPlanInEmulator(request);
    return wait.outcome.then((outcome) => {
      if (this.cancelPending === wait.cancel) this.cancelPending = null;
      return outcome;
    });
  }

  // The session is ended quietly (a terminal reset, Debug switched off): the build it waits for ends now, as its
  // outputs may never come, and so does a build the launch would start next.
  cancelBuild(message: string): void {
    this.ending = message;
    if (this.cancelPending) this.cancelPending(message);
  }

  async createEngine(): Promise<{ engine: DebugEngine } | { unsupported: string }> {
    this.release();
    const transport = connectEmulator();
    // no page at all (a boot or a reset) is a terminal still starting; a page without the hooks is an old build
    if (!transport) return { unsupported: getBwApp() ? NOT_AVAILABLE : NOT_READY };
    const engine = new EmulatorEngine(transport);
    this.transport = transport;
    this.engine = engine;
    const hello = await engine.hello();
    if (hello.supported) return { engine };
    this.release();
    return { unsupported: hello.reason === "not-ready" ? NOT_READY : NOT_AVAILABLE };
  }

  release(): void {
    if (this.engine) this.engine.dispose();
    if (this.transport) this.transport.close();
    this.engine = null;
    this.transport = null;
  }

  decoder(): Promise<unknown> {
    return loadX86Decoder();
  }

  issueUrl(title: string, body: string): string {
    return issueUrl(title, body);
  }

  // an instruction the emulated CPU refused but should have run, reported as the terminal's notice reports it
  invalidOpcodeReport(found: InvalidOpcode, address: string): string {
    return found.kind === "emulator-bug" ? invalidOpcodeIssue(found, address, emulatorPageInfo(), this.options.openFile()) : "";
  }

  environment(): string[] {
    return ["- Debug protocol: " + BRIDGE_PROTOCOL].concat(environmentLines(emulatorPageInfo(), this.options.openFile()));
  }
}

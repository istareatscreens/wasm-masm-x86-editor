// A debugger failure as an issue for the user to read, edit and send. It says nothing of the user's program:
// no source, no memory, no register values, no expressions, no file contents.
import { DebugFailure, withoutPaths } from "./failure";
import { LoggedRequest } from "./requestLog";

export interface ReportContext {
  state: string; // the session's state: starting, running, stopped, ended, or "no session"
  engine: string; // which engine, and the request it was last asked: "emulator (st), stepRange"
  requests: LoggedRequest[];
  inFlight: string; // the adapter request being served when it failed
  program: string[]; // facts about the program that are not its content: how many modules, its size
  environment: string[]; // the host's lines: versions, the browser
}

export const MAX_LINK = 6000;
const PROMPT = "<!-- What were you doing when this happened? Please paste the program if you can. -->";

export function reportTitle(failure: DebugFailure): string {
  return "Debugger: " + withoutPaths(failure.message).split("\n")[0].slice(0, 110);
}

export function reportBody(failure: DebugFailure, context: ReportContext, requests = context.requests): string {
  const lines = [
    "The debugger stopped with a failure of its own.",
    "",
    "- Failure: `" + withoutPaths(failure.message).replace(/`/g, "'").slice(0, 600) + "`",
    "- Kind: " + failure.kind,
    "- Session: " + context.state + (context.inFlight ? ", serving `" + context.inFlight + "`" : ""),
    "- Engine: " + context.engine,
  ];
  for (const fact of context.program) lines.push("- Program: " + fact);
  for (const line of context.environment) lines.push(line.indexOf("- ") === 0 ? line : "- " + line);
  if (requests.length) {
    lines.push("", "**Last requests**", "```");
    for (const request of requests) lines.push(request.command + " " + request.outcome + " " + request.ms + " ms");
    lines.push("```");
  }
  lines.push("", "**What was running**", PROMPT);
  return lines.join("\n");
}

// The session in one line, for the terminal's crash report.
export function stateLine(context: ReportContext): string {
  const last = context.requests[context.requests.length - 1];
  return context.state + ", " + context.engine + (context.inFlight ? ", serving " + context.inFlight : "") + (last ? "; last request " + last.command + " " + last.outcome + " " + last.ms + " ms" : "");
}

// The oldest requests are left out until the whole link is short enough to open.
export function reportLink(issueUrl: (title: string, body: string) => string, failure: DebugFailure, context: ReportContext): string {
  const title = reportTitle(failure);
  let requests = context.requests.slice();
  for (;;) {
    const link = issueUrl(title, reportBody(failure, context, requests));
    if (link.length <= MAX_LINK || !requests.length) return link;
    requests = requests.slice(1);
  }
}

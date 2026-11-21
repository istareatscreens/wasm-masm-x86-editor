// The last requests the adapter served, for a failure report: each one's name, how it ended and how long it
// took. Never an argument: a request can carry an expression, a value or a file's name.

export interface LoggedRequest {
  command: string;
  outcome: "ok" | "refused" | "failed";
  ms: number;
}

export const LOG_LENGTH = 20;

export class RequestLog {
  private entries: LoggedRequest[] = [];
  inFlight = ""; // the request being served now

  begin(command: string): void {
    this.inFlight = command;
  }

  end(command: string, outcome: LoggedRequest["outcome"], ms: number): void {
    this.inFlight = "";
    this.entries.push({ command, outcome, ms: Math.round(ms) });
    if (this.entries.length > LOG_LENGTH) this.entries.shift();
  }

  list(): LoggedRequest[] {
    return this.entries.slice();
  }
}

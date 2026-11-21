// The DAP client. The adapter runs in this page, so a "message" is a function call.
import { DebugProtocol } from "@vscode/debugprotocol";
import { MasmDebugAdapter } from "../../utility/debug/adapter/masmDebugAdapter";

// A request the adapter answered with "no". `showUser` false: the user has been told already.
export class DapError extends Error {
  constructor(message: string, readonly showUser: boolean, readonly url?: string, readonly urlLabel?: string) {
    super(message);
    Object.setPrototypeOf(this, DapError.prototype);
  }
}

type Listener = (body: any) => void;

export class DapClient {
  private seq = 1;
  private readonly listeners = new Map<string, Listener[]>();

  constructor(private readonly adapter: MasmDebugAdapter) {
    adapter.onEvent((event) => this.dispatch(event));
  }

  async request<T = any>(command: string, args?: object): Promise<T> {
    const response = await this.adapter.handle({ seq: this.seq++, type: "request", command, arguments: args });
    if (response.success) return response.body as T;
    const error = (response.body && response.body.error) || {};
    throw new DapError(response.message || "The request failed", error.showUser !== false, error.url, error.urlLabel);
  }

  // A request whose refusal is an ordinary answer (a value that cannot be read, say).
  async ask<T = any>(command: string, args?: object): Promise<{ body: T } | { refused: string }> {
    try {
      return { body: await this.request<T>(command, args) };
    } catch (error) {
      if (error instanceof DapError) return { refused: error.message };
      throw error;
    }
  }

  on(event: string, listener: Listener): () => void {
    const list = this.listeners.get(event) || [];
    this.listeners.set(event, list.concat(listener));
    return () => this.listeners.set(event, (this.listeners.get(event) || []).filter((entry) => entry !== listener));
  }

  private dispatch(event: DebugProtocol.Event): void {
    for (const listener of this.listeners.get(event.event) || []) {
      try {
        listener(event.body || {});
      } catch (error) {
        console.error("[debugger] a listener of '" + event.event + "' failed", error);
      }
    }
  }
}

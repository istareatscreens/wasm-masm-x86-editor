// The open sections' rows, loaded before a change of view is drawn, so a stop, its call stack and every open
// section's values reach the page as one update.
import { DebugView, Store } from "./debugStore";

export const SETTLE_MS = 100; // the longest a change waits for rows still on their way: those come in later

export interface RowSource {
  key(view: DebugView): string | null; // null: nothing to show in that view
  load(view: DebugView): Promise<unknown>;
}

export interface Rows {
  key: string;
  rows: unknown; // null when they could not be had
  error: string;
}

export class ViewData {
  private readonly sources = new Map<string, RowSource>();
  private readonly asked = new Map<string, { key: string; answer: Promise<Rows> }>();
  private readonly came = new Map<string, Rows & { serial: number }>();
  private serial = 0;

  // An open section's source. Gives what forgets it.
  register(id: string, source: RowSource): () => void {
    this.sources.set(id, source);
    return () => {
      if (this.sources.get(id) === source) this.sources.delete(id);
    };
  }

  // The newest rows that came for section `id`, whatever view they were for.
  latest(id: string): Rows | undefined {
    return this.came.get(id);
  }

  // The rows of section `id` for `view`: asked for once, however many wait for them.
  request(id: string, source: RowSource, view: DebugView): Promise<Rows | null> {
    const key = source.key(view);
    if (key === null) return Promise.resolve(null);
    const came = this.came.get(id);
    if (came && came.key === key) return Promise.resolve(came);
    const asked = this.asked.get(id);
    if (asked && asked.key === key) return asked.answer;
    const serial = ++this.serial;
    const answer: Promise<Rows> = Promise.resolve()
      .then(() => source.load(view))
      .then(
        (rows): Rows => ({ key, rows, error: "" }),
        (error): Rows => ({ key, rows: null, error: (error && error.message) || "" }),
      )
      .then((rows) => {
        const now = this.asked.get(id);
        if (now && now.answer === answer) this.asked.delete(id);
        const newest = this.came.get(id);
        if (!newest || newest.serial < serial) this.came.set(id, { ...rows, serial });
        return rows;
      });
    this.asked.set(id, { key, answer });
    return answer;
  }

  async load(view: DebugView): Promise<void> {
    await Promise.all(Array.from(this.sources.entries()).map(([id, source]) => this.request(id, source, view)));
  }

  clear(): void {
    this.asked.clear();
    this.came.clear();
  }
}

// A change of what the views show (a stop, a frame chosen, a value changed), drawn together with `then`'s changes
// and the open sections' rows for it: one update, or more when rows are still on their way after SETTLE_MS.
export async function showView(store: Store<DebugView>, views: ViewData, change: Partial<DebugView> | ((view: DebugView) => Partial<DebugView>), then?: () => Promise<void>): Promise<void> {
  const release = store.hold(SETTLE_MS);
  try {
    store.set(change);
    if (then) await then();
    await views.load(store.get());
  } finally {
    release();
  }
}

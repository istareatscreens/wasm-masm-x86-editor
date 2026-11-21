// The edits that Ctrl+Z takes back, newest first: each the bytes at an offset before and after it. The history
// belongs to one `key` (the host's: a debugger gives each stop its own), and is forgotten when the key changes.
export function createHistory() {
  let key;
  let edits = [];
  return {
    // the history of this key: a new key starts an empty one
    use(next) {
      if (next !== key) edits = [];
      key = next;
    },
    push(offset, before, after) {
      edits.push({ offset, before, after });
    },
    pop() {
      return edits.pop() || null;
    },
    get size() {
      return edits.length;
    },
  };
}

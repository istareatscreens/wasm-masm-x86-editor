import { useCallback, useEffect, useRef, useState } from "react";

const read = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

// Every stored state of this tab, by key: each one's way to read its key again.
const readers = new Map();
const tell = (key, except) => (readers.get(key) || new Set()).forEach((reread) => reread !== except && reread());

// A key removed from storage: this tab's stored states of it take their parse of nothing (their defaults) at once.
export function removeStoredState(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    // private mode or no storage: nothing was stored
  }
  tell(key, null);
}

// A value kept in localStorage under `key`. It is read once, synchronously, so the first render already
// has it (`parse` turns the stored text, or null, into a valid value). `set` changes it for this page
// only; `commit` changes it and stores it (`serialize` makes the text), and this tab's other stored states
// of the key read it again. Both take a value or a function of the current value.
export default function useStoredState(key, parse, serialize) {
  const [value, setValue] = useState(() => parse(read(key)));
  const latest = useRef(value);
  latest.current = value;
  const reread = useRef(null);
  useEffect(() => {
    const own = () => {
      const next = parse(read(key));
      latest.current = next;
      setValue(next);
    };
    reread.current = own;
    if (!readers.has(key)) readers.set(key, new Set());
    readers.get(key).add(own);
    return () => readers.get(key).delete(own);
  }, [key, parse]);
  const commit = useCallback(
    (next) => {
      const resolved = typeof next === "function" ? next(latest.current) : next;
      latest.current = resolved;
      setValue(resolved);
      try {
        window.localStorage.setItem(key, serialize(resolved));
      } catch (error) {
        // private mode or full storage: the page keeps the value, the next visit does not
      }
      tell(key, reread.current);
    },
    [key, serialize]
  );
  return [value, setValue, commit];
}

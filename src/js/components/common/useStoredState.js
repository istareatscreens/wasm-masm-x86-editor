import { useCallback, useRef, useState } from "react";

const read = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

// A value kept in localStorage under `key`. It is read once, synchronously, so the first render already
// has it (`parse` turns the stored text, or null, into a valid value). `set` changes it for this page
// only; `commit` changes it and stores it (`serialize` makes the text). Both take a value or a function
// of the current value.
export default function useStoredState(key, parse, serialize) {
  const [value, setValue] = useState(() => parse(read(key)));
  const latest = useRef(value);
  latest.current = value;
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
    },
    [key, serialize]
  );
  return [value, setValue, commit];
}

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { vim } from "@replit/codemirror-vim";

import { useDebouncedCallback } from "use-debounce";

import { languageFor } from "./library/languages";
import { resolveTheme } from "./library/themes";
import FileSystem from "../utility/FileSystem.js";
import useRetroScrollbars from "../../common/useRetroScrollbars.js";
import useEditorDebug from "./debug/useEditorDebug.js";

function TextEditor({
  id,
  onChange,
  selectedTheme,
  value,
  filename,
  fontSize,
  selectedFont,
  vimMode,
  exactLineBreaks,
  debug,
  debugActive,
  debugPlace,
  loaded,
}) {
  const [host, setHost] = useState(null);
  const [editorView, setEditorView] = useState(null);
  const debugging = useEditorDebug({ controller: debug, active: debugActive, filename, view: editorView, ready: loaded.file === filename, loads: loaded.count, place: debugPlace });
  const scrollbars = useRetroScrollbars(editorView && editorView.scrollDOM, host, "Editor");
  // Debounced persistence to the virtual file system.
  const writeToLocalStorage = useDebouncedCallback((name, val) => {
    FileSystem.writeToFile(name, val);
  }, 400);
  // a save still waiting is written at once when the user leaves this tab (and when the editor goes)
  useEffect(() => {
    const flush = () => writeToLocalStorage.flush();
    FileSystem.pendingSaves.add(flush);
    return () => {
      FileSystem.pendingSaves.delete(flush);
      flush();
    };
  }, [writeToLocalStorage]);

  // use-debounce v5 returns { callback, cancel, flush }, not a function.
  // One function for the editor's whole life: @uiw/react-codemirror reconfigures every extension whenever its
  // onChange changes. It calls the latest closure, which the layout effect updates before any input can come.
  const changed = useRef(null);
  useLayoutEffect(() => {
    changed.current = (val) => {
      onChange(val);
      writeToLocalStorage.callback(filename, val);
    };
  });
  const handleChange = useCallback((val) => changed.current(val), []);

  const fontFamily =
    (selectedFont && (selectedFont.fontFamily || selectedFont.text)) || "monospace";
  // MASM for .asm/.inc sources; any other file, and a binary shown as text, is plain text
  const language = exactLineBreaks ? null : languageFor(filename);

  // Memoized so @uiw/react-codemirror reconfigures the live view in place only when a toggle changes.
  // vim() must come before basicSetup's keymaps, hence basicSetup={false} and basicSetup listed after vim().
  const extensions = useMemo(() => {
    // The size also goes on .cm-content/.cm-gutters (two-class specificity): CodeMirror's style tag comes first
    // in <head>, so a rule on the editor root alone loses to the app's `.cm-editor { font-size: inherit }`.
    const size = (Number(fontSize) || 16) + "px";
    const fontTheme = EditorView.theme({
      "&": { fontSize: size },
      ".cm-content": { fontFamily, fontSize: size },
      ".cm-gutters": { fontFamily, fontSize: size },
    });
    return [
      // the breakpoint gutter stands left of the line numbers: before basicSetup's
      ...debugging.extensions,
      ...(vimMode ? [vim()] : []),
      // a binary shown as text splits lines on "\n" only, so every 0x0D byte round-trips
      // (the default also splits on "\r" and joins with "\n")
      ...(exactLineBreaks ? [EditorState.lineSeparator.of("\n")] : []),
      basicSetup,
      ...(language ? [language] : []),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged || update.geometryChanged || update.viewportChanged) scrollbars.current?.update();
      }),
      fontTheme,
      // Fallback highlight for themes that only style editor chrome; the active
      // theme's own HighlightStyle takes precedence over this.
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    ];
  }, [vimMode, fontSize, fontFamily, exactLineBreaks, language, debugging.extensions]);

  const theme = useMemo(() => resolveTheme(selectedTheme), [selectedTheme]);

  return (
    <div className="editor retro-scroll-host" id={id} ref={setHost}>
      <CodeMirror
        className="editor__code-mirror"
        value={value}
        theme={theme}
        height="100%"
        basicSetup={false}
        extensions={extensions}
        onChange={handleChange}
        onCreateEditor={setEditorView}
      />
      {debugging.menu}
    </div>
  );
}

export default TextEditor;

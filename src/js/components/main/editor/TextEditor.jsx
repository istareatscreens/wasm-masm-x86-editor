import React, { useMemo, useState } from "react";
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
}) {
  const [host, setHost] = useState(null);
  const [editorView, setEditorView] = useState(null);
  const scrollbars = useRetroScrollbars(editorView && editorView.scrollDOM, host, "Editor");
  // Debounced persistence to the virtual file system (preserves the CM5 timing).
  const writeToLocalStorage = useDebouncedCallback((name, val) => {
    FileSystem.writeToFile(name, val);
  }, 400);

  // CM6 onChange gives (value, viewUpdate) — NOT the CM5 (editor, data, value).
  // use-debounce v5 returns { callback, cancel, flush } (NOT a callable): calling
  // the object threw "c is not a function" inside CodeMirror's update listener on
  // every keystroke, so edits were never persisted (and builds used stale text).
  const handleChange = (val) => {
    onChange(val);
    writeToLocalStorage.callback(filename, val);
  };

  const fontFamily =
    (selectedFont && (selectedFont.fontFamily || selectedFont.text)) || "monospace";
  // MASM for .asm/.inc sources; any other file, and a binary shown as text, is plain text
  const language = exactLineBreaks ? null : languageFor(filename);

  // Extensions are memoized and re-created only when the toggles that affect
  // them change, so @uiw/react-codemirror reconfigures the live view in place
  // (document/selection/history preserved) instead of churning every render.
  //
  // Ordering matters: vim() MUST come before basicSetup's keymaps, so we opt out
  // of the `basicSetup` prop and include it explicitly here, after vim().
  const extensions = useMemo(() => {
    // The size goes on .cm-content/.cm-gutters (two-class specificity): CodeMirror
    // mounts its style tag at the START of <head>, so a rule on the editor root
    // alone lost to the app stylesheet's `.cm-editor { font-size: inherit }` and the
    // banner's font-size box changed nothing.
    const size = (Number(fontSize) || 16) + "px";
    const fontTheme = EditorView.theme({
      "&": { fontSize: size },
      ".cm-content": { fontFamily, fontSize: size },
      ".cm-gutters": { fontFamily, fontSize: size },
    });
    return [
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
  }, [vimMode, fontSize, fontFamily, exactLineBreaks, language]);

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
    </div>
  );
}

export default TextEditor;

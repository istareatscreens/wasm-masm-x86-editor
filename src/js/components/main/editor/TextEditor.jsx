import React, { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { vim } from "@replit/codemirror-vim";

import { useDebouncedCallback } from "use-debounce";

import { masm } from "./library/masm";
import { resolveTheme } from "./library/themes";
import FileSystem from "../utility/FileSystem.js";
import { attachRetroScrollbars } from "../../common/retroScrollbars.js";

function TextEditor({
  onChange,
  selectedTheme,
  value,
  filename,
  fontSize,
  selectedFont,
  vimMode,
}) {
  const hostRef = useRef(null);
  const scrollbars = useRef(null);
  const [editorView, setEditorView] = useState(null);
  useEffect(() => {
    if (!editorView) return;
    const controls = attachRetroScrollbars(editorView.scrollDOM, hostRef.current, "Editor");
    scrollbars.current = controls;
    return () => {
      controls.destroy();
      scrollbars.current = null;
    };
  }, [editorView]);
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
      basicSetup,
      masm(),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged || update.geometryChanged || update.viewportChanged) scrollbars.current?.update();
      }),
      fontTheme,
      // Fallback highlight for themes that only style editor chrome; the active
      // theme's own HighlightStyle takes precedence over this.
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    ];
  }, [vimMode, fontSize, fontFamily]);

  const theme = useMemo(() => resolveTheme(selectedTheme), [selectedTheme]);

  return (
    <div className="editor retro-scroll-host" ref={hostRef}>
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

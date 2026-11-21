// The statement tints for light and dark editor themes: CodeMirror knows which kind of theme is on (&light,
// &dark). The colours are the page's (components/_debug-gutter.scss).
import { EditorView } from "@codemirror/view";

export const debugEditorTheme = EditorView.baseTheme({
  "&light .cm-debug-current-line": { backgroundColor: "var(--debug-statement)" },
  "&dark .cm-debug-current-line": { backgroundColor: "var(--debug-statement-dark)" },
  "&light .cm-debug-caller-line": { backgroundColor: "var(--debug-caller)" },
  "&dark .cm-debug-caller-line": { backgroundColor: "var(--debug-caller-dark)" },
});

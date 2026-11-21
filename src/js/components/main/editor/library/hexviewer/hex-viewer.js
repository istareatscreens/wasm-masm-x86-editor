import React, { forwardRef, useMemo, useRef } from "react";
import { Hex } from "./hex.js";
import { byteSource } from "./sources/byteSource.js";
import { decodeData } from "./sources/decode.js";
import { themeAttributes } from "./theme/tokens.js";

// Bytes come from `source` (a ByteSource) or from children: base64 or hex text (`base64`/`hex` prop), bytes, or
// numbers. `noData`/`errorData` show for no bytes/unreadable data; `theme` is a preset name or token values; other
// props and the ref (scrollToOffset, setCaret, focus) are the view's (hex.js).
export const HexViewer = forwardRef(function HexViewer({ source, children, base64, hex, noData, errorData, theme, className = "", style, ...view }, ref) {
  const host = useRef(null);
  const fromData = useMemo(() => {
    if (source) return null;
    const bytes = decodeData(children, { base64, hex });
    return bytes ? byteSource(bytes) : undefined;
  }, [source, children, base64, hex]);
  const shown = source || fromData;
  const { preset, style: tokens } = themeAttributes(theme);

  let content;
  if (shown === undefined) content = errorData !== undefined ? errorData : <div className="hexviewer__message">The data cannot be read.</div>;
  else if (!shown.length) content = noData !== undefined ? noData : <div className="hexviewer__message">No data.</div>;
  else content = <Hex ref={ref} source={shown} hostRef={host} {...view} />;

  return (
    <div
      ref={host}
      className={("hexviewer" + (view.disabled ? " hexviewer--disabled" : "") + " " + className).trim()}
      data-hexviewer-theme={preset}
      style={{ ...tokens, "--hexviewer-unit": view.unit || 1, ...style }}
    >
      {content}
    </div>
  );
});

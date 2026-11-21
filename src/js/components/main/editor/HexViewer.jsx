import React, { useMemo } from "react";
import useStoredState from "../../common/useStoredState.js";
import { retroScrollbarHost } from "../../common/retroScrollbarHost.js";
import { HexViewer, byteSource, decimalOffset, decodeData, hexOffset } from "./library/hexviewer/index.js";
import { HEX_OFFSETS_KEY, parseOffsets, serializeOffsets } from "./hexOffsets.js";

const scrollbars = retroScrollbarHost("Hex view");

// Read-only hex view in the editor's font and size, coloured by the `editor-document` themes
// (css/components/_hex-themes.scss). The header's offset cell switches offsets between hexadecimal and decimal.
const HexViewerComponent = ({ data, lightMode, fontSize = 16, selectedFont }) => {
  const [offsets, , setOffsets] = useStoredState(HEX_OFFSETS_KEY, parseOffsets, serializeOffsets);
  const decimal = offsets === "decimal";
  const bytes = useMemo(() => decodeData(data, { base64: true }), [data]);
  const source = useMemo(() => {
    if (!bytes) return null;
    const digits = Math.max(8, String(Math.max(0, bytes.length - 1)).length);
    return byteSource(bytes, { label: decimal ? decimalOffset(digits) : hexOffset });
  }, [bytes, decimal]);
  const size = Number(fontSize) || 16;
  const family = (selectedFont && (selectedFont.fontFamily || selectedFont.text)) || "monospace";
  const theme = useMemo(
    () => ({ preset: lightMode ? "editor-document" : "editor-document-dark", fontFamily: '"' + family + '", monospace', fontSize: size + "px" }),
    [lightMode, family, size],
  );
  const offsetHeader = {
    text: decimal ? "Offset(d)" : "Offset(h)",
    title: decimal ? "Offsets in decimal: show them in hexadecimal" : "Offsets in hexadecimal: show them in decimal",
    onClick: () => setOffsets(decimal ? "hex" : "decimal"),
  };

  return (
    <div className="hex-viewer-container editor">
      {source ? (
        <HexViewer source={source} theme={theme} rowHeight={Math.max(25, Math.round(size * 1.25))} offsetHeader={offsetHeader} attachScrollbars={scrollbars} label="Bytes of the file" />
      ) : (
        <HexViewer theme={theme} errorData={<p className="hex-viewer-container__message">This file's bytes cannot be read.</p>}>
          {data}
        </HexViewer>
      )}
    </div>
  );
};

export default HexViewerComponent;

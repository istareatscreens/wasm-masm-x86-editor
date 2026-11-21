import FileSystem from "../../utility/FileSystem.js";
import { latin1 } from "../../utility/build/coff";
import { outputPath } from "../../utility/filesystem/paths";
import { masmSegments } from "./linkerMap";

// The "Go to" list: .data, .data? and .const from the build's map file, then the stack and the code.
export function goToPlaces(program) {
  let segments = [];
  if (program) {
    try {
      segments = masmSegments(latin1(FileSystem.getBytes(outputPath(program, ".map"))));
    } catch (error) {
      segments = []; // no map yet: the registers' places only
    }
  }
  return segments
    .map((segment) => ({ id: segment.name, text: segment.name, address: segment.address }))
    .concat([
      { id: "esp", text: "Stack (ESP)", expression: "esp" },
      { id: "eip", text: "Code (EIP)", expression: "eip" },
    ]);
}

// The address an evaluated expression names: where a value with an address is, or the number it is.
export function addressOfResult(body) {
  if (body.memoryReference) return parseInt(body.memoryReference, 16) >>> 0;
  const text = String(body.result || "").trim();
  const hex = /^([0-9a-f]+)h$/i.exec(text) || /^0x([0-9a-f]+)$/i.exec(text);
  if (hex) return parseInt(hex[1], 16) >>> 0;
  if (/^-?\d+$/.test(text)) return Number(text) >>> 0;
  return null;
}

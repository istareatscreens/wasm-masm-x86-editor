import { masm } from "./masm";
import { isMasmSource } from "../../utility/filesystem/paths";

const masmSupport = masm();

// The editor's language for a file: MASM for .asm and .inc sources, none (plain text) for any other.
export function languageFor(filename) {
  return isMasmSource(filename || "") ? masmSupport : null;
}

import { masm } from "./masm";
import { moduleDefinition } from "./moduledef";
import { isMasmSource, isModuleDefinition } from "../../utility/filesystem/paths";

const masmSupport = masm();
const moduleDefinitionSupport = moduleDefinition();

// The editor's language for a file: MASM for .asm and .inc sources, the module-definition language for .def files,
// none (plain text) for any other.
export function languageFor(filename) {
  const name = filename || "";
  if (isMasmSource(name)) return masmSupport;
  if (isModuleDefinition(name)) return moduleDefinitionSupport;
  return null;
}

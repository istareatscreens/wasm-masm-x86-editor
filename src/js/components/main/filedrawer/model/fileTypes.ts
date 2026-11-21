// The Create file window's types: the text files ML and LINK read (sources, INCLUDE files, macro libraries and /DEF
// files), and a custom name. There is no resource compiler here, so .rc is not offered.
export type FileTypeId = "asm" | "inc" | "mac" | "def" | "custom";

export interface FileType {
  id: FileTypeId;
  label: string;
  extension: string | null; // null: the name as typed
}

export const FILE_TYPES: FileType[] = [
  { id: "asm", label: "Assembly source (.asm)", extension: ".asm" },
  { id: "inc", label: "Include file (.inc)", extension: ".inc" },
  { id: "mac", label: "Macro file (.mac)", extension: ".mac" },
  { id: "def", label: "Module definition (.def)", extension: ".def" },
  { id: "custom", label: "Custom name", extension: null },
];

export const DEFAULT_FILE_TYPE: FileTypeId = "asm";

// A stored type, or the default when it is not one (settings from an older version, or edited by hand).
export const parseFileType = (value: unknown): FileTypeId => (FILE_TYPES.some((type) => type.id === value) ? (value as FileTypeId) : DEFAULT_FILE_TYPE);

// The name a typed name gets: the type's extension added unless the name already ends with it, in any letter case
// (math and math.inc both give math.inc); a custom name as typed.
export function nameWithType(name: string, id: FileTypeId): string {
  const type = FILE_TYPES.find((entry) => entry.id === id) || FILE_TYPES[0];
  if (!type.extension || !name) return name;
  return name.toLowerCase().endsWith(type.extension) ? name : name + type.extension;
}

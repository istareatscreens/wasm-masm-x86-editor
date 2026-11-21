// How a binary file's offsets are shown, kept for every file: "hex" (eight hexadecimal digits) or "decimal".
export const HEX_OFFSETS_KEY = "hexOffsets";
export const parseOffsets = (text) => (text === "decimal" ? "decimal" : "hex");
export const serializeOffsets = (form) => form;

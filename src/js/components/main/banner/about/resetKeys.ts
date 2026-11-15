// The localStorage keys a plain Hard Reset deletes: the emulator's own records. The drawer's keys never match ("/", and
// keys made of random ids, every drive's included), and neither do the editor settings or the pane layout.
export const isResetKey = (key: string): boolean => /^bw-/.test(key) || /^bwsnapmark\|/.test(key);

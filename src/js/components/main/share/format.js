// Counts and sizes in the share and import windows: "1,234 files", "512 bytes", "3.4 KB".
export const plural = (n, word) => n.toLocaleString("en-US") + " " + word + (n === 1 ? "" : "s");
export const fileSize = (n) => (n < 1024 ? plural(n, "byte") : (n / 1024).toFixed(n < 10240 ? 1 : 0) + " KB");

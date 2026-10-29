// The drawer tree as data: which rows are shown, how they are connected, which entries a
// checkbox selection stands for, and whether a move is allowed. No React, no DOM.
import { ROOT, parentOf, baseOf, depthOf, isAsm, isWithin, ancestorsOf, nameKey, rebase, pathProblem, guestPath, folderLabel } from "../../utility/filesystem/paths";

export type RowKind = "root" | "folder" | "file";
export type CheckState = "checked" | "unchecked" | "mixed";

export interface TreeRow {
  path: string; // ROOT ("") for the (D:) row
  name: string;
  kind: RowKind;
  depth: number; // 0 for the root
  hasChildren: boolean;
  expanded: boolean;
  isLast: boolean; // last child of its parent: the guide ends in an elbow
  guides: boolean[]; // for depths 1..depth-1: a vertical guide passes this row there
}

export interface TreeIndex {
  files: string[];
  folders: Set<string>; // registry + every folder above a file
  children: Map<string, { folders: string[]; files: string[] }>; // sorted
}

// Explorer order: case-insensitive, code-unit order as the tie-break (no locale
// collation, so every browser and language setting sorts identically).
const byName = (a: string, b: string): number => {
  const ka = nameKey(baseOf(a)), kb = nameKey(baseOf(b));
  if (ka !== kb) return ka < kb ? -1 : 1;
  return a < b ? -1 : a > b ? 1 : 0;
};

export function indexTree(files: string[], registry: string[]): TreeIndex {
  const folders = new Set<string>();
  for (const folder of registry) {
    if (!folder) continue;
    folders.add(folder);
    for (const up of ancestorsOf(folder)) folders.add(up);
  }
  for (const file of files) for (const up of ancestorsOf(file)) folders.add(up);
  const children = new Map<string, { folders: string[]; files: string[] }>();
  const slot = (folder: string) => {
    let entry = children.get(folder);
    if (!entry) children.set(folder, (entry = { folders: [], files: [] }));
    return entry;
  };
  slot(ROOT);
  folders.forEach((folder) => slot(parentOf(folder)).folders.push(folder));
  for (const file of files) slot(parentOf(file)).files.push(file);
  children.forEach((entry) => {
    entry.folders.sort(byName);
    entry.files.sort(byName);
  });
  return { files, folders, children };
}

const visibleFiles = (index: TreeIndex, folder: string, asmOnly: boolean): string[] => {
  const entry = index.children.get(folder);
  if (!entry) return [];
  return asmOnly ? entry.files.filter(isAsm) : entry.files;
};
const childFolders = (index: TreeIndex, folder: string): string[] => {
  const entry = index.children.get(folder);
  return entry ? entry.folders : [];
};

export function buildRows(index: TreeIndex, expanded: Set<string>, asmOnly: boolean): TreeRow[] {
  const rows: TreeRow[] = [];
  const walk = (folder: string, guides: boolean[]) => {
    const kids = [...childFolders(index, folder).map((path) => ({ path, kind: "folder" as RowKind })),
      ...visibleFiles(index, folder, asmOnly).map((path) => ({ path, kind: "file" as RowKind }))];
    kids.forEach(({ path, kind }, i) => {
      const isLast = i === kids.length - 1;
      const hasChildren = kind === "folder" && (childFolders(index, path).length > 0 || visibleFiles(index, path, asmOnly).length > 0);
      const open = kind === "folder" && hasChildren && expanded.has(path);
      rows.push({ path, name: baseOf(path), kind, depth: depthOf(path), hasChildren, expanded: open, isLast, guides });
      if (open) walk(path, guides.concat(!isLast));
    });
  };
  rows.push({ path: ROOT, name: "(D:)", kind: "root", depth: 0, hasChildren: true, expanded: true, isLast: true, guides: [] });
  walk(ROOT, []);
  return rows;
}

// A rebuilt row equal to the previous build's keeps the previous object, so a memoised row
// component re-renders only for rows that changed.
export function reuseRows(previous: Map<string, TreeRow>, rows: TreeRow[]): TreeRow[] {
  return rows.map((row) => {
    const old = previous.get(row.path);
    const same =
      !!old && old.name === row.name && old.kind === row.kind && old.depth === row.depth && old.hasChildren === row.hasChildren &&
      old.expanded === row.expanded && old.isLast === row.isLast && old.guides.length === row.guides.length &&
      old.guides.every((guide, i) => guide === row.guides[i]);
    return same ? old : row;
  });
}

// The rows (tree order, the (D:) row first) are drawn in pages of PAGE_ROWS: the pages the
// view shows and one page before and after them (tree/FileTree.jsx).
export const PAGE_ROWS = 100;
export const pageCount = (rowCount: number): number => Math.max(1, Math.ceil(rowCount / PAGE_ROWS));
export const pageOf = (rowIndex: number): number => Math.max(0, Math.floor(rowIndex / PAGE_ROWS));

// Every file and folder strictly below `folder` that the current view shows.
export function visibleDescendants(index: TreeIndex, folder: string, asmOnly: boolean): string[] {
  const out: string[] = [];
  const walk = (at: string) => {
    for (const sub of childFolders(index, at)) {
      out.push(sub);
      walk(sub);
    }
    out.push(...visibleFiles(index, at, asmOnly));
  };
  walk(folder);
  return out;
}

// Every file and folder strictly below `folder`, shown or not.
export function allDescendants(index: TreeIndex, folder: string): { files: string[]; folders: string[] } {
  const files = index.files.filter((file) => file !== folder && isWithin(file, folder));
  const folders: string[] = [];
  index.folders.forEach((sub) => {
    if (sub !== folder && isWithin(sub, folder)) folders.push(sub);
  });
  return { files, folders };
}

// A folder with shown contents is checked when all of them are; an empty-looking folder
// carries its own mark.
export function checkState(path: string, kind: RowKind, checked: Set<string>, index: TreeIndex, asmOnly: boolean): CheckState {
  if (kind === "file") return checked.has(path) ? "checked" : "unchecked";
  const below = visibleDescendants(index, path, asmOnly);
  if (!below.length) return checked.has(path) ? "checked" : "unchecked";
  const marked = below.filter((item) => checked.has(item)).length;
  return marked === below.length ? "checked" : marked ? "mixed" : "unchecked";
}

export function toggleChecked(path: string, kind: RowKind, value: boolean, checked: Set<string>, index: TreeIndex, asmOnly: boolean): Set<string> {
  const next = new Set(checked);
  const items = kind === "folder" ? [path, ...visibleDescendants(index, path, asmOnly)] : [path];
  for (const item of items) value ? next.add(item) : next.delete(item);
  if (!value) for (const up of ancestorsOf(path)) next.delete(up);
  return next;
}

// The entries a checkbox selection stands for, outermost first: a fully checked folder
// is one entry (with all its contents); otherwise its checked children are.
export function resolveTargets(checked: Set<string>, index: TreeIndex, asmOnly: boolean): { files: string[]; folders: string[] } {
  const files: string[] = [], folders: string[] = [];
  const walk = (folder: string) => {
    for (const sub of childFolders(index, folder)) {
      if (checkState(sub, "folder", checked, index, asmOnly) === "checked") folders.push(sub);
      else walk(sub);
    }
    for (const file of visibleFiles(index, folder, asmOnly)) if (checked.has(file)) files.push(file);
  };
  walk(ROOT);
  return { files, folders };
}

// Drop entries that lie inside another entry of the list.
export const outermost = (paths: string[]): string[] =>
  paths.filter((path) => !paths.some((other) => other !== path && isWithin(path, other)));

export interface MovePlan {
  moves: string[]; // outermost entries that actually change folder
  problem: string | null;
}

// Can `items` (files and/or folders) move into `target`? Every path that would result
// must be a valid path, and no name may clash with the target's contents or another
// moving item (names compare case-insensitively, as on D:).
export function planMove(items: string[], target: string, index: TreeIndex): MovePlan {
  if (target !== ROOT && !index.folders.has(target)) return { moves: [], problem: "That folder no longer exists." };
  const tops = outermost(items);
  for (const item of tops) {
    if (index.folders.has(item) && isWithin(target, item)) return { moves: [], problem: "A folder cannot be moved into itself." };
  }
  const moves = tops.filter((item) => parentOf(item) !== target);
  if (!moves.length) return { moves: [], problem: "Already in " + folderLabel(target) + "." };
  const entry = index.children.get(target) || { folders: [], files: [] };
  const taken = new Set([...entry.folders, ...entry.files].filter((path) => !moves.includes(path)).map((path) => nameKey(baseOf(path))));
  for (const item of moves) {
    const key = nameKey(baseOf(item));
    if (taken.has(key)) return { moves: [], problem: "An item named " + baseOf(item) + " already exists in " + folderLabel(target) + "." };
    taken.add(key);
    const below = index.folders.has(item) ? allDescendants(index, item) : { files: [], folders: [] };
    for (const path of [item, ...below.folders, ...below.files]) {
      const reason = pathProblem(rebase(path, item, target));
      if (reason) return { moves: [], problem: guestPath(rebase(path, item, target)) + ": " + reason };
    }
  }
  return { moves, problem: null };
}

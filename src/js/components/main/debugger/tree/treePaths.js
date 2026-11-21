// A value tree row's path: "/" + its name under the root, then "/" + each child's name. Paths name rows for the
// selection, the expanded set and the values kept from the previous stop.
export const topPath = (name) => "/" + name;
export const childPath = (path, name) => path + "/" + name;

// The top row a selected path belongs to, as its index in `names`, or -1. A name may hold "/" (a watch such as
// `total/2`), so an exact top path wins, then the longest name the path continues.
export function topIndexOf(path, names) {
  if (!path) return -1;
  const exact = names.indexOf(path.slice(1));
  if (path.charAt(0) === "/" && exact >= 0) return exact;
  let best = -1;
  names.forEach((name, i) => {
    if (path.startsWith(topPath(name) + "/") && (best < 0 || name.length > names[best].length)) best = i;
  });
  return best;
}

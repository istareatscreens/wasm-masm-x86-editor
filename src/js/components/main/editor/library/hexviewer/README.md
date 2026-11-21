# Hex viewer

A React component that shows bytes as a hex dump: offsets, bytes in groups, and their characters. Only the
rows on screen are drawn, so a file of any size opens at once. It reads its bytes from a *byte source*, so the
same component shows a file, or memory that is read page by page while the view scrolls. Its whole look is a
theme. It knows nothing of the app it is in.

## Dependencies

`react` (18), `react-window` (2) and `buffer` (for base64 and hex text). Nothing else: the folder imports nothing
from outside itself (`Boxedwine/scripts/tests/hexviewer-package.test.cjs` checks this).

Load `hex-viewer.css` once, before any theme of your own.

## Use

```jsx
import { HexViewer, byteSource } from "./hexviewer";

<HexViewer base64>{fileAsBase64}</HexViewer>              // data as children, as upstream took it
<HexViewer source={byteSource(bytes)} theme="dark" />     // a byte source
```

Children may be base64 text (with `base64`), hexadecimal text (with `hex`), a `Uint8Array` or `Buffer`, an
`ArrayBuffer`, or an array of numbers from 0 to 255. Anything else shows `errorData`; no bytes show `noData`.

## Props

| Prop | Default | |
|---|---|---|
| `source` | | a `ByteSource`; or give the data as children |
| `children` | | the data, when there is no `source`: base64 or hex text, bytes, or an array of numbers |
| `base64`, `hex` | | the text children are base64, or hexadecimal digits |
| `rowLength` | `16` | bytes per row, or `"auto"`: 16 or 8 when that fits the view's width, else 4 |
| `setLength` | `4` | bytes per group of cells |
| `unit` | `1` | bytes per cell: 1, 2 or 4, shown little-endian as one number |
| `rowHeight` | `25` | a row's height in pixels |
| `showHeader` | `true` | the header row: the offset column's name, the column numbers, `ASCII` |
| `offsetHeader` | `{text: "Offset"}` | the offset column's header cell: `text`, `title`, and `onClick` (it is then a button) |
| `showAscii` | `true` | the character column |
| `showOffsets` | `true` | the offset column |
| `highlightOnHover` | `true` | the cell under the pointer is highlighted, with its character |
| `disabled` | `false` | greyed, and no edits |
| `historyKey` | | when it changes, the edits Ctrl+Z can take back are forgotten |
| `onVisibleRangeChange` | | called with `{start, end}`: the offsets the rows on screen show |
| `onEditError` | | called with the message of a write the source refused |
| `attachScrollbars` | | `(surface, host) => {destroy()}`: scrollbars of your own; the browser's are used without it |
| `label` | `"Bytes"` | the grid's accessible name |
| `theme` | | a preset's name, or an object of tokens (below) |
| `className`, `style` | | for the root element |
| `noData`, `errorData` | | shown in place of the view |

The ref is a handle: `scrollToOffset(offset, align?)`, `setCaret(offset, column?)`, `getCaret()`, `focus()`,
`element` (the grid) and `rowLength` (what `"auto"` chose).

## Byte sources

```ts
interface ByteSource {
  readonly length: number;                                  // bytes shown
  getVersion(): number;                                     // changes when bytes, marks or length may have changed
  subscribe(onChange: () => void): () => void;              // calls onChange after each such change
  label(offset: number): string;                            // heading of the row that starts at offset
  read(offset: number, into: Int16Array): void;             // 0-255, -1 unreadable ("??"), -2 not loaded yet (blank)
  marks?(offset: number, into: Uint8Array): void;           // 1 = changed: drawn in the changed colour, underlined
  write?(offset: number, bytes: Uint8Array): Promise<void>; // absent when read-only; rejects with a message
}
```

`byteSource(bytes, {label})` is one over bytes held in memory. Row headings are eight hexadecimal digits
(`hexOffset`) unless `label` says otherwise; `decimalOffset(width)` gives decimal ones padded to a width.

## Keyboard and editing

The view is a grid with a caret. The arrows, Page Up/Down and Home/End move it, Ctrl+Home/End to either end;
Shift extends a selection, as a drag does. Tab moves from the bytes to the characters and Shift+Tab back; from
there the focus leaves the grid as usual. Ctrl+C copies the selection, or the caret's cell, as hex text.

On a source with `write`, typing hex digits overwrites the cell under the caret once all its digits are typed,
and a printable ASCII character in the character column overwrites its byte. Escape abandons a half-typed cell.
Ctrl+Z takes back the edits made since `historyKey` last changed, newest first. Nothing is written while
`disabled`. A source without `write` cannot be changed from the keyboard.

## Themes

The stylesheet takes every colour, font and measure from these custom properties, each with a default (the
`light` preset). A theme sets them and nothing else: class names are private.

| Group | Tokens |
|---|---|
| Text | `--hexviewer-font-family`, `--hexviewer-font-size`, `--hexviewer-cell-width`, `--hexviewer-set-gap` |
| Surface | `--hexviewer-background`, `--hexviewer-color`, `--hexviewer-frame-shadow`, `--hexviewer-border` |
| Columns | `--hexviewer-heading-color`, `--hexviewer-heading-background`, `--hexviewer-ascii-color`, `--hexviewer-header-background`, `--hexviewer-header-color`, `--hexviewer-header-shadow` |
| Pointer and selection | `--hexviewer-hover-background`, `--hexviewer-hover-color`, `--hexviewer-set-hover-color`, `--hexviewer-selection-background`, `--hexviewer-selection-color`, `--hexviewer-selection-inactive-background`, `--hexviewer-selection-inactive-color` |
| Caret | `--hexviewer-caret-outline`, `--hexviewer-caret-mirror-background` |
| Cell states | `--hexviewer-changed-color`, `--hexviewer-unreadable-color` |
| Disabled | `--hexviewer-disabled-background`, `--hexviewer-disabled-color` |

`cell-width` is one byte's cell (`3ch` by default); a cell of two or four bytes is as much wider as its digits
need. `caret-outline` is an outline (`1px dotted #000000`).

The `theme` prop takes:

- a preset's name: `"light"` (the default) or `"dark"`, or one your stylesheet defines as
  `.hexviewer[data-hexviewer-theme="name"] { --hexviewer-…: …; }`;
- an object of tokens in camelCase, set as inline custom properties, which may name a `preset` to start from:
  `theme={{ preset: "dark", fontSize: "13px", selectionBackground: "#0f0" }}`.

In forced colours (Windows' high contrast) the stylesheet uses the system's colours, whatever the theme.

## Accessibility

The view is an ARIA grid: a header row, rows with their offset as row header, and cells; the caret's cell is
the grid's active descendant. A read-only source makes it `aria-readonly`, `disabled` makes it `aria-disabled`,
and a changed byte is described as changed, not only coloured.

## Credits

A rework of `react-hexviewer-ts` 0.2.3 by Kondakov Artem, itself a rework of `react-hexviewer` 1.0.1 by Travis
Person. Both are published under the MIT licence:

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
> documentation files (the "Software"), to deal in the Software without restriction, including without
> limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
> Software, and to permit persons to whom the Software is furnished to do so, subject to the following
> conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial
> portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
> TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
> THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
> CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
> DEALINGS IN THE SOFTWARE.

## What a release still needs

A package name, a build (the folder is plain ES modules with JSX), and a licence for this repository's own
changes, which declares none today.

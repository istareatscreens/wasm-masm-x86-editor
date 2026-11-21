import { ForwardRefExoticComponent, MutableRefObject, RefAttributes } from "react";
import { HexViewerHandle, HexViewerProps } from "./hex-viewer";
import { ByteSource } from "./index";

/** The view inside the viewer's root: the header row and the virtual grid of rows */
export declare const Hex: ForwardRefExoticComponent<
  Omit<HexViewerProps, "source" | "children" | "hex" | "base64" | "noData" | "errorData" | "theme" | "className" | "style"> & {
    source: ByteSource;
    /** the viewer's root element: the scrollbars' host */
    hostRef: MutableRefObject<HTMLElement | null>;
  } & RefAttributes<HexViewerHandle>
>;

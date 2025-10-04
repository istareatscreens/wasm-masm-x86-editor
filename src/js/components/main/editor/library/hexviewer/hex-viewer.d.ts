/// <reference types="node" />
import { FC, ReactNode } from "react";
export interface HexViewerProps {
    /** number of bytes per row */
    rowLength?: number;
    /** number of bytes between a visible split */
    setLength?: number;
    /** Buffer | number[] | string as base64 or raw hex */
    children: string | Buffer | number[];
    /** sign that the data is hex */
    hex?: boolean;
    /** sign that the data is base64 */
    base64?: boolean;
    /** Component that will be displayed if there is no data */
    noData?: ReactNode;
    /** Component that will be displayed if data parsing is unsuccessful */
    errorData?: ReactNode;
}
export declare const HexViewer: FC<HexViewerProps>;

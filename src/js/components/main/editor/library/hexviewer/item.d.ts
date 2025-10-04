import { FC } from "react";
export declare const Item: FC<{
    byte: string;
    index: number;
    activate(idx: number): void;
    clear(): void;
    active: boolean;
}>;

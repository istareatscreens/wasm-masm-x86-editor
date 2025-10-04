import { FC } from "react";
export declare const Set: FC<{
    active: boolean;
    activeItem: number;
    activateItem(idx: number): void;
    activateSet(idx: number): void;
    clearSet(): void;
    clearItem(): void;
    index: number;
    set: number[];
}>;

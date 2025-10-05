import React from 'react';
import { Item } from './item';
const SetComponent = ({
    set,
    activeItem,
    activateItem,
    activateSet,
    active,
    clearItem,
    clearSet,
    index
}) => {
    const items = set.map((hexByte, i) => {
        // hexByte is already a hex string like "ff", "00", etc. from the worker
        let byteString = "";
        if (hexByte === -1 || hexByte === "--") {
            byteString = "--";
        } else {
            // Already a hex string, just ensure uppercase
            byteString = hexByte.toUpperCase();
        }

        return (
            <Item
                key={i}
                index={i}
                byte={byteString}
                active={!!(activeItem === i && active)}
                activate={activateItem}
                clear={clearItem}
            />
        );
    });

    return (
        <ul
            className={`setHex${active ? " active" : ""}`}
            onMouseOver={() => activateSet(index)}
            onFocus={() => { }}
            onMouseLeave={() => clearSet()}
        >
            {items}
        </ul>
    );
};

// Memoize for performance in virtual scrolling
export const Set = React.memo(SetComponent);

import React from 'react';
const ItemComponent = ({ activate, byte, index, active, clear }) => {
    const getClasses = () => {
        return (active ? "active" : "") + (byte === "--" ? " none" : "");
    };

    return (
        <li
            className={getClasses()}
            onMouseOver={() => activate(index)}
            onFocus={() => { }}
            onMouseLeave={clear}
        >
            {byte}
        </li>
    );
};

// Memoize for performance in virtual scrolling
export const Item = React.memo(ItemComponent);

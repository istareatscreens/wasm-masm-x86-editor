import React, { useState } from 'react';
import { Set } from './set';
const Row = ({ sets, heading }) => {
    const [activeSet, setActiveSet] = useState(-1);
    const [activeItem, setActiveItem] = useState(-1);
    function setActiveSetFn(set) {
        if (sets[set][0] === -1)
            return;
        setActiveSet(set);
    }
    function clearActiveSet() {
        setActiveSet(-1);
    }
    function clearActiveItem() {
        setActiveItem(-1);
    }
    const setsNode = sets.map((set, i) => (
        <Set
            key={`set${i}`}
            set={set}
            index={i}
            active={activeSet === i}
            activeItem={activeItem}
            activateSet={setActiveSetFn}
            clearSet={clearActiveSet}
            activateItem={(idx) => setActiveItem(idx)}
            clearItem={clearActiveItem}
        />
    ));

    const ascii = sets.map((set, setIndex) =>
        set.map((hexByte, itemIndex, theSet) => {
            let char = "";
            // hexByte is a hex string like "ff", "00", etc.
            if (hexByte === "--" || hexByte === -1) {
                char = " ";
            } else {
                const byteValue = parseInt(hexByte, 16);
                if (byteValue > 31 && byteValue < 127) {
                    char = String.fromCharCode(byteValue);
                } else {
                    char = "·";
                }
            }
            return (
                <li
                    key={`set${itemIndex}`}
                    className={
                        activeSet * theSet.length + activeItem === setIndex * theSet.length + itemIndex
                            ? "active"
                            : ""
                    }
                >
                    {char}
                </li>
            );
        })
    );

    return (
        <div className="hex-row">
            <div className="heading">{heading}:</div>
            <div className="hex">{setsNode}</div>
            <div className="ascii">
                <ul className="setAscii">{ascii}</ul>
            </div>
        </div>
    );
};
export { Row };

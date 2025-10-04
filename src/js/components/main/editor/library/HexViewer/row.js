"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Row = void 0;
var tslib_1 = require("tslib");
var react_1 = tslib_1.__importStar(require("react"));
var set_1 = require("./set");
var Row = function (props) {
    var sets = props.sets, heading = props.heading;
    var _a = react_1.useState(-1), activeSet = _a[0], setActiveSet = _a[1];
    var _b = react_1.useState(-1), activeItem = _b[0], setActiveItem = _b[1];
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
    var setsNode = sets.map(function (set, i) {
        var setIdx = i;
        return (react_1.default.createElement(set_1.Set, { key: "set" + setIdx, set: set, index: i, active: activeSet === i, activeItem: activeItem, activateSet: setActiveSetFn, clearSet: clearActiveSet, activateItem: function (idx) { return setActiveItem(idx); }, clearItem: clearActiveItem }));
    });
    var ascii = sets.map(function (set, setIndex) {
        return set.map(function (byte, itemIndex, theSet) {
            var char = "";
            if (byte === -1) {
                char = " ";
            }
            else if (byte > 31 && byte < 127) {
                char = String.fromCharCode(byte);
            }
            else {
                char = "·";
            }
            var itemSetIndex = itemIndex;
            return (react_1.default.createElement("li", { key: "set" + itemSetIndex, className: activeSet * theSet.length + activeItem ===
                    setIndex * theSet.length + itemIndex
                    ? "active"
                    : "" }, char));
        });
    });
    return (react_1.default.createElement("div", { className: "hex-row" },
        react_1.default.createElement("div", { className: "heading" },
            heading,
            ":"),
        react_1.default.createElement("div", { className: "hex" }, setsNode),
        react_1.default.createElement("div", { className: "ascii" },
            react_1.default.createElement("ul", { className: "setAscii" }, ascii))));
};
exports.Row = Row;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Set = void 0;
var tslib_1 = require("tslib");
var react_1 = tslib_1.__importDefault(require("react"));
var item_1 = require("./item");
var Set = function (props) {
    var set = props.set, activeItem = props.activeItem, activateItem = props.activateItem, activateSet = props.activateSet, active = props.active, clearItem = props.clearItem, clearSet = props.clearSet, index = props.index;
    var items = set.map(function (byte, i) {
        var byteString = "";
        if (byte === -1) {
            byteString = "--";
        }
        else {
            byteString = byte.toString(16);
            if (byteString.length === 1) {
                byteString = "0" + byteString;
            }
        }
        byteString = byteString.toUpperCase();
        var idx = i;
        return (react_1.default.createElement(item_1.Item, { key: "" + idx, index: i, byte: byteString, active: !!(activeItem === i && active), activate: activateItem, clear: clearItem }));
    });
    return (react_1.default.createElement("ul", { className: "setHex" + (active ? " active" : ""), onMouseOver: function () { return activateSet(index); }, onFocus: function () { }, onMouseLeave: function () { return clearSet(); } }, items));
};
exports.Set = Set;

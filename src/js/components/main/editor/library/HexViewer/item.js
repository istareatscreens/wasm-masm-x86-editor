"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Item = void 0;
var tslib_1 = require("tslib");
var react_1 = tslib_1.__importDefault(require("react"));
var Item = function (props) {
    var activate = props.activate, byte = props.byte, index = props.index, active = props.active, clear = props.clear;
    function getClasses() {
        return (active ? "active" : "") + (byte === "--" ? " none" : "");
    }
    return (react_1.default.createElement("li", { className: getClasses(), onMouseOver: function () { return activate(index); }, onFocus: function () { }, onMouseLeave: clear }, byte));
};
exports.Item = Item;

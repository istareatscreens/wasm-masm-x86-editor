"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hex = void 0;
var tslib_1 = require("tslib");
var react_1 = tslib_1.__importDefault(require("react"));
var row_1 = require("./row");
var Hex = function (props) {
    var rows = props.rows, bytesper = props.bytesper;
    var pad = "000000";
    var rowsNode = rows.map(function (row, i) {
        var heading = "" + i * bytesper;
        heading = pad.substring(0, pad.length - heading.length) + heading;
        var idx = i;
        return react_1.default.createElement(row_1.Row, { key: "Row" + idx, sets: row, heading: heading });
    });
    return (react_1.default.createElement("div", { className: "hexviewer" },
        react_1.default.createElement("div", { className: "hex" }, rowsNode)));
};
exports.Hex = Hex;

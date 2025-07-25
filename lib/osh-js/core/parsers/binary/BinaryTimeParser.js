var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import TimeParser from "../common/TimeParser";
var BinaryTimeParser = /** @class */ (function (_super) {
    __extends(BinaryTimeParser, _super);
    function BinaryTimeParser() {
        return _super.call(this) || this;
    }
    BinaryTimeParser.prototype.parse = function (dataTypeParser, props, resultParent) {
        var token = dataTypeParser.nextToken(this.path);
        resultParent[this.name] = new Date(token * 1000).toISOString();
    };
    return BinaryTimeParser;
}(TimeParser));
export default BinaryTimeParser;
//# sourceMappingURL=BinaryTimeParser.js.map
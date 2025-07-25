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
import JsonDataParser from "../../../parsers/JsonDataParser";
var OmJsonParser = /** @class */ (function (_super) {
    __extends(OmJsonParser, _super);
    function OmJsonParser(rootElement) {
        return _super.call(this, rootElement) || this;
    }
    OmJsonParser.prototype.getTimeField = function () {
        return 'phenomenonTime';
    };
    return OmJsonParser;
}(JsonDataParser));
export default OmJsonParser;
//# sourceMappingURL=OmJsonParser.parser.js.map
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
import SweApiCollectionObjectParser from "./SweApiCollectionObjectParser";
import System from "../../../sweapi/system/System";
var SweApiFetchSystemParser = /** @class */ (function (_super) {
    __extends(SweApiFetchSystemParser, _super);
    function SweApiFetchSystemParser() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SweApiFetchSystemParser.prototype.parseData = function (data) {
        return new System(data, this.networkProperties);
    };
    return SweApiFetchSystemParser;
}(SweApiCollectionObjectParser));
export default SweApiFetchSystemParser;
//# sourceMappingURL=SweApiFetchSystem.parser.js.map
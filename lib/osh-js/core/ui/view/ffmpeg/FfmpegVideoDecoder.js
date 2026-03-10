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
import FfmpegDecoder from "./FfmpegDecoder.js";
var FfmpegVideoDecoder = /** @class */ (function (_super) {
    __extends(FfmpegVideoDecoder, _super);
    function FfmpegVideoDecoder(codec) {
        return _super.call(this, {
            codec: codec || 'h264',
            codecMap: {
                'h265': 'hevc'
            },
            pktDataAllocSize: 1024 * 3000
        }) || this;
    }
    FfmpegVideoDecoder.prototype.handleAvFrame = function (avFrame, pktSize, timestamp) {
        var frame_width = this.Module.getValue(avFrame + 68, 'i32');
        var frame_height = this.Module.getValue(avFrame + 72, 'i32');
        //console.log("Decoded Frame, W=" + frame_width + ", H=" + frame_height);
        // copy Y channel to canvas
        var frameYDataPtr = this.Module.getValue(avFrame, '*');
        var frameUDataPtr = this.Module.getValue(avFrame + 4, '*');
        var frameVDataPtr = this.Module.getValue(avFrame + 8, '*');
        return {
            frame_width: frame_width,
            frame_height: frame_height,
            frameYDataPtr: frameYDataPtr,
            frameUDataPtr: frameUDataPtr,
            frameVDataPtr: frameVDataPtr,
            frameYData: new Uint8Array(this.Module.HEAPU8.buffer.slice(frameYDataPtr, frameYDataPtr + frame_width * frame_height)),
            frameUData: new Uint8Array(this.Module.HEAPU8.buffer.slice(frameUDataPtr, frameUDataPtr + frame_width / 2 * frame_height / 2)),
            frameVData: new Uint8Array(this.Module.HEAPU8.buffer.slice(frameVDataPtr, frameVDataPtr + frame_width / 2 * frame_height / 2)),
            timestamp: timestamp,
            pktSize: pktSize,
            codec: this.codec
        };
    };
    return FfmpegVideoDecoder;
}(FfmpegDecoder));
export default FfmpegVideoDecoder;
//# sourceMappingURL=FfmpegVideoDecoder.js.map
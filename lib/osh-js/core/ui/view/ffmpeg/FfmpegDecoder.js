var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import OSH from './ffmpeg.js';
import { isDefined } from "../../../utils/Utils.js";
var FfmpegDecoder = /** @class */ (function () {
    function FfmpegDecoder(props) {
        this.codec = props.codec;
        this.released = false;
        this.initialized = false;
        this.initPromise = undefined;
        this.codecMap = props.codecMap || {};
        this.pktDataAllocSize = props.pktDataAllocSize;
    }
    FfmpegDecoder.prototype.terminate = function () { };
    FfmpegDecoder.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.initPromise) {
                    this.initPromise = new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, cod, codec;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _a = this;
                                    return [4 /*yield*/, OSH()];
                                case 1:
                                    _a.Module = _b.sent();
                                    cod = this.codec.toLowerCase();
                                    if (this.codec in this.codecMap) {
                                        cod = this.codecMap[this.codec];
                                    }
                                    codec = this.Module.ccall('avcodec_find_decoder_by_name', 'number', ['string'], [cod]);
                                    if (codec === 0) {
                                        console.error("Could not find ".concat(codec, " codec"));
                                    }
                                    // init codec and conversion context
                                    this.av_ctx = this.Module._avcodec_alloc_context3(codec);
                                    // this.av_ctx.flags2 |= (1 << 15);
                                    // open codec
                                    if (this.Module._avcodec_open2(this.av_ctx, codec, 0) < 0) {
                                        console.error("Could not initialize codec");
                                    }
                                    // allocate packet
                                    this.av_pkt = this.Module._malloc(96);
                                    this.av_pktData = this.Module._malloc(this.pktDataAllocSize);
                                    this.Module._av_init_packet(this.av_pkt);
                                    this.Module.setValue(this.av_pkt + 24, this.av_pktData, '*');
                                    // allocate video frame
                                    this.av_frame = this.Module._av_frame_alloc();
                                    if (!this.av_frame) {
                                        console.error("Could not allocate video frame");
                                        reject("Could not allocate video frame");
                                    }
                                    else {
                                        console.log('Decoder init OK with codec ' + this.codec.toLowerCase());
                                        this.initialized = true;
                                        resolve();
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                }
                return [2 /*return*/, this.initPromise];
            });
        });
    };
    FfmpegDecoder.prototype.decode = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var decodedFrame;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (message && message === 'release') {
                            this.release();
                            this.released = true;
                        }
                        if (this.released) {
                            return [2 /*return*/];
                        }
                        if (!!this.initialized) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.init()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        decodedFrame = this.decodePacket(message.pktSize, new Uint8Array(message.pktData, message.byteOffset, message.pktSize), message.timestamp, message.roll);
                        if (isDefined(decodedFrame)) {
                            decodedFrame.roll = message.roll;
                        }
                        return [2 /*return*/, decodedFrame];
                }
            });
        });
    };
    FfmpegDecoder.prototype.release = function () {
        this.Module._avcodec_close(this.av_ctx);
        this.Module._av_free(this.av_ctx);
        // instance._av_frame_free(self.av_frame);
    };
    FfmpegDecoder.prototype.decodePacket = function (pktSize, pktData, timestamp) {
        // prepare packet
        this.Module.setValue(this.av_pkt + 28, pktSize, 'i32');
        this.Module.writeArrayToMemory(pktData, this.av_pktData);
        // decode next frame
        if (this.Module._avcodec_send_packet(this.av_ctx, this.av_pkt) < 0) {
            console.warn("Error while sending frame for decoding");
            return;
        }
        if (this.Module._avcodec_receive_frame(this.av_ctx, this.av_frame) < 0) {
            console.warn("Error while decoding frame");
            return;
        }
        return this.handleAvFrame(this.av_frame, pktSize, timestamp);
    };
    // abstract
    FfmpegDecoder.prototype.handleAvFrame = function (avFrame, pktSize, timestamp) { };
    return FfmpegDecoder;
}());
export default FfmpegDecoder;
//# sourceMappingURL=FfmpegDecoder.js.map
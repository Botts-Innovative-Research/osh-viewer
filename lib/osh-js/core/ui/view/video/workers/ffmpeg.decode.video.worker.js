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
import FfmpegDecoder from "../../ffmpeg/FfmpegVideoDecoder.js";
import { isDefined } from "../../../../utils/Utils.js";
console.log('[ffmpeg worker] module loaded');
self.onerror = function (event) {
    try {
        self.postMessage({
            message: 'error',
            type: 'error',
            detail: {
                message: event === null || event === void 0 ? void 0 : event.message,
                filename: event === null || event === void 0 ? void 0 : event.filename,
                lineno: event === null || event === void 0 ? void 0 : event.lineno,
                colno: event === null || event === void 0 ? void 0 : event.colno
            }
        });
    }
    catch (err) {
        console.error('[ffmpeg worker] error handler failed', err);
    }
};
self.onunhandledrejection = function (event) {
    try {
        self.postMessage({
            message: 'error',
            type: 'unhandledrejection',
            detail: event === null || event === void 0 ? void 0 : event.reason
        });
    }
    catch (err) {
        console.error('[ffmpeg worker] unhandledrejection handler failed', err);
    }
};
var ffmpegDecoder;
var framesDecoded = 0;
self.onmessage = function (e) {
    return __awaiter(this, void 0, void 0, function () {
        var decodedFrame;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isDefined(e.data.message) && e.data.message === 'init') {
                        ffmpegDecoder = new FfmpegDecoder(e.data.codec);
                        framesDecoded = 0;
                        console.log('[ffmpeg worker] initialized', { codec: e.data.codec });
                        self.postMessage({ message: 'ready', codec: e.data.codec });
                    }
                    if (isDefined(e.data.message) && e.data.message === 'ping') {
                        self.postMessage({ message: 'pong', framesDecoded: framesDecoded });
                        return [2 /*return*/];
                    }
                    if (!isDefined(ffmpegDecoder)) return [3 /*break*/, 2];
                    if (e.data && e.data.pktData instanceof Uint8Array) {
                        e.data.pktData = e.data.pktData.buffer;
                        e.data.byteOffset = 0;
                    }
                    return [4 /*yield*/, ffmpegDecoder.decode(e.data)];
                case 1:
                    decodedFrame = _a.sent();
                    if (isDefined(decodedFrame)) {
                        framesDecoded += 1;
                        self.postMessage(decodedFrame, [
                            decodedFrame.frameYData.buffer,
                            decodedFrame.frameUData.buffer,
                            decodedFrame.frameVData.buffer
                        ]);
                    }
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
};
self.onerror = function (e) {
    console.log('closing worker');
};
//# sourceMappingURL=ffmpeg.decode.video.worker.js.map
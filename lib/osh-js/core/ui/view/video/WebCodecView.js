/***************************** BEGIN LICENSE BLOCK ***************************
 The contents of this file are subject to the Mozilla Public License, v. 2.0.
 If a copy of the MPL was not distributed with this file, You can obtain one
 at http://mozilla.org/MPL/2.0/.
 Software distributed under the License is distributed on an "AS IS" basis,
 WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 for the specific language governing rights and limitations under the License.
 Copyright (C) 2015-2020 Mathieu Dhainaut. All Rights Reserved.
 Author: Mathieu Dhainaut <mathieu.dhainaut@gmail.com>
 ******************************* END LICENSE BLOCK ***************************/
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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { isDefined, isWebWorker, randomUUID } from "../../../utils/Utils.js";
import '../../../resources/css/ffmpegview.css';
import CanvasView from "./CanvasView";
import { FrameType } from "./FrameType";
/**
 * This class is in charge of displaying H264 data by decoding ffmpeg.js library and displaying into them a YUV canvas.
 * @extends CanvasView
 * @example
 *
 import WebCodecView from 'core/ui/view/video/WebCodecView.js';

 let videoView = new WebCodecView({
  container: 'video-h264-container',
  css: 'video-h264',
  name: 'UAV Video',
  layers: [
      new DataLayer({
        dataSourceId: videoDataSource.id,
        getFrameData: (rec) => rec.videoFrame,
        getTimestamp: (rec) => rec.timestamp
      })
  ]
});
 */
var WebCodecView = /** @class */ (function (_super) {
    __extends(WebCodecView, _super);
    /**
     * Create a View.
     * @param {Object} [properties={}] - the properties of the view
     * @param {string} properties.container - The div element to attach to
     * @param {string} properties.css - The css classes to set, can be multiple if separate by spaces
     * @param {boolean} properties.visible - set the default behavior of the visibility of the view
     * @param {Object[]}  [properties.layers=[]] - The initial layers to add
     * @param {Boolean} [properties.showTime=false] - Enable or ignore the show timestamp text onto the canvas
     * @param {Boolean} [properties.showStats=false] - Enable or ignore the display stats (FPS number) onto the canvas
     * @param {String} [properties.codec='h264'] - Video codec
     */
    function WebCodecView(properties) {
        var _this = _super.call(this, __assign({ supportedLayers: ['videoData'] }, properties)) || this;
        if (!('VideoDecoder' in window)) {
            // WebCodecs API is not supported.
            throw Error('WebCodec API is not supported');
        }
        //https://developer.mozilla.org/en-US/docs/Web/Media/Formats/codecs_parameter
        // common VP8/ VP9/ H264 profiles. May not work depending on the video encoding profile
        //        case "H264":
        //           config.codec = "avc1.42002A";  // baseline profile, level 4.2
        //           config.avc = { format: "annexb" };
        //           config.pt = 1;
        //           break;
        //         case "H265":
        //           config.codec = "hvc1.1.6.L123.00"; // Main profile, level 4.1, main Tier
        //           config.hevc = { format: "annexb" };
        //           config.pt = 2;
        //           break;
        //         case "VP8":
        //           config.codec = "vp8";
        //           config.pt = 3;
        //           break;
        //         case "VP9":
        //           config.codec = "vp09.00.10.08"; //VP9, Profile 0, level 1, bit depth 8
        //           config.pt = 4;
        //           break;
        //         case "AV1":
        //           config.codec = "av01.0.08M.10.0.110.09" // AV1 Main Profile, level 4.0, Main tier, 10-bit content, non-monochrome, with 4:2:0 chroma subsampling
        //           config.pt = 5;
        //           break;
        //       }
        _this.codecMap = {
            'vp9': 'vp09.02.10.10.01.09.16.09.01',
            'vp8': 'vp08.00.41.08',
            'h264': 'avc1.42e01e',
            'h265': 'hev1.1.6.L123.00'
        };
        // default use H264 codec
        _this.codec = _this.codecMap['h264'];
        if (isDefined(properties.codec)) {
            if (!(properties.codec in _this.codecMap)) {
                throw Error("The codec properties.codec is not supported, the list of supported codec: this.codecMap");
            }
            else {
                _this.codec = _this.codecMap[properties.codec];
            }
        }
        _this.compression = properties.codec;
        // create webGL canvas
        _this.canvasElt = _this.createCanvas(_this.width, _this.height);
        _this.domNode.appendChild(_this.canvasElt);
        _this.queue = [];
        _this.seenKeyframe = false;
        return _this;
    }
    /**
     * Create <canvas> DOM element with some height/width/style
     * @protected
     * @param {String} width - the width
     * @param {String} height - the height
     * @param {String} style - the dom element style (Optional)
     */
    WebCodecView.prototype.createCanvas = function (width, height, style) {
        var canvasElement = document.createElement('canvas');
        canvasElement.setAttribute('width', width);
        canvasElement.setAttribute('height', height);
        if (isDefined(style)) {
            canvasElement.setAttribute('style', style);
        }
        return canvasElement;
    };
    WebCodecView.prototype.updateCanvasSize = function (width, height) {
        this.canvasElt.width = width;
        this.canvasElt.height = height;
    };
    WebCodecView.prototype.setData = function (dataSourceId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var values, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(data.type === 'videoData')) return [3 /*break*/, 4];
                        values = data.values;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < values.length)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.updateVideo(values[i])];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    WebCodecView.prototype.updateVideo = function (props) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.skipFrame) return [3 /*break*/, 2];
                        if (!this.codecConfigured) {
                            this.codec = this.codecMap[props.frameData.compression.toLowerCase()];
                            this.initDecoder();
                        }
                        return [4 /*yield*/, this.decode(props.frameData.data.length, props.frameData.data, props.timestamp, props.roll || 0)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Reset the view by drawing no data array into the YUV canvas.
     * @override
     */
    WebCodecView.prototype.reset = function () {
    };
    WebCodecView.prototype.initDecoder = function () {
        var _this = this;
        this.gl = this.canvasElt.getContext("bitmaprenderer");
        var init = {
            output: function (videoFrame) { return __awaiter(_this, void 0, void 0, function () {
                var isReconfigure, bitmap;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            isReconfigure = false;
                            if (this.width !== videoFrame.codedWidth || this.height !== videoFrame.codedHeight) {
                                this.width = videoFrame.codedWidth;
                                this.height = videoFrame.codedHeight;
                                this.updateCanvasSize(this.width, this.height);
                                isReconfigure = true;
                            }
                if (this.videoDecoder.state === 'closed' || isReconfigure) {
                    var config = {
                        codec: this.codec,
                        codedWidth: this.width,
                        codedHeight: this.height,
                    };
                    if (this.codec === this.codecMap['h264']) {
                        config.avc = { format: "annexb" };
                    }
                    this.videoDecoder.configure(config);
                    this.seenKeyframe = false;
                            }
                            return [4 /*yield*/, createImageBitmap(videoFrame)];
                        case 1:
                            bitmap = _a.sent();
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, , 4, 5]);
                            return [4 /*yield*/, this.handleDocodedFrame(bitmap, this.width, this.height, videoFrame.timestamp, this.queue.shift())];
                        case 3:
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            videoFrame.close();
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            }); },
            error: function (error) {
                _this.queue.shift();
                console.error(error);
                if (_this.videoDecoder.state === 'closed') {
                    _this.initDecoder();
                }
            }
        };
        try {
            this.videoDecoder = new VideoDecoder(init);
            var config = {
                codec: this.codec,
                codedWidth: this.width,
                codedHeight: this.height,
            };
            if (this.codec === this.codecMap['h264']) {
                config.avc = { format: "annexb" };
            }
            this.videoDecoder.configure(config);
            this.codecConfigured = true;
            this.seenKeyframe = false;
        }
        catch (ex) {
            this.elementDiv.remove(); // remove reserved div element
            throw Error('Cannot configure WebCodec API VideoDecoder');
        }
    };
    WebCodecView.prototype.isAnnexB = function (pktData) {
        for (var i = 0; i + 3 < pktData.length; i++) {
            if (pktData[i] === 0 && pktData[i + 1] === 0) {
                if (pktData[i + 2] === 1 || (pktData[i + 2] === 0 && pktData[i + 3] === 1)) {
                    return true;
                }
            }
        }
        return false;
    };
    WebCodecView.prototype.convertAvcToAnnexB = function (pktData) {
        var total = 0;
        var offset = 0;
        while (offset + 4 <= pktData.length) {
            var nalSize = ((pktData[offset] << 24) | (pktData[offset + 1] << 16) | (pktData[offset + 2] << 8) | pktData[offset + 3]) >>> 0;
            if (nalSize <= 0 || offset + 4 + nalSize > pktData.length) {
                return pktData;
            }
            total += 4 + nalSize;
            offset += 4 + nalSize;
        }
        if (total === 0) {
            return pktData;
        }
        var out = new Uint8Array(total);
        offset = 0;
        var writeOffset = 0;
        while (offset + 4 <= pktData.length && writeOffset + 4 <= total) {
            var nalSize = ((pktData[offset] << 24) | (pktData[offset + 1] << 16) | (pktData[offset + 2] << 8) | pktData[offset + 3]) >>> 0;
            if (nalSize <= 0 || offset + 4 + nalSize > pktData.length) {
                break;
            }
            out[writeOffset] = 0;
            out[writeOffset + 1] = 0;
            out[writeOffset + 2] = 0;
            out[writeOffset + 3] = 1;
            out.set(pktData.subarray(offset + 4, offset + 4 + nalSize), writeOffset + 4);
            writeOffset += 4 + nalSize;
            offset += 4 + nalSize;
        }
        return out;
    };
    WebCodecView.prototype.handleDocodedFrame = function (videoFrame, width, height, timestamp, queueElt) {
        if (timestamp === void 0) { timestamp = 0; }
        if (queueElt === void 0) { queueElt = null; }
        return __awaiter(this, void 0, void 0, function () {
            var roll, scale, angleRad;
            return __generator(this, function (_a) {
                try {
                    roll = Math.round(queueElt.roll / 90) * 90;
                    if (roll > 180)
                        roll -= 360;
                    scale = 1.0;
                    if (Math.abs(roll) === 90) {
                        scale = this.height / this.width;
                    }
                    angleRad = roll * Math.PI / 180.;
                    if ((this.angleRad && this.angleRad !== angleRad) || (this.scale && this.scale !== scale) || !this.angleRad || !this.scale) {
                        this.canvasElt.style = "transform:rotate(".concat(angleRad, "rad) scale(").concat(scale, ")");
                        this.angleRad = angleRad;
                        this.scale = scale;
                    }
                    this.gl.transferFromImageBitmap(videoFrame);
                    // update stats
                    this.onAfterDecoded(videoFrame, FrameType.ARRAY);
                    this.updateStatistics(queueElt.pktSize);
                    if (this.showTime) {
                        this.textFpsDiv.innerText = new Date(timestamp).toISOString() + ' ';
                    }
                    if (this.showStats) {
                        this.textStatsDiv.innerText = this.statistics.averageFps.toFixed(2) + ' fps, ' +
                            (this.statistics.averageBitRate / 1000).toFixed(2) + ' kB/s @' +
                            width + "x" + height + '\n ' + this.compression;
                    }
                    this.onUpdated(this.statistics);
                }
                catch (exception) {
                    console.error(exception);
                    //continue;
                }
                return [2 /*return*/];
            });
        });
    };
    WebCodecView.prototype.isH264Keyframe = function (pktData) {
        // Scan for Annex B start codes and IDR (nal_type 5) to mark keyframes.
        for (var i = 0; i + 4 < pktData.length; i++) {
            if (pktData[i] === 0 && pktData[i + 1] === 0) {
                var offset = -1;
                if (pktData[i + 2] === 1) {
                    offset = i + 3;
                }
                else if (pktData[i + 2] === 0 && pktData[i + 3] === 1) {
                    offset = i + 4;
                }
                if (offset !== -1 && offset < pktData.length) {
                    var nalType = pktData[offset] & 0x1f;
                    if (nalType === 5) {
                        return true;
                    }
                }
            }
        }
        return false;
    };
    /**
     * @private
     * @param pktSize
     * @param pktData
     * @param timestamp
     */
    WebCodecView.prototype.decode = function (pktSize, pktData, timestamp, roll) {
        return __awaiter(this, void 0, void 0, function () {
            var key, chunk;
            return __generator(this, function (_a) {
                if (this.codecConfigured) {
                    key = false;
                    var data = pktData;
                    if (this.codec === this.codecMap['h264']) {
                        if (!this.isAnnexB(pktData)) {
                            data = this.convertAvcToAnnexB(pktData);
                        }
                        key = this.isH264Keyframe(data);
                        if (!this.seenKeyframe && !key) {
                            return [2 /*return*/];
                        }
                    }
                    this.queue.push({
                        roll: roll,
                        pktSize: pktSize
                    });
                    chunk = new EncodedVideoChunk({
                        timestamp: timestamp,
                        type: key ? 'key' : 'delta',
                        data: data
                    });
                    this.videoDecoder.decode(chunk);
                    if (key) {
                        this.seenKeyframe = true;
                    }
                }
                else {
                    console.warn('decoder has not been initialized yet');
                }
                return [2 /*return*/];
            });
        });
    };
    WebCodecView.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        if (this.videoDecoder) {
            this.videoDecoder.close();
        }
    };
    WebCodecView.prototype.getCanvas = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasElt];
            });
        });
    };
    return WebCodecView;
}(CanvasView));
export default WebCodecView;
//# sourceMappingURL=WebCodecView.js.map
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

import {isDefined, isWebWorker, randomUUID} from "../../../utils/Utils.js";
import '../../../resources/css/ffmpegview.css';
import CanvasView from "./CanvasView";
import {FrameType} from "./FrameType";

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

class WebCodecView extends CanvasView {
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
    constructor(properties) {
        super({
            supportedLayers: ['videoData'],
            ...properties
        });

        if (!('VideoEncoder' in window)) {
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
        this.codecMap = {
            'vp9':  'vp09.02.10.10.01.09.16.09.01',
            'vp8':  'vp08.00.41.08',
            'h264': 'avc1.42e01e',
            'avc':  'avc1.42e01e',
            'h265': 'hev1.1.6.L123.00',
            'hevc': 'hev1.1.6.L123.00'
        };

        // default use H264 codec
        this.codec = this.codecMap['h264'];

        if(isDefined(properties.codec)) {
            if(!(properties.codec in this.codecMap)) {
                throw Error(`The codec properties.codec is not supported, the list of supported codec: this.codecMap`);
            } else {
                this.codec = this.codecMap[properties.codec];
            }
        }
        this.compression = properties.codec;

        // create webGL canvas
        this.canvasElt = this.createCanvas(this.width, this.height);
        this.domNode.appendChild(this.canvasElt);

        this.queue = [];
        this.seenKeyframe = false;
        this.h264Sps = null;
        this.h264Pps = null;
        this.h265Vps = null;
        this.h265Sps = null;
        this.h265Pps = null;
    }
    /**
     * Create <canvas> DOM element with some height/width/style
     * @protected
     * @param {String} width - the width
     * @param {String} height - the height
     * @param {String} style - the dom element style (Optional)
     */
    createCanvas(width, height, style) {
        const canvasElement = document.createElement('canvas');
        canvasElement.setAttribute('width', width);
        canvasElement.setAttribute('height', height);
        if (isDefined(style)) {
            canvasElement.setAttribute('style', style);
        }
        return canvasElement;
    }

    updateCanvasSize(width, height) {
        this.canvasElt.width = width;
        this.canvasElt.height = height;
    }

    async setData(dataSourceId, data) {
        if(data.type === 'videoData') {
            const values = data.values;
            for(let i=0;i < values.length;i++) {
                await this.updateVideo(values[i]);
            }
        }
    }
    async updateVideo(props) {
        if (!this.skipFrame) {
            if (!this.loggedFirstUpdateVideo) {
                this.loggedFirstUpdateVideo = true;
                const fdKeys = props && props.frameData ? Object.keys(props.frameData) : [];
                const propsKeys = props ? Object.keys(props) : [];
                console.log('[WebCodecView] first updateVideo call', {
                    propsKeys,
                    frameDataKeys: fdKeys,
                    frameData: (() => {
                        const clone = {};
                        if (props && props.frameData) {
                            for (const k of fdKeys) {
                                const v = props.frameData[k];
                                if (v && (v instanceof Uint8Array || v instanceof ArrayBuffer || (v && typeof v.length === 'number' && v.length > 64))) {
                                    clone[k] = `<${v.constructor ? v.constructor.name : 'binary'} length=${v.length || v.byteLength}>`;
                                } else {
                                    clone[k] = v;
                                }
                            }
                        }
                        return clone;
                    })(),
                    fullProps: (() => {
                        const clone = {};
                        for (const k of propsKeys) {
                            if (k === 'frameData') continue;
                            clone[k] = props[k];
                        }
                        return clone;
                    })()
                });
            }
            if (!this.codecConfigured) {
                const streamCodec = props.frameData.compression.toLowerCase();
                if (streamCodec in this.codecMap) {
                    this.codec = this.codecMap[streamCodec];
                    this.compression = streamCodec;
                }
                this.initDecoder();
            }

            await this.decode(
                props.frameData.data.length,
                props.frameData.data,
                props.timestamp,
                props.roll || 0
            );
        }
    }

    /**
     * Reset the view by drawing no data array into the YUV canvas.
     * @override
     */
    reset() {
    }

    initDecoder() {
        this.gl = this.canvasElt.getContext("bitmaprenderer");

        const init = {
            output: async (videoFrame) => {
                if (!this.loggedFirstOutput) {
                   this.loggedFirstOutput = true;
                   console.log('[WebCodecView] first decoded frame', { codec: this.codec, codedWidth: videoFrame.codedWidth, codedHeight: videoFrame.codedHeight, timestamp: videoFrame.timestamp });
                }

                if (this.width !== videoFrame.codedWidth || this.height !== videoFrame.codedHeight) {
                    this.width = videoFrame.codedWidth;
                    this.height = videoFrame.codedHeight;
                }
                const bitmap = await createImageBitmap(videoFrame);
                try {
                    await this.handleDecodedFrame(bitmap, this.width, this.height, videoFrame.timestamp, this.queue.shift());
                } finally {
                    videoFrame.close();
                }
            },
            error: (error) => {
                this.queue.shift();
                console.error('[WebCodecView] VideoDecoder error', {
                    codec: this.codec,
                    compression: this.compression,
                    state: this.videoDecoder && this.videoDecoder.state,
                    message: error && error.message,
                    name: error && error.name,
                    error
                });
                if(this.videoDecoder.state === 'closed') {
                    this.initDecoder();
                }
            }
        };
        try {
            this.videoDecoder = new VideoDecoder(init);
            const config = {
                codec: this.codec,
                codedWidth: this.width,
                codedHeight: this.height,
            };
            if (this.codec === this.codecMap['h264']) {
                config.avc = { format: "annexb" };
            } else if (this.codec === this.codecMap['h265']) {
                config.hevc = { format: "annexb" };
            }

            this.videoDecoder.configure(config);
            this.codecConfigured = true;
            this.seenKeyframe = false;
            this.h264Sps = null;
            this.h264Pps = null;
            this.h265Vps = null;
            this.h265Sps = null;
            this.h265Pps = null;
        }catch (ex) {
            this.elementDiv.remove(); // remove reserved div element
            throw Error('Cannot configure WebCodec API VideoDecoder');
        }
    }

    isAnnexB(pktData) {
        for (let i = 0; i + 3 < pktData.length; i++) {
            if (pktData[i] === 0 && pktData[i + 1] === 0) {
                if (pktData[i + 2] === 1 || (pktData[i + 2] === 0 && pktData[i + 3] === 1)) {
                    return true;
                }
            }
        }
        return false;
    }

    convertLengthPrefixedToAnnexB(pktData) {
        let total = 0;
        let offset = 0;

        while (offset + 4 <= pktData.length) {
            const nalSize = ((pktData[offset] << 24) | (pktData[offset + 1] << 16) | (pktData[offset + 2] << 8) | pktData[offset + 3]) >>> 0;
            if (nalSize <= 0 || offset + 4 + nalSize > pktData.length) {
                return pktData;
            }
            total += 4 + nalSize;
            offset += 4 + nalSize;
        }
        if (total === 0) {
            return pktData;
        }
        const out = new Uint8Array(total);
        offset = 0;
        let writeOffset = 0;
        while (offset + 4 <= pktData.length && writeOffset + 4 <= total) {
            const nalSize = ((pktData[offset] << 24) | (pktData[offset + 1] << 16) | (pktData[offset + 2] << 8) | pktData[offset + 3]) >>> 0;
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
    }

    getAnnexBNalUnits(pktData) {
        const units = [];
        const starts = [];
        for (let i = 0; i + 3 < pktData.length; i++) {
            if (pktData[i] === 0 && pktData[i + 1] === 0) {
                if (pktData[i + 2] === 1 || (pktData[i + 2] === 0 && pktData[i + 3] === 1)) {
                    starts.push(i);
                }
            }
        }
        for (let i = 0; i < starts.length; i++) {
            const start = starts[i];
            const startCodeSize = pktData[start + 2] === 1 ? 3 : 4;
            const nalStart = start + startCodeSize;
            const nalEnd = i + 1 < starts.length ? starts[i + 1] : pktData.length;
            if (nalStart < nalEnd) {
                const nal = pktData.subarray(nalStart, nalEnd);
                const type = nal[0] & 0x1f;
                units.push({ type, data: nal });
            }
        }
        return units;
    }

    cacheH264ParameterSets(pktData) {
        const units = this.getAnnexBNalUnits(pktData);
        for (const unit of units) {
            if (unit.type === 7) {
                this.h264Sps = unit.data.slice();
            } else if (unit.type === 8) {
                this.h264Pps = unit.data.slice();
            }
        }
    }

    hasH264ParameterSets() {
        return !!(this.h264Sps && this.h264Pps);
    }

    prependH264ParameterSets(pktData) {
        const units = this.getAnnexBNalUnits(pktData);
        const hasSps = units.some(unit => unit.type === 7);
        const hasPps = units.some(unit => unit.type === 8);
        if (hasSps && hasPps) {
            return pktData;
        }
        if (!this.hasH264ParameterSets()) {
            return pktData;
        }
        const startCode = new Uint8Array([0, 0, 0, 1]);
        const total =
            startCode.length + this.h264Sps.length +
            startCode.length + this.h264Pps.length +
            pktData.length;
        const out = new Uint8Array(total);
        let offset = 0;
        out.set(startCode, offset);
        offset += startCode.length;
        out.set(this.h264Sps, offset);
        offset += this.h264Sps.length;
        out.set(startCode, offset);
        offset += startCode.length;
        out.set(this.h264Pps, offset);
        offset += this.h264Pps.length;
        out.set(pktData, offset);
        return out;
    }

    // HEVC NAL header is 2 bytes; type is 6 bits from the high byte: (nal[0] >> 1) & 0x3F.
    getAnnexBNalUnitsHevc(pktData) {
        const units = [];
        const starts = [];
        for (let i = 0; i + 3 < pktData.length; i++) {
            if (pktData[i] === 0 && pktData[i + 1] === 0) {
                if (pktData[i + 2] === 1 || (pktData[i + 2] === 0 && pktData[i + 3] === 1)) {
                    starts.push(i);
                }
            }
        }
        for (let i = 0; i < starts.length; i++) {
            const start = starts[i];
            const startCodeSize = pktData[start + 2] === 1 ? 3 : 4;
            const nalStart = start + startCodeSize;
            const nalEnd = i + 1 < starts.length ? starts[i + 1] : pktData.length;
            if (nalStart < nalEnd && nalStart < pktData.length) {
                const nal = pktData.subarray(nalStart, nalEnd);
                const type = (nal[0] >> 1) & 0x3f;
                units.push({ type, data: nal });
            }
        }
        return units;
    }

    cacheHevcParameterSets(pktData) {
        const units = this.getAnnexBNalUnitsHevc(pktData);
        for (const unit of units) {
            if (unit.type === 32) { // VPS_NUT
                this.h265Vps = unit.data.slice();
            } else if (unit.type === 33) { // SPS_NUT
                this.h265Sps = unit.data.slice();
            } else if (unit.type === 34) { // PPS_NUT
                this.h265Pps = unit.data.slice();
            }
        }
    }

    hasHevcParameterSets() {
        return !!(this.h265Vps && this.h265Sps && this.h265Pps);
    }

    prependHevcParameterSets(pktData) {
        const units = this.getAnnexBNalUnitsHevc(pktData);
        const hasVps = units.some(unit => unit.type === 32);
        const hasSps = units.some(unit => unit.type === 33);
        const hasPps = units.some(unit => unit.type === 34);
        if (hasVps && hasSps && hasPps) {
            return pktData;
        }
        if (!this.hasHevcParameterSets()) {
            return pktData;
        }
        const startCode = new Uint8Array([0, 0, 0, 1]);
        const total =
            startCode.length + this.h265Vps.length +
            startCode.length + this.h265Sps.length +
            startCode.length + this.h265Pps.length +
            pktData.length;
        const out = new Uint8Array(total);
        let offset = 0;
        out.set(startCode, offset);
        offset += startCode.length;
        out.set(this.h265Vps, offset);
        offset += this.h265Vps.length;
        out.set(startCode, offset);
        offset += startCode.length;
        out.set(this.h265Sps, offset);
        offset += this.h265Sps.length;
        out.set(startCode, offset);
        offset += startCode.length;
        out.set(this.h265Pps, offset);
        offset += this.h265Pps.length;
        out.set(pktData, offset);
        return out;
    }

    // HEVC random-access points: NAL types 16..23 (BLA_W_LP..RSV_IRAP_VCL23),
    // including IDR_W_RADL (19), IDR_N_LP (20), and CRA_NUT (21).
    isHevcKeyframe(pktData) {
        const units = this.getAnnexBNalUnitsHevc(pktData);
        for (const unit of units) {
            if (unit.type >= 16 && unit.type <= 23) {
                return true;
            }
        }
        return false;
    }

    async handleDecodedFrame(videoFrame, width, height, timestamp = 0, queueElt = null) {
        try {
            // draw image
            let roll = Math.round(queueElt.roll/90) * 90;
            if (roll > 180) roll -= 360;
            let scale = 1.0;
            if (Math.abs(roll) === 90) {
                scale = this.height / this.width;
            }
            const angleRad = roll*Math.PI/180.;
            if((this.angleRad && this.angleRad !== angleRad) || (this.scale && this.scale !== scale) || !this.angleRad || !this.scale) {
                this.canvasElt.style = `transform:rotate(${angleRad}rad) scale(${scale})`;
                this.angleRad = angleRad;
                this.scale = scale;
            }

            this.gl.transferFromImageBitmap(videoFrame);

            // update stats
            this.onAfterDecoded(videoFrame, FrameType.ARRAY);
            this.updateStatistics(queueElt.pktSize);
            if(this.showTime) {
                this.textFpsDiv.innerText = new Date(timestamp).toISOString()+' ';
            }
            if(this.showStats) {
                this.textStatsDiv.innerText  = this.statistics.averageFps.toFixed(2) + ' fps, ' +
                    (this.statistics.averageBitRate/1000).toFixed(2)+' kB/s @'+
                    width+"x"+height+'\n '+this.compression;
            }
            this.onUpdated(this.statistics);
        } catch (exception) {
            console.error(exception);
            //continue;
        }
    }

    /**
     * @private
     * @param pktSize
     * @param pktData
     * @param timestamp
     */
    isH264Keyframe(pktData) {
        // Scan for Annex B start codes and IDR (nal_type 5) to mark keyframes.
        for (let i = 0; i + 4 < pktData.length; i++) {
            if (pktData[i] === 0 && pktData[i + 1] === 0) {
                let offset = -1;
                if (pktData[i + 2] === 1) {
                    offset = i + 3;
                } else if (pktData[i + 2] === 0 && pktData[i + 3] === 1) {
                    offset = i + 4;
                }
                if (offset !== -1 && offset < pktData.length) {
                    const nalType = pktData[offset] & 0x1f;
                    if (nalType === 5) {
                        return true;
                    }
                }
            }
        }
        return false;
    }


    async decode(pktSize, pktData, timestamp, roll) {
        if (this.codecConfigured) {
            let key = false;
            let dataView = pktData instanceof Uint8Array ? pktData : new Uint8Array(pktData);

            if(this.codec === this.codecMap['h264']) {
                if (!this.isAnnexB(dataView)) {
                    dataView = this.convertLengthPrefixedToAnnexB(dataView);
                }
                this.cacheH264ParameterSets(dataView);
                key = this.isH264Keyframe(dataView);
                if (!this.seenKeyframe) {
                    if (!this.hasH264ParameterSets()) {
                        return;
                    }
                    if (!key) {
                        return;
                    }
                    dataView = this.prependH264ParameterSets(dataView);
                }
            } else if (this.codec === this.codecMap['h265']) {
                const wasAnnexB = this.isAnnexB(dataView);
                if (!wasAnnexB) {
                    dataView = this.convertLengthPrefixedToAnnexB(dataView);
                }
                const preCache = {
                    vps: !!this.h265Vps,
                    sps: !!this.h265Sps,
                    pps: !!this.h265Pps
                };
                this.cacheHevcParameterSets(dataView);
                key = this.isHevcKeyframe(dataView);

                const postCache = {
                    vps: !!this.h265Vps,
                    sps: !!this.h265Sps,
                    pps: !!this.h265Pps
                };
                // Log loudly the moment a new param set or keyframe appears.
                if (postCache.vps !== preCache.vps || postCache.sps !== preCache.sps || postCache.pps !== preCache.pps) {
                    console.log('[WebCodecView] HEVC param set seen', { preCache, postCache });
                }
                if (key && !this.hevcKeyframeSeen) {
                    this.hevcKeyframeSeen = true;
                    const units = this.getAnnexBNalUnitsHevc(dataView);
                    console.log('[WebCodecView] HEVC first IRAP detected', { nalTypes: units.map(u => u.type) });
                }

                if (!this.loggedHevcDecodeStats || this.loggedHevcDecodeStats < 4) {
                    this.loggedHevcDecodeStats = (this.loggedHevcDecodeStats || 0) + 1;
                    const units = this.getAnnexBNalUnitsHevc(dataView);
                    const hexPreview = Array.from(dataView.subarray(0, Math.min(16, dataView.length)))
                        .map(b => b.toString(16).padStart(2, '0')).join(' ');
                    console.log('[WebCodecView] HEVC decode pkt', {
                        seq: this.loggedHevcDecodeStats,
                        size: dataView.length,
                        wasAnnexB,
                        nalTypes: units.map(u => u.type),
                        key,
                        preCache,
                        postCache,
                        hasParams: this.hasHevcParameterSets(),
                        seenKeyframe: this.seenKeyframe,
                        hexPreview
                    });
                }

                if (!this.seenKeyframe) {
                    if (!this.hasHevcParameterSets() || !key) {
                        this.hevcDropped = (this.hevcDropped || 0) + 1;
                        if (this.hevcDropped % 60 === 0) {
                            console.warn('[WebCodecView] HEVC waiting for keyframe + VPS/SPS/PPS', {
                                droppedSoFar: this.hevcDropped,
                                hasParams: this.hasHevcParameterSets(),
                                haveSeenAnyIrap: !!this.hevcKeyframeSeen
                            });
                        }
                        return;
                    }
                    dataView = this.prependHevcParameterSets(dataView);
                    console.log('[WebCodecView] HEVC tune-in: prepending cached VPS/SPS/PPS to first IRAP', {
                        droppedBeforeTuneIn: this.hevcDropped || 0
                    });
                }
            }

            this.queue.push({
                roll: roll,
                pktSize: pktSize
            });
            let chunk = new EncodedVideoChunk({
                timestamp: timestamp,
                type: key ? 'key' : 'delta',
                data: dataView
            });
            this.videoDecoder.decode(chunk);
            if (key) {
                this.seenKeyframe = true;
            }
        } else {
            console.warn('decoder has not been initialized yet');
        }
    }

    destroy() {
        super.destroy();
        if(this.videoDecoder) {
            this.videoDecoder.close();
        }
    }

    async getCanvas() {
        return this.canvasElt;
    }
}

export default WebCodecView;


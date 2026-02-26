import FfmpegDecoder from "../../ffmpeg/FfmpegVideoDecoder.js";
import {isDefined} from "../../../../utils/Utils.js";

console.log('[ffmpeg worker] module loaded');
self.onerror = (event) => {
    try {
        self.postMessage({
            message: 'error',
            type: 'error',
            detail: {
                message: event?.message,
                filename: event?.filename,
                lineno: event?.lineno,
                colno: event?.colno
            }
        });
    } catch (err) {
        console.error('[ffmpeg worker] error handler failed', err);
    }
};
self.onunhandledrejection = (event) => {
    try {
        self.postMessage({
            message: 'error',
            type: 'unhandledrejection',
            detail: event?.reason
        });
    } catch (err) {
        console.error('[ffmpeg worker] unhandledrejection handler failed', err);
    }
};

let ffmpegDecoder;
let framesDecoded = 0;

self.onmessage = async function (e) {
    if (isDefined(e.data.message) && e.data.message === 'init') {
        ffmpegDecoder = new FfmpegDecoder(e.data.codec);
        framesDecoded = 0;
        console.log('[ffmpeg worker] initialized', { codec: e.data.codec });
        self.postMessage({ message: 'ready', codec: e.data.codec });
    }

    if (isDefined(e.data.message) && e.data.message === 'ping') {
        self.postMessage({ message: 'pong', framesDecoded });
        return;
    }

    if (isDefined(ffmpegDecoder)) {
        if (e.data && e.data.pktData instanceof Uint8Array) {
            e.data.pktData = e.data.pktData.buffer;
            e.data.byteOffset = 0;
        }
        const decodedFrame = await ffmpegDecoder.decode(e.data);
        if (isDefined(decodedFrame)) {
            framesDecoded += 1;
            self.postMessage(decodedFrame,
                [
                    decodedFrame.frameYData.buffer,
                    decodedFrame.frameUData.buffer,
                    decodedFrame.frameVData.buffer
                ]);
        }
    }
}

self.onerror = (e) => {
    console.log('closing worker');
}

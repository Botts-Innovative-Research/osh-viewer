import FFMPEGView from './FFMPEGView';
import YUV360Canvas from './YUV360Canvas';

class FFMPEG360View extends FFMPEGView {
	constructor(properties) {
		super(properties);
	}

	createCanvas(width, height, style){
		return new YUV360Canvas({width: width, height: height, contextOptions: {preserveDrawingBuffer: true}});
	}
}

export default FFMPEG360View;
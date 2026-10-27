//@ts-ignore
import LoBLayer from 'osh-js/source/core/ui/layer/viewer/LoB.js';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export default class StyledLoBLayer extends LoBLayer {
	init(properties = this.properties) {
		super.init(properties);
		this.props.lineStyle = (properties?.lineStyle as LineStyle) ?? 'solid';
	}
}
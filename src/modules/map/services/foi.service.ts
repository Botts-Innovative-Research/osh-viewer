import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';

export async function setLayerData(layer: PointMarkerLayer): Promise<any> {
	await layer.setData(`${layer.id}`, [{ data: { timestamp: Date.now() } }]);
	const props = layer.getProps();
	if (props.values.length > 0) {
		return props.values[0];
	} else {
		return null;
	}
}

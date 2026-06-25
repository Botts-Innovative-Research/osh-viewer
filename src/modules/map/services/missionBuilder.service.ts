import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';

export async function setWaypointData(layer: typeof PointMarkerLayer): Promise<any> {
	await layer.setData('waypoint', [{ data: { timestamp: Date.now() } }]);
	const props = layer.getProps();
	if (props.values.length > 0) {
		return props.values[0];
	} else {
		return null;
	}
}

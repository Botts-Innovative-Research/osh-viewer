import * as Cesium from 'cesium';


function isPatterned(style?: string): boolean {
	return style === 'dashed' || style === 'dotted';
}


function leafletDashArray(style: string, weight: number = 1): string | null {
	const w = Math.max(weight, 1);
	if (style === 'dashed') return `${w * 3}, ${w * 2}`;
	if (style === 'dotted') return `1, ${w * 2}`;
	return null;
}

export function patchLeafletLineStyles(view: any) {
	if (!view || view.__lineStylePatched) return;
	const originalAdd = view.addPolyline.bind(view);

	view.addPolyline = (props: any) => {
		const polyline = originalAdd(props);
		if (isPatterned(props.lineStyle)) {
			polyline.setStyle({ dashArray: leafletDashArray(props.lineStyle, props.weight) });
		}
		return polyline;
	};
	view.__lineStylePatched = true;
}


export function patchCesiumLineStyles(view: any) {
	if (!view || view.__lineStylePatched) return;
	const originalAdd = view.addPolyline.bind(view);

	view.addPolyline = (props: any) => {
		const opacity = props.opacity ?? 1;
		if (!isPatterned(props.lineStyle) && opacity >= 1) return originalAdd(props);

		const id = props.id + '$' + props.polylineId;
		const positions = props.locations.map((p: any) =>
			Cesium.Cartesian3.fromDegrees(p.x, p.y, p.z)
		);
		const w = Math.max(props.weight || 1, 1);
		const color = Cesium.Color.fromCssColorString(props.color).withAlpha(opacity);

		const material = isPatterned(props.lineStyle)
			? Cesium.Material.fromType('PolylineDash', {
				color,
				gapColor: Cesium.Color.TRANSPARENT,
				dashLength: props.lineStyle === 'dotted' ? w * 2 : w * 8,
			})
			: Cesium.Material.fromType('Color', { color });
		const appearance = new Cesium.PolylineMaterialAppearance({ material });

		const primitive = props.clampToGround
			? new Cesium.GroundPolylinePrimitive({
				geometryInstances: new Cesium.GeometryInstance({
					geometry: new Cesium.GroundPolylineGeometry({
						positions,
						width: w,
						loop: false,
					}),
					id,
				}),
				appearance,
				asynchronous: false,
				show: props.visible,
			})
			: new Cesium.Primitive({
				geometryInstances: new Cesium.GeometryInstance({
					geometry: new Cesium.PolylineGeometry({
						positions,
						width: w,
						vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT,
					}),
					id,
				}),
				appearance,
				asynchronous: false,
				show: props.visible,
			});

		view.viewer.scene.primitives.add(primitive);
		return primitive;
	};
	view.__lineStylePatched = true;
}
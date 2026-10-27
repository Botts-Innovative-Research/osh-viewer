import {
	Color,
	Material,
	GeometryInstance,
	GroundPolylineGeometry,
	GroundPolylinePrimitive,
	PolylineGeometry,
	PolylineMaterialAppearance,
	Primitive,
	Cartesian3,
} from '@cesium/engine';

/**
 * Adds dashed/dotted line support to osh-js map views without modifying osh-js.
 * Wraps `addPolyline` on a single view instance. Solid lines fall through
 * to the original osh-js implementation untouched.
 */

const isPatterned = (style?: string) => style === 'dashed' || style === 'dotted';

function leafletDashArray(style: string, weight = 1): string | null {
	const w = Math.max(weight, 1);
	if (style === 'dashed') return `${w * 3}, ${w * 2}`;
	// Leaflet's default round lineCap turns a 1px dash into a round dot
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
		if (!isPatterned(props.lineStyle)) return originalAdd(props);

		const id = props.id + '$' + props.polylineId;
		const positions = props.locations.map((p: any) => Cartesian3.fromDegrees(p.x, p.y, p.z));
		const w = Math.max(props.weight || 1, 1);

		const material = Material.fromType('PolylineDash', {
			color: Color.fromCssColorString(props.color).withAlpha(props.opacity ?? 1),
			gapColor: Color.TRANSPARENT,
			dashLength: props.lineStyle === 'dotted' ? w * 2 : w * 8,
		});
		const appearance = new PolylineMaterialAppearance({ material });

		const primitive = props.clampToGround
			? new GroundPolylinePrimitive({
				geometryInstances: new GeometryInstance({
					geometry: new GroundPolylineGeometry({ positions, width: w, loop: false }),
					id,
				}),
				appearance,
				asynchronous: false,
				show: props.visible,
			})
			: new Primitive({
				geometryInstances: new GeometryInstance({
					geometry: new PolylineGeometry({
						positions,
						width: w,
						vertexFormat: PolylineMaterialAppearance.VERTEX_FORMAT,
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
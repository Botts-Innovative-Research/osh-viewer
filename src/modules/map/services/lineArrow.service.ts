import L from 'leaflet';
import { Cartesian3, Color, VerticalOrigin, HorizontalOrigin } from '@cesium/engine';


type LonLat = { x: number; y: number; z?: number };

const wantsArrow = (props: any) => !!props?.showArrow && props?.locations?.length >= 2;

const toRad = Math.PI / 180;

function bearingDeg(a: LonLat, b: LonLat): number {
	const lat1 = a.y * toRad;
	const lat2 = b.y * toRad;
	const dLon = (b.x - a.x) * toRad;
	const y = Math.sin(dLon) * Math.cos(lat2);
	const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
	return (Math.atan2(y, x) / toRad + 360) % 360;
}

function arrowPose(props: any) {
	const locs: LonLat[] = props.locations;
	const start = locs[locs.length - 2];
	const end = locs[locs.length - 1];
	// reverse of the bearing from end back to start = heading at the end point
	const heading = (bearingDeg(end, start) + 180) % 360;
	return { end, heading };
}

const arrowSize = (weight?: number) => Math.max((weight || 1) * 3, 12);

function triangleSvg(size: number, fill: string, opacity = 1) {
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 10 10">` +
		`<polygon points="5,0 10,10 5,7.5 0,10" fill="${fill}" fill-opacity="${opacity}"/></svg>`
	);
}



function leafletArrowIcon(props: any, heading: number) {
	const size = arrowSize(props.weight);
	return L.divIcon({
		className: 'lob-arrow', // replaces Leaflet's default white-box div-icon style
		iconSize: [size, size],
		iconAnchor: [size / 2, size / 2],
		html:
			`<div style="transform: rotate(${heading}deg); width:${size}px; height:${size}px;">` +
			triangleSvg(size, props.color, props.opacity ?? 1) +
			`</div>`,
	});
}

export function patchLeafletLineArrows(view: any) {
	if (!view || view.__lineArrowPatched) return;
	const originalAdd = view.addPolyline.bind(view);
	const originalUpdate = view.updatePolyline.bind(view);
	const originalRemove = view.removePolylineFromLayer.bind(view);

	view.addPolyline = (props: any) => {
		const polyline = originalAdd(props);
		if (wantsArrow(props)) {
			const { end, heading } = arrowPose(props);
			polyline.__arrow = L.marker([end.y, end.x], {
				icon: leafletArrowIcon(props, heading),
				interactive: false,
				keyboard: false,
			}).addTo(view.map);
		}
		return polyline;
	};

	view.updatePolyline = async (props: any) => {
		await originalUpdate(props);
		const polyline = view.getPolyline(props);
		if (polyline?.__arrow && wantsArrow(props)) {
			const { end, heading } = arrowPose(props);
			polyline.__arrow.setLatLng([end.y, end.x]);
			polyline.__arrow.setIcon(leafletArrowIcon(props, heading));
		}
	};

	view.removePolylineFromLayer = (polyline: any) => {
		if (polyline?.__arrow) {
			view.map.removeLayer(polyline.__arrow);
			polyline.__arrow = undefined;
		}
		return originalRemove(polyline);
	};

	view.__lineArrowPatched = true;
}

const CESIUM_ARROW_IMAGE =
	'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(triangleSvg(64, '#ffffff'));

export function patchCesiumLineArrows(view: any) {
	if (!view || view.__lineArrowPatched) return;
	const originalAdd = view.addPolyline.bind(view);
	const originalRemove = view.removePolylineFromLayer.bind(view);


	view.addPolyline = (props: any) => {
		const primitive = originalAdd(props);
		if (primitive && wantsArrow(props)) {
			const { end, heading } = arrowPose(props);
			const size = arrowSize(props.weight);
			primitive.__arrow = view.billboardCollection.add({
				position: Cartesian3.fromDegrees(end.x, end.y, props.clampToGround ? 0 : end.z ?? 0),
				image: CESIUM_ARROW_IMAGE,
				width: size,
				height: size,
				color: Color.fromCssColorString(props.color).withAlpha(props.opacity ?? 1),
				alignedAxis: Cartesian3.UNIT_Z,
				rotation: -heading * toRad,
				horizontalOrigin: HorizontalOrigin.CENTER,
				verticalOrigin: VerticalOrigin.CENTER,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				show: props.visible !== false,
			});
		}
		return primitive;
	};

	view.removePolylineFromLayer = (polyline: any) => {
		if (polyline?.__arrow) {
			view.billboardCollection.remove(polyline.__arrow);
			polyline.__arrow = undefined;
		}
		return originalRemove(polyline);
	};

	view.__lineArrowPatched = true;
}
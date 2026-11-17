import L from 'leaflet';
import * as Cesium from 'cesium';


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

function lerpLonLat(a: LonLat, b: LonLat, t: number): LonLat {
	return {
		x: a.x + (b.x - a.x) * t,
		y: a.y + (b.y - a.y) * t,
		z: (a.z ?? 0) + ((b.z ?? 0) - (a.z ?? 0)) * t,
	};
}

function cesiumPosition(view: any, p: LonLat, clampToGround: boolean) {
	let height = p.z ?? 0;
	if (clampToGround) {
		const cartographic = Cesium.Cartographic.fromDegrees(p.x, p.y);
		height = view.viewer.scene.globe.getHeight(cartographic) ?? 0;
	}
	return Cesium.Cartesian3.fromDegrees(p.x, p.y, height);
}

const CESIUM_ARROW_IMAGE =
	'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(triangleSvg(64, '#ffffff'));

export function patchCesiumLineArrows(view: any) {
	if (!view || view.__lineArrowPatched) return;
	const originalAdd = view.addPolyline.bind(view);
	const originalRemove = view.removePolylineFromLayer.bind(view);

	const arrows = new Set<any>();
	const scratchBack = new Cesium.Cartesian2();
	const scratchEnd = new Cesium.Cartesian2();

	view.viewer.scene.preRender.addEventListener((scene: any) => {
		for (const arrow of arrows) {
			const { start, end, clampToGround } = arrow.__lineInfo;
			const endPos = cesiumPosition(view, end, clampToGround);
			const backPos = cesiumPosition(view, lerpLonLat(start, end, 0.9), clampToGround);
			arrow.position = endPos;

			const back = scene.cartesianToCanvasCoordinates(backPos, scratchBack);
			const tip = scene.cartesianToCanvasCoordinates(endPos, scratchEnd);
			if (!back || !tip) continue;

			const dx = tip.x - back.x;
			const dy = tip.y - back.y;
			if (dx === 0 && dy === 0) continue;

			arrow.rotation = Math.atan2(-dy, dx) - Math.PI / 2;
		}
	});

	view.addPolyline = (props: any) => {
		const primitive = originalAdd(props);
		if (primitive && wantsArrow(props)) {
			const locs: LonLat[] = props.locations;
			const start = locs[locs.length - 2];
			const end = locs[locs.length - 1];
			const size = arrowSize(props.weight);

			const arrow = view.billboardCollection.add({
				position: cesiumPosition(view, end, !!props.clampToGround),
				image: CESIUM_ARROW_IMAGE,
				width: size,
				height: size,
				color: Cesium.Color.fromCssColorString(props.color).withAlpha(props.opacity ?? 1),
				rotation: 0,
				horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
				verticalOrigin: Cesium.VerticalOrigin.CENTER,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				show: props.visible !== false,
			});
			arrow.__lineInfo = { start, end, clampToGround: !!props.clampToGround };
			arrows.add(arrow);
			primitive.__arrow = arrow;
		}
		return primitive;
	};

	view.removePolylineFromLayer = (polyline: any) => {
		if (polyline?.__arrow) {
			arrows.delete(polyline.__arrow);
			view.billboardCollection.remove(polyline.__arrow);
			polyline.__arrow = undefined;
		}
		return originalRemove(polyline);
	};

	view.__lineArrowPatched = true;
}


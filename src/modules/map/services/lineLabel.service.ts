import {
	Cartesian3,
	Color,
	HorizontalOrigin,
	LabelStyle,
	VerticalOrigin,
} from '@cesium/engine';

/**
 * Draws a text label at the midpoint of polylines whose props have `showLabel: true`.
 * Like lineStyle.service.ts, this wraps methods on a single osh-js view instance
 * instead of modifying osh-js. Lines without `showLabel` are untouched.
 */

const wantsLabel = (props: any) => !!props?.showLabel && !!props?.label;

export function patchLeafletLineLabels(view: any) {
	if (!view || view.__lineLabelPatched) return;
	const originalAdd = view.addPolyline.bind(view);
	const originalUpdate = view.updatePolyline.bind(view);

	view.addPolyline = (props: any) => {
		const polyline = originalAdd(props);
		if (wantsLabel(props)) {
			// A permanent tooltip on a path sits at the path's center
			polyline.bindTooltip(props.label, {
				permanent: true,
				direction: 'center',
				interactive: false,
			});
		}
		return polyline;
	};

	// Leaflet moves the existing line on updates, so the label has to be re-centered
	view.updatePolyline = async (props: any) => {
		await originalUpdate(props);
		const polyline = view.getPolyline(props);
		if (polyline?.getTooltip()) {
			polyline.setTooltipContent(props.label);
			polyline.openTooltip(); // recomputes position from the line's current center
		}
	};

	view.__lineLabelPatched = true;
}

export function patchCesiumLineLabels(view: any) {
	if (!view || view.__lineLabelPatched) return;
	const originalAdd = view.addPolyline.bind(view);
	const originalRemove = view.removePolylineFromLayer.bind(view);

	// CesiumView rebuilds the line on every update (remove + add),
	// so the label is created with the line and removed with it.
	view.addPolyline = (props: any) => {
		const primitive = originalAdd(props);
		if (primitive && wantsLabel(props) && props.locations?.length >= 2) {
			const a = props.locations[0];
			const b = props.locations[props.locations.length - 1];
			const height = props.clampToGround ? 0 : ((a.z ?? 0) + (b.z ?? 0)) / 2;

			primitive.__lineLabel = view.labelCollection.add({
				position: Cartesian3.fromDegrees((a.x + b.x) / 2, (a.y + b.y) / 2, height),
				text: props.label,
				font: '14px sans-serif',
				fillColor: Color.WHITE,
				outlineColor: Color.BLACK,
				outlineWidth: 2,
				style: LabelStyle.FILL_AND_OUTLINE,
				showBackground: true,
				backgroundColor: Color.BLACK.withAlpha(0.5),
				horizontalOrigin: HorizontalOrigin.CENTER,
				verticalOrigin: VerticalOrigin.CENTER,
				// keep it visible over terrain instead of being hidden by hills
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				show: props.visible !== false,
			});
		}
		return primitive;
	};

	view.removePolylineFromLayer = (polyline: any) => {
		if (polyline?.__lineLabel) {
			view.labelCollection.remove(polyline.__lineLabel);
			polyline.__lineLabel = undefined;
		}
		return originalRemove(polyline);
	};

	view.__lineLabelPatched = true;
}
import { useSettingsStore } from '@/stores/settingsstore';
import {
	VisualizationRegistry,
	VisualizationType,
} from '../visualization/registry/VisualizationRegistry';
import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';
import LoBLayer from 'osh-js/source/core/ui/layer/viewer/LoB.js';
import EllipseLayer from 'osh-js/source/core/ui/layer/EllipseLayer';
import PolylineLayer from 'osh-js/source/core/ui/layer/PolylineLayer';
import FrustumLayer from 'osh-js/source/core/ui/layer/FrustumLayer';

export const SupportedMapLayers = {
	PointMarkerLayer: PointMarkerLayer,
	LoBLayer: LoBLayer,
	EllipseLayer: EllipseLayer,
	PolylineLayer: PolylineLayer,
	FrustumLayer: FrustumLayer,
} as const;
export type SupportedMapLayer = (typeof SupportedMapLayers)[keyof typeof SupportedMapLayers];

/**
 * Determine if a visualization type is compatible with the currently focused map
 * @param type
 * @returns
 */
export function isMapLayerCompatible(type: VisualizationType) {
	const settingsStore = useSettingsStore();
	const descriptor = VisualizationRegistry[type];
	if (!descriptor) return false;
	return descriptor.supportedMaps?.includes(settingsStore.focusedMap);
}

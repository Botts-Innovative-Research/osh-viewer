import { AudioDescriptor } from '../visualizations/audio/Descriptor';
import { ChartDescriptor } from '../visualizations/chart/Descriptor';
import { GeoPtzDescriptor } from '../visualizations/geoptz/Descriptor';
import { LobDescriptor } from '../visualizations/lob/Descriptor';
import { PointMarkerDescriptor } from '../visualizations/pointmarker/Descriptor';
import { TextDescriptor } from '../visualizations/text/Descriptor';
import { VideoDescriptor } from '../visualizations/video/Descriptor';
import { MissionDescriptor } from '@/modules/visualization/visualizations/mission/Descriptor';
import { VisualizationDescriptor } from './types';
import { EllipseDescriptor } from '../visualizations/ellipse/Descriptor';
import { SigIntDescriptor } from '../visualizations/sigint/Descriptor';
import { PolylineDescriptor } from '../visualizations/polyline/Descriptor';
import { FrustumDescriptor } from '../visualizations/frustum/Descriptor';
import { MiniMapDescriptor } from '../visualizations/minimap/Descriptor';

/**
 * Central registry for all visualizations available in the Visualization Wizard.
 * Each visualization must have a corresponding descriptor that defines its properties and builder function.
 */
export const VisualizationRegistry: { [key: string]: VisualizationDescriptor } = {
	[ChartDescriptor.id]: ChartDescriptor,
	[GeoPtzDescriptor.id]: GeoPtzDescriptor,
	[LobDescriptor.id]: LobDescriptor,
	[PointMarkerDescriptor.id]: PointMarkerDescriptor,
	[TextDescriptor.id]: TextDescriptor,
	[VideoDescriptor.id]: VideoDescriptor,
	[MissionDescriptor.id]: MissionDescriptor,
	[EllipseDescriptor.id]: EllipseDescriptor,
	[SigIntDescriptor.id]: SigIntDescriptor,
	[PolylineDescriptor.id]: PolylineDescriptor,
	[AudioDescriptor.id]: AudioDescriptor,
	[FrustumDescriptor.id]: FrustumDescriptor,
	[MiniMapDescriptor.id]: MiniMapDescriptor,
};

export type VisualizationType = keyof typeof VisualizationRegistry;

/**
 * Required structure for emits from visualization form components to the Visualization Wizard parent component
 * Handles validation status updates from form components to enable/disable navigation buttons and submission in the wizard
 */
export interface VisualizationComponentEmits {
	(event: 'update:valid', value: boolean): void;
}

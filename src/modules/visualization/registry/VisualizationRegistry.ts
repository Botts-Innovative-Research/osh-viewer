import { ChartDescriptor } from '../visualizations/chart/Descriptor';
import { GeoPtzDescriptor } from '../visualizations/geoptz/Descriptor';
import { LobDescriptor } from '../visualizations/lob/Descriptor';
import { PointMarkerDescriptor } from '../visualizations/pointmarker/Descriptor';
import { TextDescriptor } from '../visualizations/text/Descriptor';
import { VideoDescriptor } from '../visualizations/video/Descriptor';
import { MissionDescriptor } from '@/modules/visualization/visualizations/mission/Descriptor';
import { VisualizationDescriptor } from './types';

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
};

/**
 * Required structure for emits from visualization form components to the Visualization Wizard parent component
 * Handles validation status updates from form components to enable/disable navigation buttons and submission in the wizard
 */
export interface VisualizationComponentEmits {
	(event: 'update:valid', value: boolean): void;
}

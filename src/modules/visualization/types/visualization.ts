import {
	CustomizationOptions,
	IChartCustomizationOptions,
	IEllipseCustomizationOptions,
	ILineOfBearingCustomizationOptions,
	IPointMarkerCustomizationOptions,
	IVideoCustomizationOptions,
} from './customization';
import { IConSysApiControlStreamProperties, IConSysApiDataSourceProperties } from './datasource';
import {
	DataLayerProperties,
	ICurveLayerProperties,
	IEllipseLayerProperties,
	ILineOfBearingLayerProperties,
	IPointMarkerLayerProperties,
	IVideoLayerProperties,
} from './layers';
import { DataViewProperties, IChartViewProperties, IVideoViewProperties } from './views';

export interface VisualizationComponents {
	dataSource: IConSysApiDataSourceProperties[];
	dataLayer: VisualizationLayerProperties | VisualizationLayerProperties[];
	dataView?: VisualizationViewProperties | VisualizationViewProperties[];
	controlstream?: IConSysApiControlStreamProperties[]; // Optional controlstream for visualization
}

export type VisualizationLayerProperties =
	| DataLayerProperties
	| ICurveLayerProperties
	| IVideoLayerProperties
	| IPointMarkerLayerProperties
	| ILineOfBearingLayerProperties
	| IEllipseLayerProperties;

export type VisualizationViewProperties =
	| DataViewProperties
	| IChartViewProperties
	| IVideoViewProperties;

export type VisualizationCustomizationOptions =
	| CustomizationOptions
	| IPointMarkerCustomizationOptions
	| ILineOfBearingCustomizationOptions
	| IEllipseCustomizationOptions
	| IChartCustomizationOptions
	| IVideoCustomizationOptions;

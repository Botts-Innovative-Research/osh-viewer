import { ISweApiControlStreamProperties, ISweApiDataSourceProperties } from './datasource';
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
	dataSource: ISweApiDataSourceProperties[];
	dataLayer: VisualizationLayerProperties | VisualizationLayerProperties[];
	dataView?: VisualizationViewProperties | VisualizationViewProperties[];
	controlstream?: ISweApiControlStreamProperties[]; // Optional controlstream for visualization
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

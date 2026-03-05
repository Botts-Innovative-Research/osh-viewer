import { Component } from "vue";
import { ChartDescriptor } from "./visualizations/chart/Descriptor";
import { GeoPtzDescriptor } from "./visualizations/geoptz/Descriptor";
import { LobDescriptor } from "./visualizations/lob/Descriptor";
import { PointMarkerDescriptor } from "./visualizations/pointmarker/Descriptor";
import { TextDescriptor } from "./visualizations/text/Descriptor";
import { VideoDescriptor } from "./visualizations/video/Descriptor";

export const VisualizationRegistry: { [key: string]: VisualizationDescriptor } = {
  [ChartDescriptor.id]: ChartDescriptor,
  [GeoPtzDescriptor.id]: GeoPtzDescriptor,
  [LobDescriptor.id]: LobDescriptor,
  [PointMarkerDescriptor.id]: PointMarkerDescriptor,
  [TextDescriptor.id]: TextDescriptor,
  [VideoDescriptor.id]: VideoDescriptor
};


export type ViewLocation = 'panel' | 'map' | 'multi';

export interface VisualizationFormComponent {
  id: string;
  label: string;  // Title of the form step
  short: string;  // Short label for stepper header (Configure, Customize, etc.)
  component: Component | null;
}

export type VisualizationBuilderModule = () => void;

export interface VisualizationDescriptor {
  label: string;
  id: string;
  icon: string;
  viewLocation: ViewLocation;
  description: string;
  formComponents: VisualizationFormComponent[];
  builder: () => Promise<{default: VisualizationBuilderModule}>;
}

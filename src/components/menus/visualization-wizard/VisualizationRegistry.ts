import { Component } from "vue";
import { ChartDescriptor } from "./visualizations/chart/Descriptor";
import { GeoPtzDescriptor } from "./visualizations/geoptz/Descriptor";
import { LobDescriptor } from "./visualizations/lob/Descriptor";
import { PointMarkerDescriptor } from "./visualizations/pointmarker/Descriptor";
import { TextDescriptor } from "./visualizations/text/Descriptor";
import { VideoDescriptor } from "./visualizations/video/Descriptor";
import { P } from "vue-router/dist/router-CWoNjPRp.mjs";

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
  [VideoDescriptor.id]: VideoDescriptor
};

/**
 * Required structure for emits from visualization form components to the Visualization Wizard parent component
 * Handles validation status updates from form components to enable/disable navigation buttons and submission in the wizard
 */
export interface VisualizationComponentEmits {
  (event: "update:valid", value: boolean): void
}

/**
 * Define the location where the visualization should be rendered
 * - 'panel': should be rendered in the side panel
 * - 'map': should be rendered on the map
 * - 'multi': not tied to a specific location
 */
export type ViewLocation = 'panel' | 'map' | 'multi';

/**
 * Define the structure of a visualization form step component
 * - id: unique identifier for the form step (e.g. 'chart-config', 'chart-customize', etc.)
 * - label: title of the form step (e.g. 'Configure Chart Properties', 'Customize Chart', etc.)
 * - short: short label for stepper header (e.g., Configure, Customize, etc.)
 * - component: the Vue component to render for this form step
 */
export interface VisualizationFormComponent {
  id: string; // Standard: kebab-case, starting with visualization type (___-config, ___-customize, etc.)
  label: string;  // Standard: Title Case, starting with verbal action (Configure ___ Properties, Customize ___, etc.)
  short: string;  // Standard: Title Case, concise, no verbal action (Configure, Customize, etc.)
  component: Component | null;  // Vue component to render for this form step
}

/**
 * Define the structure of a visualization builder module
 * File must include a default export: build() => void;
 */
export type VisualizationBuilderModule = () => void;

/**
 * Define the structure of a visualization descriptor
 * - label: Display name of the visualization (e.g. 'Chart', 'GeoPTZ', etc.)
 * - id: Unique identifier for the visualization (e.g. 'chart', 'geoPtz', etc.)
 * - icon: Material Design Icon name (e.g. 'mdi-chart-line', 'mdi-map-marker', etc.)
 * - viewLocation: Where the visualization should be rendered (ViewLocation type)
 * - description: Short description of the visualization as helper text in the UI
 * - formComponents: Array of form components to render in the visualization wizard
 * - builder: Async function that imports the visualization's Builder.ts, which contains a default export build() to construct the visualization
 * - requireCs: Optional boolean flag to indicate if the visualization requires a controlstream
 */
export interface VisualizationDescriptor {
  label: string;
  id: string;
  icon: string;
  viewLocation: ViewLocation;
  description: string;
  formComponents: VisualizationFormComponent[];
  builder: () => Promise<{default: VisualizationBuilderModule}>;
  requireCs?: boolean; // Optional flag to indicate if the visualization requires a controlstream
}

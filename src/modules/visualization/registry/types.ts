import { OSHLayer } from '@/lib/OSHConnectDataStructs';
import { Component } from 'vue';

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
 * - roles?: optional config roles to pass as props to the component
 */
export interface VisualizationFormComponent {
	id: string; // Standard: kebab-case, starting with visualization type (___-config, ___-customize, etc.)
	label: string; // Standard: Title Case, starting with verbal action (Configure ___ Properties, Customize ___, etc.)
	short: string; // Standard: Title Case, concise, no verbal action (Configure, Customize, etc.)
	component: Component | null; // Vue component to render for this form step
	roles?: VisualizationConfigRole[]; // Optional config roles
}

/**
 * Define a "role" (e.g. location, bearing, etc.) for configuration
 * - role: the role name used in vizwiz
 * - label: the name of the role to display
 * - description: a short 1 sentence description of the role and its purpose in relation to the viz type
 * - type: Either "ds" or "cs" of whether to render a datasource or controlstream picker
 * - required?: whether the role is required, making it selected/checked by default
 * - showPropertySelector?: optional flag of whether the role asks to select properties (e.g. mission builder does not show property selector for any roles)
 * - multiple?: optional flag of whether the role can have multiple properties selected in ds/cs picker (e.g. Y-Axis role can have multiple properties)
 */
export interface VisualizationConfigRole {
	role: string;
	label: string;
	description: string;
	type: 'ds' | 'cs';
	required?: boolean; // Default: FALSE
	showPropertySelector?: boolean; // Default: TRUE
	multiple?: boolean; // Default: FALSE
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
 * - layers: Array of OSH layer types that this visualization contains (OSHLayer type), used for filtering
 * - description: Short description of the visualization as helper text in the UI
 * - formComponents: Array of form components to render in the visualization wizard
 * - builder: Async function that imports the visualization's Builder.ts, which contains a default export build() to construct the visualization
 * - supportsCs: Boolean flag to indicate if the visualization can support a controlstream if available
 * - requireCs: Boolean flag to indicate if the visualization REQUIRES a controlstream
 * - supportedMaps?: Optional array of supported map types, if map-related
 */
export interface VisualizationDescriptor {
	label: string;
	id: string;
	icon: string;
	viewLocation: ViewLocation;
	layers: OSHLayer[];
	description: string;
	formComponents: VisualizationFormComponent[];
	builder: () => Promise<{ default: VisualizationBuilderModule }>;
	supportsCs: boolean; // Optional flag to indicate if the visualization can support a controlstream if available
	requireCs: boolean; // Optional flag to indicate if the visualization requires a controlstream
	supportedMaps?: ('cesium' | 'leaflet')[]; // If map-related, specify what maps it is supported by
}

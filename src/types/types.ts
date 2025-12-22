/**
 * Interface for result of an operation/action
 */
export interface Result {
	message: string; // Message related to the result: success, error description, etc.
	code: number; // HTTP status code related to the result
}

/**
 * Type for PTZ command directions
 */
export type Direction =
	| 'up'
	| 'down'
	| 'left'
	| 'right'
	| 'up-left'
	| 'up-right'
	| 'down-left'
	| 'down-right'
	| 'home'
	| 'zoomIn'
	| 'zoomOut';

/**
 * Interface for Visualization Type definition
 */
export interface VisualizationType {
	value: string; // Value to identify the type
	label: string; // Label for type
	icon: string; // mdi icon name
}

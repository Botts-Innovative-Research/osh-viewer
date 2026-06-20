// prettier-ignore
// @ts-ignore
export const ICON_BASE = import.meta.env.VITE_VIEWER_ENDPOINT !== undefined ? import.meta.env.VITE_VIEWER_ENDPOINT : '';

type IconCategory = 'map' | 'geoptz' | 'foi' | 'waypoint';

/**
 * Uses directory /icons/${category}/${icon}.png
 * id - key ID for icon
 * label - Icon label name
 * icon - corresponds to mdi icon names AND png filenames in /icons
 * category - the directory under /icons where the icon is saved
 */
export type IconItem = {
	id: number;
	label: string;
	icon: string;
	category: IconCategory;
};

/**
 * Collection of icons used on map
 */
export const ICON_OPTIONS: IconItem[] = [
	// Map
	{ id: 1, label: 'Marker', icon: 'map-marker', category: 'map' },
	{ id: 2, label: 'Pin', icon: 'pin', category: 'map' },
	{ id: 3, label: 'Arrow', icon: 'arrow-up-bold', category: 'map' },
	{ id: 4, label: 'Antenna', icon: 'antenna', category: 'map' },
	{ id: 5, label: 'Camera', icon: 'camera-marker', category: 'map' },
	{ id: 6, label: 'Cellphone', icon: 'cellphone-marker', category: 'map' },
	{ id: 7, label: 'Eye', icon: 'eye', category: 'map' },
	{ id: 8, label: 'Drone', icon: 'quadcopter', category: 'map' },
	{ id: 9, label: 'Plane', icon: 'airplane', category: 'map' },
	{ id: 10, label: 'Boat', icon: 'sail-boat', category: 'map' },
	{ id: 11, label: 'Car', icon: 'car', category: 'map' },
	// GeoPTZ
	{ id: 12, label: 'Target', icon: 'target', category: 'geoptz' },
	{ id: 13, label: 'Square Target', icon: 'target-variant', category: 'geoptz' },
	// Waypoint
	{ id: 14, label: 'Round Pin', icon: 'round-pin', category: 'waypoint' }, // Not an mdi icon
	// FOI
	// { id: 15, label: 'Building', icon: 'domain', category: ['foi'] },
];

export type MapPointHandler = (lat: number, lon: number, alt: number) => void;
export type CursorMode = 'default' | 'crosshair';
export type MapPoint = {
	lat: number;
	lon: number;
	alt: number;
};

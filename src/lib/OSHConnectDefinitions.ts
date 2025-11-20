export class Geometry {
	id: string;
	type: string;
	coordinates: number[] | number[][];
	properties?: any;
	bbox?: number[] | undefined;

	constructor(
		id: string,
		type: string,
		coordinates: number[] | number[][],
		properties?: any,
		bbox?: number[]
	) {
		this.id = id;
		this.type = type;
		this.coordinates = coordinates;
		this.properties = properties || {};
		this.bbox = bbox;
	}
}

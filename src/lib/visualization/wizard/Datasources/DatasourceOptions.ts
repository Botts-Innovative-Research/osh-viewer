import { Mode } from 'osh-js/source/core/datasource/Mode.js';

/**
 * Defines the most basic common options for a datasource (CSAPI/SWEAPI) to be created
 * @property resource_id The resource ID (e.g., datastream ID) to connect to
 * @property startTime The start time for data retrieval
 * @property endTime The end time for data retrieval
 * @property mode The mode of data retrieval (e.g., REAL_TIME, BATCH, etc.)
 * @property property_name
 */
export class DatasourceOptions {

	resource_id: string;
	startTime: string;
	endTime: string;
	mode: Mode
	property_name: string;
	property_map?: Record<string, string>;

	constructor(resource_id: string, startTime: string, endTime: string, mode: Mode, property_name: string) {
		this.resource_id = resource_id;
		this.startTime = startTime;
		this.endTime = endTime;
		this.mode = mode;
		this.property_name = property_name;
	}
}
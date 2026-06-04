export interface DataSourceProperties {
	endpointUrl: string;
	tls: boolean;
	protocol: string;
	startTime?: string;
	endTime?: string;
	mode: string;
	responseFormat: string;
	connectorOpts: { username: string; password: string };
	id: string; // ID to use for SweApi
	properties: {
		// Role: property pair
		// Ex: "location": { property: "loc" }
		[key: string]: any;
	};
}

export interface ISweApiDataSourceProperties extends DataSourceProperties {
	resource: string;
}

export interface ISweApiControlStreamProperties extends DataSourceProperties {}

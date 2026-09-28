export interface DataSourceProperties {
	endpointUrl: string;
	tls: boolean;
	protocol: string;
	startTime?: string;
	endTime?: string;
	mode: string;
	responseFormat: string;
	connectorOpts: { username: string; password: string };
	id: string; // ID to use for ConSysApi
	properties: {
		// Role: property pair
		// Ex: "location": { property: "loc" }
		[key: string]: any;
	};
	// In real-time mode, read the lastest stored observation on connect 
	fetchLatestOnConnect?: boolean;
}

export interface IConSysApiDataSourceProperties extends DataSourceProperties {
	resource: string;
}

export interface IConSysApiControlStreamProperties extends DataSourceProperties {}

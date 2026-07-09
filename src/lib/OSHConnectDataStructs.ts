// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import Systems from 'osh-js/source/core/consysapi/system/Systems.js';
import SystemFilter from 'osh-js/source/core/consysapi/system/SystemFilter.js';
import System from 'osh-js/source/core/consysapi/system/System.js';
import DataSynchronizer from 'osh-js/source/core/timesync/DataSynchronizer.js';
import SamplingFeatureFilter from 'osh-js/source/core/consysapi/samplingfeature/SamplingFeatureFilter.js';
import { useNodeStore } from '@/stores/nodestore';
import { useSystemStore } from '@/stores/systemstore';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { CONFIG_UID_BASE } from '@/composables/useConfigPersistence';
import { WizardConfig } from '@/stores/vizwizstore';
import { ViewLocation } from '@/modules/visualization/registry/types';
import { VisualizationComponents } from '@/modules/visualization/types/visualization';

export interface Result {
	success: boolean;
	message?: string;
}

let sharedStores: any = null;

function getSharedStores() {
	if (!sharedStores) {
		sharedStores = {
			nodeStore: useNodeStore(),
			systemStore: useSystemStore(),
			datastreamStore: useDataStreamStore(),
			controlstreamStore: useControlStreamStore(),
		};
	}
	return sharedStores;
}

export class OSHConnect {
	nodeStore: any;

	constructor() {
		const stores = getSharedStores();
		this.nodeStore = stores.nodeStore;
	}

	async createNode(
		name: string,
		host: string,
		port: string | number,
		endpoint: string,
		username: string,
		password: string,
		tls: boolean = false
	): Promise<OSHNode | Result> {
		const newNode = new OSHNode(name, host, port, endpoint, username, password, tls, this);
		const isReachable = await this.checkNodeReachable(newNode);
		const nodeExists = this.checkIfNodeExists(newNode);
		if (!isReachable.success) {
			return isReachable;
		} else if (!nodeExists.success) {
			return nodeExists;
		} else {
			this.nodeStore.addNode(newNode);
			return newNode;
		}
	}

	async checkNodeReachable(node: OSHNode): Promise<Result> {
		const endpoint = `${node.tls ? 'https' : 'http'}://${node.getEndpointUrl()}`;
		const encoded = btoa(`${node.username}:${node.password}`);
		const options: RequestInit = {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encoded}`,
			},
			mode: 'cors',
		};

		try {
			const response = await fetch(endpoint, options);
			if (response.ok) {
				return {
					success: true,
				};
			} else {
				console.error('Node is not reachable.');
				return {
					success: false,
					message: 'Node is not reachable.',
				};
			}
		} catch (error) {
			console.error('Failed to connect to node:', error);
			return {
				success: false,
				message: 'Failed to connect to node.',
			};
		}
	}

	checkIfNodeExists(node: OSHNode): Result {
		if (this.nodeStore.checkIfNodeNameExists(node.name))
			return { success: false, message: 'Node name already exists.' };
		if (this.nodeStore.checkIfNodeEndpointExists(node.host, node.port))
			return { success: false, message: 'Node endpoint already exists.' };
		else return { success: true };
	}

	// Fetch all resources that are relatively static
	async fetchSlowResources(): Promise<void> {
		console.log('Fetching slow resources...');
		// fetch all systems of all nodes'
		const nodes = this.nodeStore.nodes;
		const promises = nodes.map((node: OSHNode) =>
			node
				.collectAndStoreSystems()
				.then((systems: OSHSystem[]) => {
					console.log(`Collected ${systems.length} systems for node ${node.name}`);
				})
				.catch((error: any) => {
					console.error(`Error collecting systems for node ${node.name}:`, error);
				})
		);
		await Promise.all(promises);
	}

	// TODO: Not used in project
	fetchDataStreamsOfSystem(system: OSHSystem): void {
		const datastreamStore = getSharedStores().datastreamStore;
		system
			.getDataStreams()
			.then((dataStreams: any[]) => {})
			.catch((error: any) => {
				console.error(`Error collecting data streams for system ${system.name}:`, error);
			});
	}

	// TODO: Not used in project
	fetchControlStreamsOfSystem(system: OSHSystem): void {
		const controlStreamStore = getSharedStores().controlstreamStore;
		system
			.getControlStreams()
			.then((controlStreams: any[]) => {})
			.catch((error: any) => {
				console.error(`Error collecting control streams for system ${system.name}:`, error);
			});
	}
}

export class OSHNode {
	uuid: string;
	name: string;
	host: string = '';
	port: string | number = '';
	username: string = '';
	password: string = '';
	apiRoot: string = '';
	systems: OSHSystem[] = [];
	oshConnect: OSHConnect;
	tls: boolean;

	constructor(
		name: string,
		host: string,
		port: number | string,
		apiRoot: string,
		username: string,
		password: string,
		tls: boolean,
		oshConnect: OSHConnect
	) {
		this.uuid = randomUUID();
		this.name = name;
		this.host = host;
		this.port = port;
		this.apiRoot = apiRoot;
		this.username = username;
		this.password = password;
		this.tls = tls;
		this.systems = [];
		this.oshConnect = oshConnect;
	}

	async collectAndStoreSystems(): Promise<OSHSystem[]> {
		// make request
		const systems: any = new Systems({
			endpointUrl: this.getEndpointUrl(),
			tls: this.tls,
			connectorOpts: { username: this.username, password: this.password },
		});
		let retrievedSystems: any[] = [];
		const results: typeof System = await systems.searchSystems(new SystemFilter(), 100);

		// collect all results
		while (results.hasNext()) {
			const items: any[] = await results.nextPage();
			retrievedSystems.push(...items);
		}

		const systemStore = getSharedStores().systemStore;

		// transform results into OSHSystem objects for state management and keep OSH-JS references
		const mappedSystems: OSHSystem[] = await Promise.all(
			retrievedSystems.map(async (sys: any) => {
				if (!systemStore?.checkIfSystemExists?.(sys.properties.id)) {
					const newSys = new OSHSystem(sys, this);

					//@ts-ignore
					await Promise.allSettled([
						newSys.getDataStreams(),
						newSys.getControlStreams(),
						newSys.getSamplingFeatures(),
					]);

					systemStore?.addSystem?.(newSys);
					return newSys;
				}
				return systemStore.getSystemById(sys.properties.id);
			})
		);

		this.systems = mappedSystems;
		return mappedSystems;
	}

	getEndpointUrl(): string {
		return `${this.host}:${this.port}/${this.apiRoot}`;
	}

	/**
	 * Filters systems to exclude the "config" systems used for persistence
	 * @returns Array of OSHSystems, excluding "config" systems
	 */
	getFilteredSystems(): OSHSystem[] {
		return this.systems.filter(
			(system) => !system.system.properties.properties.uid.includes(CONFIG_UID_BASE)
		);
	}
}

export class OSHSystem {
	uuid: string; // Random unique ID
	id: string; // OSH ID
	name: string; // Name of system
	type: string; // Type of system
	parentId: string | null; // Parent ID, if applicable
	system: typeof System; // osh-js System object
	parentNode: OSHNode; // OSHNode parent node
	children: string[]; // IDs of system's children (datastreams and controlstreams)
	datastreams: OSHDatastream[] = []; // Datastreams associated with this system
	controlstreams: OSHControlStream[] = []; // Control streams associated with this system
	subsystems: string[] = []; // TODO: Not implemented
	samplingFeatures: any[] = [];

	constructor(system: any, parentNode: OSHNode) {
		this.uuid = randomUUID();
		this.id = system.properties.id;
		this.name = system.properties.properties.name;
		this.type = system.properties.type;
		this.parentId = system.properties.parentId || null;
		this.system = system;
		this.parentNode = parentNode;
		this.children = [];
		this.datastreams = [];
		this.controlstreams = [];

		console.log(`[OSHConnect-System] Created system: ${this.name} (ID: ${this.id})`);
	}

	async getDataStreams(): Promise<any[]> {
		const result: any = await this.system.searchDataStreams(undefined, 100);
		let dataStreams: any[] = [];

		const datastreamStore = getSharedStores().datastreamStore;

		while (result.hasNext()) {
			const items: any[] = await result.nextPage();

			// create new OSHDatastream objects for each item
			items.forEach((item: any) => {
				const newStream = new OSHDatastream(item.properties.name, item, this.id);
				datastreamStore?.addDataStream?.(newStream);
				this.children.push(newStream.uuid); // Push to children
				this.datastreams.push(newStream); // Push OSHDatastream object
			});
		}
		return dataStreams;
	}

	async getControlStreams(): Promise<any[]> {
		const result: any = await this.system.searchControlStreams(undefined, 100);
		let controlStreams: any[] = [];

		const controlstreamStore = getSharedStores().controlstreamStore;

		while (result.hasNext()) {
			const items: any[] = await result.nextPage();

			// create new OSHControlStream objects for each item
			items.forEach((item: any) => {
				const newStream = new OSHControlStream(item.properties.name, item, this.id);
				controlstreamStore?.addControlStream?.(newStream);
				this.children.push(newStream.id); // Push to children
				this.controlstreams.push(newStream); // Push OSHControlStream object
			});
		}
		return controlStreams;
	}

	async getSamplingFeatures(): Promise<any[]> {
		const result: any = await this.system.searchSamplingFeatures(
			new SamplingFeatureFilter(),
			100
		);
		let samplingFeatures: any[] = [];

		while (result.hasNext()) {
			const items: any[] = await result.nextPage();
			samplingFeatures.push(...items);
		}
		this.samplingFeatures = samplingFeatures;
		return samplingFeatures;
	}

	// Get datastreams from this system
	getDSChildren(): OSHDatastream[] {
		const datastreamStore = getSharedStores().datastreamStore;
		return datastreamStore.getDataStreamsById(this.children);
	}

	// Get controlstreams from this system
	getCSChildren(): OSHControlStream[] {
		const controlstreamStore = getSharedStores().controlstreamStore;
		return controlstreamStore.getControlStreamsById(this.children);
	}

	// Get TLS value for parent node
	getTls(): boolean {
		return this.parentNode.tls;
	}
}

export class OSHDatastream {
	uuid: string;
	name: string;
	id: string;
	parentId: string | null;
	datastream: any;
	children: string[] = [];

	constructor(name: string, datastream: any, parentId: string) {
		this.uuid = randomUUID();
		this.name = name;
		this.parentId = parentId;
		this.datastream = datastream;
		this.id = datastream.properties.id;
	}

	registerWithSynchronizer(synchronizer: typeof DataSynchronizer): void {
		synchronizer.addDataSource(this.datastream);
	}

	getParentSystem(): OSHSystem {
		const systemStore = getSharedStores().systemStore;
		return systemStore.getSystemById(this.parentId);
	}

	getParentNode(): OSHNode {
		const system = this.getParentSystem();
		return system.parentNode;
	}
}

export class OSHControlStream {
	id: string;
	name: string;
	parentId: string | null;
	children: string[] = [];
	controlstream: any;

	constructor(name: string, controlstream: any, parentId: string | null) {
		this.id = controlstream.properties.id;
		this.name = name;
		this.parentId = parentId;
		this.controlstream = controlstream;
	}

	getParentSystem(): OSHSystem {
		const systemStore = getSharedStores().systemStore;
		return systemStore.getSystemById(this.parentId);
	}

	getParentNode(): OSHNode {
		const system = this.getParentSystem();
		return system.parentNode;
	}
}

export class OSHVisualization {
	id: string; // Random ID following the format `visualization-${randomUUID()}`
	name: string;
	type: string;
	viewLocation: ViewLocation; // Defines where the visualization is displayed (e.g., 'panel', 'map', 'multi')
	parentId?: string; // Optional parent ID for child visualizations
	datastream: OSHDatastream[] | null; // TODO: null handles "All PMS"
	controlstream?: OSHControlStream[]; // Optional control stream
	visualizationComponents!: VisualizationComponents | VisualizationComponents[];
	wizardConfig!: WizardConfig | null; // Store state of wizard for editing visualization. Null for child visualizations
	children: OSHVisualization[] = []; // Child visualizations for complex visualizations

	constructor(
		id: string,
		name: string,
		type: string,
		viewLocation: ViewLocation,
		datastream: OSHDatastream[] | null,
		controlstream?: OSHControlStream[],
		parentId?: string | undefined
	) {
		this.id = id;
		this.name = name;
		this.type = type;
		this.viewLocation = viewLocation;
		this.datastream = datastream;
		this.controlstream = controlstream;
		this.parentId = parentId;
	}

	setVisualizationComponents(
		components: VisualizationComponents | VisualizationComponents[]
	): void {
		this.visualizationComponents = components;
	}

	setWizardConfig(config: WizardConfig): void {
		this.wizardConfig = config;
	}

	addChildVisualization(children: OSHVisualization[]): void {
		this.children.push(...children);
	}

	// Determine if visualization has child visualizations
	isParentVisualization(): boolean {
		return this.children.length > 0 && this.parentId === undefined;
	}

	// Determine if visualization has a parent visualization (i.e., is a child visualization)
	isChildVisualization(): boolean {
		return this.parentId !== undefined && this.parentId !== null;
	}

	// Determine if visualization is a single visualization (i.e., has no parent and no children)
	isSingleVisualization(): boolean {
		return this.children.length === 0 && this.parentId === undefined;
	}
}

/**
 * Follows GeoJSON format, with optional systemId property for OSH FOIs
 */
export class Geometry {
	id: string;
	type: string;
	coordinates: number[] | number[][];
	properties?: any;
	bbox?: number[] | undefined;
	systemId?: string | undefined;

	constructor(
		id: string,
		type: string,
		coordinates: number[] | number[][],
		properties?: any,
		bbox?: number[],
		systemId?: string
	) {
		this.id = id;
		this.type = type;
		this.coordinates = coordinates;
		this.properties = properties || {};
		this.bbox = bbox;
		this.systemId = systemId;
		console.log(this.type);
	}

	// TODO: Handle "Circle" type
	toGeoJSON() {
		return {
			id: this.id,
			type: this.type,
			coordinates: this.coordinates,
			properties: this.properties,
			bbox: this.bbox,
		};
	}
}

export type OSHLayer =
	// | 'AudioDataLayer'
	// | 'BinaryDataLayer'
	// | 'CoPlanarPolygonLayer'
	| 'CurveLayer'
	// | 'DataLayer'
	| 'EllipseLayer'
	// | 'FrustumLayer'
	// | 'ImageDrapingLayer'
	| 'LoB'
	| 'PointMarkerLayer'
	// | 'PolygonLayer'
	| 'PolylineLayer'
	| 'VideoDataLayer';

export const OSHLayerLabels: Array<{ layer: OSHLayer; label: string }> = [
	// { layer: 'AudioDataLayer', label: 'Audio' },
	// { layer: 'BinaryDataLayer', label: 'Binary' },
	// { layer: 'CoPlanarPolygonLayer', label: 'Coplanar Polygon' },
	{ layer: 'CurveLayer', label: 'Curve' },
	// { layer: 'DataLayer', label: 'Data' },
	// { layer: 'EllipseLayer', label: 'Ellipse' },
	// { layer: 'FrustumLayer', label: 'Frustum' },
	// { layer: 'ImageDrapingLayer', label: 'Image Draping' },
	{ layer: 'LoB', label: 'Line of Bearing' },
	{ layer: 'PointMarkerLayer', label: 'Point Marker' },
	// { layer: 'PolygonLayer', label: 'Polygon' },
	{ layer: 'PolylineLayer', label: 'Polyline' },
	{ layer: 'VideoDataLayer', label: 'Video' },
];

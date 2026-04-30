import { useNodeStore } from '@/stores/nodestore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useSystemStore } from '@/stores/systemstore';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useOSHConnectStore } from '@/stores/oshconnectstore';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { showToast } from '@/composables/useToast';
import { OSHNode, OSHVisualization } from '@/lib/OSHConnectDataStructs';

export const CONFIG_UID_BASE = 'urn:osh:client:config';
export const CONFIG_DS_NAME_BASE = 'Client Config';
export const CONFIG_SYSTEM_NAME_BASE = 'Client Configuration System';

export function getConfigUid(name: string): string {
	return `${CONFIG_UID_BASE}:${name}`;
}

export function getConfigDsName(name: string): string {
	return `${CONFIG_DS_NAME_BASE}: ${name}`;
}

export function getConfigSystemName(name: string): string {
	return `${CONFIG_SYSTEM_NAME_BASE}: ${name}`;
}

export function useConfigPersistence() {
	const nodeStore = useNodeStore();
	const visualizationStore = useVisualizationStore();
	const systemStore = useSystemStore();
	const datastreamStore = useDataStreamStore();
	const oshConnectStore = useOSHConnectStore();
	const controlstreamStore = useControlStreamStore();

	function getAuthHeader(node: OSHNode): string {
		return `Basic ${btoa(`${node.username}:${node.password}`)}`;
	}

	function getBaseUrl(node: OSHNode): string {
		const protocol = node.tls ? 'https://' : 'http://';
		return `${protocol}${node.getEndpointUrl()}`;
	}

	/**
	 * Create a new Config System
	 * @param node
	 * @param configName
	 * @returns
	 */
	async function insertConfigSystem(
		node: OSHNode,
		configName: string,
		configDescription?: string
	): Promise<string | null> {
		const systemJSON = {
			type: 'PhysicalSystem',
			id: '0',
			definition: 'http://www.w3.org/ns/sosa/Sensor',
			uniqueId: getConfigUid(configName),
			label: getConfigSystemName(configName),
			description: configDescription ?? 'Stores configuration files for the client viewer',
			contacts: [
				{
					role: 'http://sensorml.com/ont/swe/roles/Operator',
					organisationName: 'TBD',
				},
			],
			position: {
				type: 'Point',
				coordinates: [0, 0],
			},
		};

		const ep = `${getBaseUrl(node)}/systems`;

		try {
			const response = await fetch(ep, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/sml+json',
					Authorization: getAuthHeader(node),
				},
				mode: 'cors',
				body: JSON.stringify(systemJSON),
			});

			if (response.ok) {
				const location = response.headers.get('Location');
				return location?.split('/').pop() || null;
			}
			console.error('Failed to create config system:', response.status);
			return null;
		} catch (error) {
			console.error('Error creating config system:', error);
			return null;
		}
	}

	/**
	 * Create a new Config Datastream
	 * @param node
	 * @param systemId
	 * @param configName
	 * @returns
	 */
	async function insertConfigDatastream(
		node: OSHNode,
		systemId: string,
		configName: string
	): Promise<string | null> {
		const dsJSON = {
			name: getConfigDsName(configName),
			outputName: 'Client Config',
			schema: {
				obsFormat: 'application/swe+json',
				recordSchema: {
					type: 'DataRecord',
					label: 'Config File',
					fields: [
						{
							type: 'Time',
							label: 'Sampling Time',
							name: 'time',
							referenceFrame: 'http://www.opengis.net/def/trs/BIPM/0/UTC',
							uom: {
								href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian',
							},
						},
						{
							type: 'Text',
							label: 'File Name',
							name: 'fileName',
							definition: 'http://sensorhub.com/definitions/clientconfig/fileName',
						},
						{
							type: 'Text',
							label: 'File Data',
							name: 'fileData',
							definition: 'http://sensorhub.com/definitions/clientconfig/fileData',
						},
					],
				},
			},
		};

		const ep = `${getBaseUrl(node)}/systems/${systemId}/datastreams`;

		try {
			const response = await fetch(ep, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: getAuthHeader(node),
				},
				body: JSON.stringify(dsJSON),
			});

			if (response.ok) {
				const location = response.headers.get('Location');
				return location?.split('/').pop() || null;
			}
			console.error('Failed to create config datastream:', response.status);
			return null;
		} catch (error) {
			console.error('Error creating config datastream:', error);
			return null;
		}
	}

	async function findConfigSystem(node: OSHNode, configName: string) {
		// Fetch slow resources to refresh
		await oshConnectStore.getInstance().fetchSlowResources();

		// Search for config system in default node
		const cfgSystem = systemStore.systems.find(
			(sys) =>
				sys.parentNode.uuid === node.uuid && // Match node ID
				sys.system.properties.properties?.uid === getConfigUid(configName) // Match system ID
		);

		if (cfgSystem) return cfgSystem.id;
		else return null; // No config system found
	}

	async function findConfigDatastream(systemId: string, configName: string) {
		// Fetch slow resources to refresh
		await oshConnectStore.getInstance().fetchSlowResources();

		// Search for config datastream in system
		const cfgDatastream = datastreamStore.dataStreams.find(
			(ds) =>
				ds.datastream.properties.name === getConfigDsName(configName) && // Match DS name
				ds.parentId === systemId // Match system ID
		);

		if (cfgDatastream) return cfgDatastream.id;
		else return null; // No config datastream found
	}

	async function saveConfig(configName: string, configDescription?: string): Promise<boolean> {
		// Check configName
		if (!configName) {
			showToast('No config name', 'ERROR');
			return false;
		}

		// Check defaultNode
		const defaultNode = nodeStore.defaultNodeId
			? nodeStore.getNodeById(nodeStore.defaultNodeId)
			: nodeStore.nodes[0];
		if (!defaultNode) {
			showToast('No nodes configured', 'ERROR');
			return false;
		}

		// Find matching system ID
		let systemId = await findConfigSystem(defaultNode, configName);
		let dsId;
		// If no system ID, create new config system and datastream
		if (systemId == null) {
			systemId = await insertConfigSystem(defaultNode, configName, configDescription);
			if (systemId == null) throw new Error('Failed to create config system');
			else dsId = await insertConfigDatastream(defaultNode, systemId, configName);
		}
		// Else find config datastream
		else {
			dsId = await findConfigDatastream(systemId, configName);
			if (dsId == null) throw new Error('Failed to create config datastream');
		}

		/* Save Data */
		const configData = {
			nodes: nodeStore.serializedNodes,
			visualizations: visualizationStore.serializedVisualizations,
		};

		const observation = {
			time: new Date().toISOString(),
			fileName: 'clientConfig.json',
			fileData: JSON.stringify(configData),
		};

		const ep = `${getBaseUrl(defaultNode)}/datastreams/${dsId}/observations`;

		try {
			const response = await fetch(ep, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/swe+json',
					Authorization: getAuthHeader(defaultNode),
				},
				mode: 'cors',
				body: JSON.stringify(observation),
			});

			if (response.ok) {
				showToast('Configuration saved successfully', 'SUCCESS');
				return true;
			}
			showToast('Failed to save configuration', 'ERROR');
			return false;
		} catch (error) {
			console.error('Error saving config:', error);
			showToast('Failed to save configuration', 'ERROR');
			return false;
		}
	}

	async function loadConfig(configName: string): Promise<any | null> {
		// Check configName
		if (!configName) {
			showToast('No config name', 'ERROR');
			return false;
		}

		// Check defaultNode
		const defaultNode = nodeStore.defaultNodeId
			? nodeStore.getNodeById(nodeStore.defaultNodeId)
			: nodeStore.nodes[0];
		if (!defaultNode) {
			return false;
		}

		// Get config datastream ID
		const systemId = await findConfigSystem(defaultNode, configName);
        let dsId;
		if (systemId == null) throw new Error('Could not find matching config system');
		else {
			dsId = await findConfigDatastream(systemId!, configName);
		}

		const ep = `${getBaseUrl(defaultNode)}/datastreams/${dsId}/observations?f=json&resultTime=latest`;

		try {
			const response = await fetch(ep, {
				method: 'GET',
				headers: {
					Authorization: getAuthHeader(defaultNode),
				},
				mode: 'cors',
			});

			if (response.ok) {
				// Delete current visualizations
				visualizationStore.removeAllVisualizations();

				const data = await response.json();
				if (data.items && data.items.length > 0) {
					const latestObs = data.items[0].result;
					let cfgJson = JSON.parse(latestObs.fileData);

					let loadedNodes = cfgJson.nodes || [];
					let loadedVisualizations = cfgJson.visualizations || [];

					const oshConnect = oshConnectStore.getInstance();
					let nodesAdded = 0;

					for (const serializedNode of loadedNodes) {
						if (
							!nodeStore.checkIfNodeExists(serializedNode.name) &&
							!nodeStore.checkIfNodeEndpointExists(
								serializedNode.host,
								serializedNode.port
							)
						) {
							const newNode = new OSHNode(
								serializedNode.name,
								serializedNode.host,
								serializedNode.port,
								serializedNode.apiRoot,
								serializedNode.username,
								serializedNode.password,
								serializedNode.tls,
								oshConnect
							);
							nodeStore.addNode(newNode);
							nodesAdded++;
						}
					}

					if (nodesAdded > 0) await oshConnect.fetchSlowResources();

					let visualizationsAdded = 0;
					for (const serializedViz of loadedVisualizations) {
						if (!visualizationStore.getVisualizationById(serializedViz.id)) {
							const datastreams = datastreamStore.getDataStreamsById(
								serializedViz.datastreamIds
							);
							const controlstreams = controlstreamStore.getControlStreamsById(
								serializedViz.controlstreamIds
							);

							const visualization = new OSHVisualization(
								serializedViz.id,
								serializedViz.name,
								serializedViz.type,
								serializedViz.viewLocation,
								datastreams,
								controlstreams,
								serializedViz.parentId
							);

							visualization.setVisualizationComponents(
								serializedViz.visualizationComponents
							);
							visualization.setWizardConfig(serializedViz.wizardConfig);
							visualizationStore.addVisualization(visualization);
							visualizationsAdded++;
						}
					}

					showToast(
						`Loaded ${nodesAdded} nodes, ${visualizationsAdded} visualizations`,
						'SUCCESS'
					);
					return cfgJson;
				}
			}
			showToast('No saved configuration found', 'INFO');
			return null;
		} catch (error) {
			console.error('Error loading config:', error);
			showToast('Failed to load configuration', 'ERROR');
			return null;
		}
	}

    async function listConfigs(): Promise<any[]> {
		// Check defaultNode
		const defaultNode = nodeStore.defaultNodeId
			? nodeStore.getNodeById(nodeStore.defaultNodeId)
			: nodeStore.nodes[0];
		if (!defaultNode) {
			return [];
		}

		// Refresh resources to get latest systems
		await oshConnectStore.getInstance().fetchSlowResources();

		// Find all systems on the default node whose UID starts with the config base
		const configSystems = systemStore.systems.filter(
			(sys) =>
				sys.parentNode.uuid === defaultNode.uuid &&
				sys.system.properties.properties?.uid?.startsWith(CONFIG_UID_BASE + ':')
		);

		// Extract the config name and description from each UID: "urn:osh:client:config:<name>" -> "<name>"
		const configData = configSystems.map((sys) => {
			console.log(sys);
			const uid: string = sys.system.properties.properties?.uid ?? '';
			return {
				name: uid.slice((CONFIG_UID_BASE + ':').length),
				description: sys.system.properties.properties?.description,
			};
		});

		return configData;
	}

	return {
		saveConfig,
		loadConfig,
		listConfigs,
	};
}

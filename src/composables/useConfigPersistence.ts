import { useNodeStore } from '@/stores/nodestore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useSystemStore } from '@/stores/systemstore';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useOSHConnectStore } from '@/stores/oshconnectstore';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { showToast } from '@/composables/useToast';
import { OSHNode, OSHVisualization } from '@/lib/OSHConnectDataStructs';

export const CONFIG_UID = 'urn:osh:client:config';
const CONFIG_DS_NAME = 'Client Config';

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

    async function insertConfigSystem(node: OSHNode): Promise<string | null> {
        const systemJSON = {
            type: 'PhysicalSystem',
            id: '0',
            definition: 'http://www.w3.org/ns/sosa/Sensor',
            uniqueId: CONFIG_UID,
            label: 'Client Configuration System',
            description: 'Stores configuration files for the client viewer',
            contacts: [
                {
                    role: 'http://sensorml.com/ont/swe/roles/Operator',
                    organisationName: 'TBD'
                }
            ],
            position: {
                type: 'Point',
                coordinates: [0, 0]
            }
        };

        const ep = `${getBaseUrl(node)}/systems`;

        try {
            const response = await fetch(ep, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/sml+json',
                    Authorization: getAuthHeader(node)
                },
                mode: 'cors',
                body: JSON.stringify(systemJSON)
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

    async function insertConfigDatastream(node: OSHNode, systemId: string): Promise<string | null> {
        const dsJSON = {
            name: CONFIG_DS_NAME,
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
                                href: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian'
                            }
                        },
                        {
                            type: 'Text',
                            label: 'File Name',
                            name: 'fileName',
                            definition: 'http://sensorhub.com/definitions/clientconfig/fileName'
                        },
                        {
                            type: 'Text',
                            label: 'File Data',
                            name: 'fileData',
                            definition: 'http://sensorhub.com/definitions/clientconfig/fileData'
                        }
                    ]
                }
            }
        };

        const ep = `${getBaseUrl(node)}/systems/${systemId}/datastreams`;

        try {
            const response = await fetch(ep, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: getAuthHeader(node)
                },
                body: JSON.stringify(dsJSON)
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

    async function findOrCreateConfigSystem(node: OSHNode): Promise<string | null> {
        const cfgSystem = systemStore.systems.find((sys) => sys.system.properties.properties?.uid === CONFIG_UID);

        if (cfgSystem) {
            return cfgSystem.id;
        }

        return await insertConfigSystem(node);
    }

    async function findOrCreateConfigDatastream(node: OSHNode, systemId: string): Promise<string | null> {
        const cfgDatastream = datastreamStore.dataStreams.find(
            (ds) => ds.datastream.properties.name === CONFIG_DS_NAME && ds.datastream.properties['system@id'] === systemId);

        if (cfgDatastream) {
            return cfgDatastream.id;
        }
        return await insertConfigDatastream(node, systemId);
    }

    async function getConfigDatastreamId(node: OSHNode): Promise<string | null> {
        const systemId = await findOrCreateConfigSystem(node);
        if (!systemId) {
            console.error('Failed to find or create config system');
            return null;
        }

        const datastreamId = await findOrCreateConfigDatastream(node, systemId);
        if (!datastreamId) {
            console.error('Failed to find or create config datastream');
            return null;
        }

        return datastreamId;
    }

    async function saveConfig(): Promise<boolean> {
        const defaultNode = nodeStore.defaultNodeId
            ? nodeStore.getNodeById(nodeStore.defaultNodeId)
            : nodeStore.nodes[0];
        if (!defaultNode) {
            showToast('No nodes configured', 'ERROR');
            return false;
        }

        const dsId = await getConfigDatastreamId(defaultNode);
        if (!dsId) {
            showToast('Failed to setup config storage', 'ERROR');
            return false;
        }

        const configData = {
            nodes: nodeStore.serializedNodes,
            visualizations: visualizationStore.serializedVisualizations
        };

        const observation = {
            time: new Date().toISOString(),
            fileName: 'clientConfig.json',
            fileData: JSON.stringify(configData)
        };

        const ep = `${getBaseUrl(defaultNode)}/datastreams/${dsId}/observations`;

        try {
            const response = await fetch(ep, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/swe+json',
                    Authorization: getAuthHeader(defaultNode)
                },
                mode: 'cors',
                body: JSON.stringify(observation)
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

    async function loadConfig(): Promise<any | null> {
        const defaultNode = nodeStore.defaultNodeId
            ? nodeStore.getNodeById(nodeStore.defaultNodeId)
            : nodeStore.nodes[0];
        if (!defaultNode) {
            return null;
        }

        const dsId = await getConfigDatastreamId(defaultNode);
        if (!dsId) {
            return null;
        }

        const ep = `${getBaseUrl(defaultNode)}/datastreams/${dsId}/observations?f=json&resultTime=latest`;

        try {
            const response = await fetch(ep, {
                method: "GET",
                headers: {
                    Authorization: getAuthHeader(defaultNode)
                },
                mode: 'cors'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    const latestObs = data.items[0].result;
                    let cfgJson = JSON.parse(latestObs.fileData);

                    let loadedNodes = cfgJson.nodes || [];
                    let loadedVisualizations = cfgJson.visualizations || [];

                    const oshConnect = oshConnectStore.getInstance();
                    let nodesAdded = 0;

                    for (const serializedNode of loadedNodes) {
                        if (!nodeStore.checkIfNodeExists(serializedNode.name) &&
                            !nodeStore.checkIfNodeEndpointExists(serializedNode.host, serializedNode.port)) {
                            const newNode = new OSHNode(
                                serializedNode.name,
                                serializedNode.host,
                                serializedNode.port,
                                serializedNode.apiRoot,
                                serializedNode.username,
                                serializedNode.password,
                                serializedNode.tls,
                                oshConnect
                            )
                            nodeStore.addNode(newNode)
                            nodesAdded++;
                        }
                    }

                    if (nodesAdded > 0)
                        await oshConnect.fetchSlowResources();

                    let visualizationsAdded = 0;
                    for (const serializedViz of loadedVisualizations) {
                        if (!visualizationStore.getVisualizationById(serializedViz.id)) {
                            const datastreams = datastreamStore.getDataStreamsById(serializedViz.datastreamIds);
                            const controlstreams = controlstreamStore.getControlStreamsById(serializedViz.controlstreamIds);

                            const visualization = new OSHVisualization(
                                serializedViz.id,
                                serializedViz.name,
                                serializedViz.type,
                                serializedViz.viewLocation,
                                datastreams,
                                controlstreams,
                                serializedViz.parentId,
                            );

                            visualization.setVisualizationComponents(serializedViz.visualizationComponents);
                            visualization.setWizardConfig(serializedViz.wizardConfig);
                            visualizationStore.addVisualization(visualization);
                            visualizationsAdded++;
                        }
                    }

                    showToast(`Loaded ${nodesAdded} nodes, ${visualizationsAdded} visualizations`, 'SUCCESS');
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

    return {
        saveConfig,
        loadConfig
    };
}

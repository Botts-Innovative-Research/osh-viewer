import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { OSHNode, OSHConnect } from '@/lib/OSHConnectDataStructs';
import { showToast } from '@/composables/useToast';

export interface SerializeNode {
	name: string;
	host: string;
	port: string | number;
	apiRoot: string;
	username: string;
	password: string;
	tls: boolean;
}
export const useNodeStore = defineStore(
	'nodes',
	() => {
		const nodes: Ref<OSHNode[]> = ref([]);
		const defaultNodeId = ref<string | null>(null);
		const serializedNodes: Ref<SerializeNode[]> = ref([]);

		const addNode = (node: OSHNode): any => {
			if (checkIfNodeExists(node.name) || node.name === undefined) {
				console.log('Node already exists or name is undefined', node);
				showToast('Node already exists or name is undefined', 'ERROR');
				return;
			}
			nodes.value.push(node);
			// Add serialized version for persistence
			serializedNodes.value.push({
				name: node.name,
				host: node.host,
				port: node.port,
				apiRoot: node.apiRoot,
				username: node.username,
				password: node.password,
				tls: node.tls,
			});
			showToast('Node created successfully', 'SUCCESS');
		};

		const removeNode = (node: OSHNode): void => {
			nodes.value = nodes.value.filter((n) => n !== node);
			serializedNodes.value = serializedNodes.value.filter((n) => n.name !== node.name);
		};

		const getNodeByName = (name: string): OSHNode | undefined => {
			return nodes.value.find((node) => node.name === name);
		};

		const checkIfNodeExists = (name: string): boolean => {
			return nodes.value.some((node) => node.name === name);
		};

		const checkIfNodeEndpointExists = (host: string, port: string | number): boolean => {
			return nodes.value.some((node) => node.host === host && node.port == port);
		};

		const rehydrateNodes = async (oshConnect: OSHConnect): Promise<void> => {
			if (serializedNodes.value.length === 0 || nodes.value.length > 0) return;

			for (const serialized of serializedNodes.value) {
				const node = new OSHNode(
					serialized.name,
					serialized.host,
					serialized.port,
					serialized.apiRoot,
					serialized.username,
					serialized.password,
					serialized.tls,
					oshConnect
				);
				nodes.value.push(node);
			}
			await oshConnect.fetchSlowResources();
			console.log('[NodeStore] Rehydrated nodes from persisted data:', nodes.value.length);
		};

		const updateDefaultNode = (nodeId: string | null) => {
			defaultNodeId.value = nodeId;
		};

		const getNodeById = (id: string) => {
			return nodes.value.find((node) => `${node.host}:${node.port}` === id);
		};
		return {
			nodes,
			defaultNodeId,
			serializedNodes,
			addNode,
			removeNode,
			getNodeByName,
			checkIfNodeExists,
			checkIfNodeEndpointExists,
			rehydrateNodes,
			updateDefaultNode,
			getNodeById,
		};
	},
	{ persist: { pick: ['serializedNodes', 'defaultNodeId'] } }
);

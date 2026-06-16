import { OSHConnect, OSHNode } from '@/lib/OSHConnectDataStructs';

export interface SerializedNode {
	name: string;
	host: string;
	port: string | number;
	apiRoot: string;
	username: string;
	password: string;
	tls: boolean;
}

export function serializeNode(node: OSHNode): SerializedNode {
	return {
		name: node.name,
		host: node.host,
		port: node.port,
		apiRoot: node.apiRoot,
		username: node.username,
		password: node.password,
		tls: node.tls,
	};
}

export function rehydrateNode(serialized: SerializedNode, oshConnect: OSHConnect): OSHNode {
	return new OSHNode(
		serialized.name,
		serialized.host,
		serialized.port,
		serialized.apiRoot,
		serialized.username,
		serialized.password,
		serialized.tls,
		oshConnect
	);
}

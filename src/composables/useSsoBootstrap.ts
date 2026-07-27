import { OSHConnect, OSHNode } from '@/lib/OSHConnectDataStructs';
import { useNodeStore } from '@/stores/nodestore';

export const SSO_NODE_NAME = 'GovCloud OSH (SSO)';
export const SSO_TOKEN_ENDPOINT = '/auth/token';
export const SSO_TOKEN_REFRESH_MS = 4 * 60 * 1000;

const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export async function fetchProxyToken(): Promise<string | null> {
	try {
		const response = await fetch(SSO_TOKEN_ENDPOINT, {
			credentials: 'include',
			cache: 'no-store',
		});
		if (!response.ok) return null;

		const token = (await response.text()).trim();
		return JWT_RE.test(token) ? token : null;
	} catch {
		return null;
	}
}

export async function bootstrapSsoNode(connect: OSHConnect): Promise<boolean> {
	const nodeStore = useNodeStore();
	const token = await fetchProxyToken();
	if (!token) {
		console.info('[SSO] No proxy token available — manual node config in effect.');
		return false;
	}

	const host = window.location.hostname;
	const tls = window.location.protocol === 'https:';
	const port = window.location.port || (tls ? '443' : '80');
	const apiRoot = 'sensorhub/api';

	let node = nodeStore.getNodeByName(SSO_NODE_NAME);
	if (node) {
		node.token = token;
		node.host = host;
		node.port = port;
		node.apiRoot = apiRoot;
		node.tls = tls;
	} else {
		node = new OSHNode(SSO_NODE_NAME, host, port, apiRoot, '', '', tls, connect, token);
		nodeStore.addEphemeralNode(node);
	}

	nodeStore.updateDefaultNode(`${host}:${port}`);

	try {
		await connect.fetchSlowResources();
	} catch (error) {
		console.error('[SSO] Failed to load resources for SSO node:', error);
	}

	window.setInterval(async () => {
		const refreshedToken = await fetchProxyToken();
		if (refreshedToken && node) node.token = refreshedToken;
	}, SSO_TOKEN_REFRESH_MS);

	console.info('[SSO] Provisioned SSO node with user OIDC token.');
	return true;
}

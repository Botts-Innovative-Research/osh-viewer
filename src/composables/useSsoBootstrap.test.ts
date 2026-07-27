import { afterEach, describe, expect, it, vi } from 'vitest';
import { OSHConnect, OSHNode } from '@/lib/OSHConnectDataStructs';
import { serializeNode } from '@/modules/visualization/services/node.serialization';
import { fetchProxyToken, SSO_TOKEN_ENDPOINT } from './useSsoBootstrap';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('GovCloud SSO token handling', () => {
	it('uses Bearer connector options without persisting the token', () => {
		const node = new OSHNode(
			'GovCloud OSH (SSO)',
			'osh-osh.com',
			'443',
			'sensorhub/api',
			'',
			'',
			true,
			{} as OSHConnect,
			'header.payload.signature'
		);

		expect(node.authHeader()).toBe('Bearer header.payload.signature');
		expect(node.connectorOpts()).toEqual({
			Authorization: 'Bearer header.payload.signature',
		});
		expect(serializeNode(node)).not.toHaveProperty('token');
	});

	it('accepts only a JWT-shaped response from the session-gated endpoint', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response('header.payload.signature'))
			.mockResolvedValueOnce(new Response('<html>login</html>'));
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchProxyToken()).resolves.toBe('header.payload.signature');
		await expect(fetchProxyToken()).resolves.toBeNull();
		expect(fetchMock).toHaveBeenCalledWith(SSO_TOKEN_ENDPOINT, {
			credentials: 'include',
			cache: 'no-store',
		});
	});
});

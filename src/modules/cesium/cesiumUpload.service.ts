import { CESIUM_API_URL, CesiumUploadConfig } from '@/modules/cesium/types';
import { useCesiumIonStore } from '@/stores/cesiumionstore';

export async function createCesiumAsset(config: CesiumUploadConfig) {
	const cesiumIonStore = useCesiumIonStore();
	if (!cesiumIonStore.accessToken) throw new Error('Not connected to Cesium Ion');

	const response = await fetch(`${CESIUM_API_URL}/assets`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${cesiumIonStore.accessToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(config),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to create Cesium Ion asset: ${response.status} ${error}`);
	}

	return await response.json();
}

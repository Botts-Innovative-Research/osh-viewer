import { useCesiumIonStore } from '@/stores/cesiumionstore';
import { CesiumIonAssetsResponse } from '@/modules/cesium/types';

export async function getCesiumIonAssets(): Promise<CesiumIonAssetsResponse> {
	const cesiumIonStore = useCesiumIonStore();

	if (!cesiumIonStore.accessToken) {
		throw new Error('Cesium Ion account is not connected');
	}

	const response = await fetch('https://api.cesium.com/v1/assets', {
		headers: {
			Authorization: `Bearer ${cesiumIonStore.accessToken}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to get Cesium Ion assets: ${response.status}`);
	}

	return await response.json();
}

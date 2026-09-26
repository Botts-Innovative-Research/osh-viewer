import { useCesiumIonStore } from '@/stores/cesiumionstore';
import { CESIUM_API_URL, CesiumIonAsset, CesiumIonAssetsResponse } from '@/modules/cesium/types';

/**
 * Fetch all "my assets" from connected Cesium Ion account
 */
export async function getCesiumIonAssets(): Promise<CesiumIonAssetsResponse> {
	const cesiumIonStore = useCesiumIonStore();

	if (!cesiumIonStore.accessToken) {
		throw new Error('Cesium Ion account is not connected');
	}

	const response = await fetch(`${CESIUM_API_URL}/assets`, {
		headers: {
			Authorization: `Bearer ${cesiumIonStore.accessToken}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to get Cesium Ion assets: ${response.status}`);
	}

	return await response.json();
}

/**
 * Fetch an asset by ID
 * @param assetId
 */
export async function getCesiumIonAsset(assetId: number): Promise<CesiumIonAsset> {
	const cesiumIonStore = useCesiumIonStore();

	if (!cesiumIonStore.accessToken) {
		throw new Error('Cesium Ion account is not connected');
	}

	const response = await fetch(`${CESIUM_API_URL}/v1/assets/${assetId}`, {
		headers: {
			Authorization: `Bearer ${cesiumIonStore.accessToken}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to get Cesium Ion asset ${assetId}: ${response.status}`);
	}

	return await response.json();
}

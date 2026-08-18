import { OfflineMapLayer } from '@/modules/map/types';

export async function loadOfflineMapMetadata(
	map: Partial<OfflineMapLayer>
): Promise<OfflineMapLayer> {
	const encoded = btoa('admin:admin');
	const response = await fetch(`${map.fileServerUrl}/${map.mapPath}/metadata.json`, {
		headers: {
			Authorization: `Basic ${encoded}`,
		},
	});

	if (!response.ok) {
		throw new Error('Failed to load offline map metadata');
	}

	const metadata = await response.json();

	const mapLayer: OfflineMapLayer = {
		id: map.id!,
		fileServerUrl: map.fileServerUrl!,
		mapName: map.mapName!,
		mapPath: map.mapPath!,
		minZoom: metadata.minZoom,
		maxZoom: metadata.maxZoom,
		lat: metadata.lat,
		lon: metadata.lon,
		hasBuildings: map.hasBuildings ?? false,
	};

	return mapLayer;
}

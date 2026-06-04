import { GeoPTZCommand } from '@/modules/visualization/visualizations/geoptz/Descriptor';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { useMapStore } from '@/stores/mapstore';
import { ISweApiControlStreamProperties } from '@/modules/visualization/types/datasource';
import { sendCommand } from '@/modules/visualization/services/controlstream.service';

export function taskGeoPTZ(lat: number, lon: number, alt: number) {
	const mapStore = useMapStore();
	mapStore.setCurrentLLA(lat, lon, alt);

	if (!mapStore.isGeoPTZSelected || !mapStore.selectedGeoPTZ) return;

	sendGeoPTZCommand(mapStore.selectedGeoPTZ, {
		parameters: {
			lat,
			lon,
			alt,
		},
	});
}

export function sendGeoPTZCommand(selectedGeoPTZ: OSHVisualization[], command: GeoPTZCommand) {
	if (selectedGeoPTZ) {
		// Iterate thru GeoPTZ instances
		selectedGeoPTZ.map((viz: OSHVisualization) => {
			const controlstream: ISweApiControlStreamProperties | null = viz.visualizationComponents
				.controlstream
				? viz.visualizationComponents.controlstream[0]
				: null;
			if (controlstream) {
				const csId = controlstream.id;
				const commandBaseUrl = `${controlstream.tls ? 'https' : 'http'}://${controlstream.endpointUrl}`;
				const auth = {
					username: controlstream.connectorOpts.username,
					password: controlstream.connectorOpts.password,
				};
				sendCommand(commandBaseUrl, csId, command, `${auth.username}:${auth.password}`);
			} else {
				console.error('Could not send command. No controlstream found.');
			}
		});
	}
}

import { GeoPTZCommand } from '@/components/menus/visualization-wizard/visualizations/geoptz/Descriptor';
import { sendCommand } from '@/lib/ControlstreamUtils';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ISweApiControlStreamProperties } from '@/lib/VisualizationHelpers';
import { useMapStore } from '@/stores/mapstore';

export function useGeoPTZ() {
	// Stores
	const mapStore = useMapStore();

	function taskGeoPTZ(lat: number, lon: number, alt: number) {
		mapStore.setCurrentLLA(lat, lon, alt);

		if (!mapStore.isGeoPTZSelected || !mapStore.selectedGeoPTZ) return;

		sendGeoPTZCommand({
			parameters: {
				lat,
				lon,
				alt,
			},
		});
	}

	function sendGeoPTZCommand(command: GeoPTZCommand) {
		const selectedGeoPTZ = mapStore.selectedGeoPTZ;

		if (selectedGeoPTZ) {
			// Iterate thru GeoPTZ instances
			selectedGeoPTZ.map((viz: OSHVisualization) => {
				const controlstream: ISweApiControlStreamProperties | null = viz
					.visualizationComponents.controlstream
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

	return {
		taskGeoPTZ,
		sendGeoPTZCommand,
	};
}

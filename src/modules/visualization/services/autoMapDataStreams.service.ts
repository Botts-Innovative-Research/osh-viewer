import type { OSHDatastream } from '@/lib/OSHConnectDataStructs';

const dsRoleKeywords: Record<string, string[]> = {
	// location/orientation
	location: ['location', 'lla', 'position', 'platform location'],
	lla: ['location', 'lla', 'position', 'platform location'],
	position: ['location', 'lla', 'position', 'platform location'],
	origin: ['location', 'lla', 'position', 'platform location', 'origin'],
	orientation: ['orientation', 'attitude', 'heading', 'euler'],
	homeOrientation: ['orientation', 'attitude', 'heading', 'euler'],
	// mission
	home: ['home', 'home position', 'home location', 'launch position'],
	homeLocation: ['home', 'home position', 'home location', 'launch position'],
	status: ['status', 'statusevent', 'status event'],
	// vid
	video: ['video', 'camera', 'image', 'stream'],
	// chart
	x: ['time', 'timestamp'],
	y: [], //tbd
	// lob
	bearing: ['bearing', 'azimuth', 'angle', 'line of bearing'],
	// text
	stream: [], //tbd
};

export function autoMapDataStreams(
	datastreams: OSHDatastream[]
): Record<string, string> {
	const result: Record<string, string> = {};

	for (const [role, keywords] of Object.entries(dsRoleKeywords)) {
		for (const ds of datastreams) {
			const name = ds.name.toLowerCase();
			if (keywords.some((kw) => name.includes(kw))) {
				result[role] = ds.id;
				break;
			}
		}
	}

	return result;
}

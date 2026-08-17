import type { OSHControlStream } from '@/lib/OSHConnectDataStructs';

const csRoleKeywords: Record<string, string[]> = {
	// mission
	plan: ['qgc mission', 'qgroundcontrol', 'mission plan', 'mission control', 'unmanned mission', 'unmanned control mission'],
	roverPlan: ['rover mission', 'rover plan', 'ground mission', 'ugv mission'],
	takeoff: ['takeoff', 'take off', 'take-off'],
	land: ['landing', 'land control', 'land command', 'landing control'],
	pause: ['pause', 'pause mission'],
	rtl: ['rtl', 'return to launch', 'return home', 'return to home', 'return'],
	offboard: ['offboard', 'off-board', 'offboard control'],
	arm: ['arming', 'arm control', 'arm command', 'arm/disarm', 'arming control'],
	driveVelocity: ['drive velocity', 'velocity control', 'drive velocity control'],
	driveLocation: ['drive to location', 'drive location', 'drive location control'],
	reboot: ['reboot', 'reboot control'],
	hold: ['hold control', 'hold command', 'loiter'],
	homePos: ['home position', 'home pos', 'set home', 'home position control'],
	driveMode: ['flight mode', 'drive mode', 'mode control', 'drive mode control'],
	// vid
	ptz: ['ptz control', 'ptzcontrol', 'ptz', 'pan tilt', 'pan-tilt-zoom', 'camera control', 'control'],
	// geoptz
	lla: ['location', 'lla', 'gps', 'position', 'platform location'],
	flyToLocation: ['location'],
};

export function autoMapControlStreams(
	controlstreams: OSHControlStream[]
): Record<string, string> {
	const result: Record<string, string> = {};

	for (const [role, keywords] of Object.entries(csRoleKeywords)) {
		for (const cs of controlstreams) {
			const name = cs.name.toLowerCase();
			if (keywords.some((kw) => name.includes(kw))) {
				result[role] = cs.id;
				break;
			}
		}
	}

	return result;
}

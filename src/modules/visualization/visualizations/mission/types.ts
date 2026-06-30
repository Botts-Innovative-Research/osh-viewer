export interface Waypoint {
	id: string;
	lat: number;
	lon: number;
	alt: number;
}

export interface MissionSettings {
	cruiseSpeed: number;
	hoverSpeed: number;
	waypointAltitude: number;
	altitudeMode: number;
	autoContinue: boolean;
	amslAltAboveTerrain: number | null;
}

export interface SavedMission {
	id: string;
	name: string;
	waypoints: Waypoint[];
	settings: MissionSettings;
	createdAt: string;
	updatedAt: string;
}

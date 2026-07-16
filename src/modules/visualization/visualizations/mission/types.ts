import { MapPoint } from '@/modules/map/adapters/types';

export interface Waypoint extends MapPoint{
	id: string;
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

import { MapPoint } from '@/modules/map/types';
import ConSysApi from "osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js";

export interface Waypoint extends MapPoint {
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

export interface SystemState {
    receivedLLA: { lat: number; lon: number; alt: number };
    receivedStatus: string;
    homeLocation: { lat: number; lon: number; alt: number };
    llaDatasource: typeof ConSysApi | null;
    homeDatasource: typeof ConSysApi | null;
    statusDatasource: typeof ConSysApi | null;
    dsInstances: (typeof ConSysApi)[];
}
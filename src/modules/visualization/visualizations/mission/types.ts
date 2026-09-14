import { MapPoint } from '@/modules/map/types';
import ConSysApi from "osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js";

export interface Waypoint extends MapPoint {
    id: string;
}

export interface MissionSettings {
	vehicleType: string;
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
	desc: string;
	waypoints: Waypoint[];
	settings: MissionSettings;
	createdAt: string;
	updatedAt: string;
}

export interface MissionSummary {
    name: string;
    missionSource: 'waypoints' | 'file' | 'saved';
    vehicleType: string;
    waypointCount: number;
    cruiseSpeed: number;
    waypointAltitude: number;
    totalDistance: number;
    estimatedTime: number;
    selectedFileName?: string;
}

export interface SystemState {
    receivedLLA: MapPoint;
    receivedStatus: string;
    homeLocation: MapPoint;
    llaDatasource: typeof ConSysApi | null;
    homeDatasource: typeof ConSysApi | null;
    statusDatasource: typeof ConSysApi | null;
    dsInstances: (typeof ConSysApi)[];
}

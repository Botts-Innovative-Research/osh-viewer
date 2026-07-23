import { defineStore } from 'pinia';
import { Ref, ref } from 'vue';
import type { SavedMission } from '@/modules/visualization/visualizations/mission/types';
import { MapPoint } from '@/modules/map/types';

export const useMissionStore = defineStore(
	'mission',
	() => {
		// Waypoint planning
		const missionWaypoints: Ref<MapPoint[]> = ref([]);
		const missionWaypointsPerSystem = ref<Record<string, MapPoint[]>>({});

		function setMissionWaypoints(waypoints: MapPoint[], systemId: string) {
			missionWaypointsPerSystem.value[systemId] = waypoints;
			missionWaypoints.value = Object.values(missionWaypointsPerSystem.value).flat();
		}
		function getMissionWaypointsPerSystem(systemId: string) {
			return missionWaypointsPerSystem.value[systemId] ?? [];
		}
		function clearMissionWaypoints() {
			missionWaypointsPerSystem.value = {};
			missionWaypoints.value = [];
		}
		function clearSystemWaypoints(systemId: string) {
			delete missionWaypointsPerSystem.value[systemId]; //remove systemIds waypoints
			missionWaypoints.value = Object.values(missionWaypointsPerSystem.value).flat(); //update mission waypoints
		}

		// Full mission
		const savedMissions = ref<SavedMission[]>([]);
		function saveMission(mission: SavedMission) {
			const index = savedMissions.value.findIndex((m) => m.id === mission.id);
			if (index >= 0) {
				savedMissions.value[index] = mission;
			} else {
				savedMissions.value.push(mission);
			}
		}
		function deleteMission(id: string) {
			savedMissions.value = savedMissions.value.filter((m) => m.id !== id);
		}
		function getMissionById(id: string): SavedMission | undefined {
			return savedMissions.value.find((m) => m.id === id);
		}

		return {
			missionWaypoints,
			missionWaypointsPerSystem,
			setMissionWaypoints,
			getMissionWaypointsPerSystem,
			clearMissionWaypoints,
			clearSystemWaypoints,
			savedMissions,
			saveMission,
			deleteMission,
			getMissionById,
		};
	},
	{ persist: { pick: ['missionWaypoints', 'missionWaypointsPerSystem', 'savedMissions'] } }
);

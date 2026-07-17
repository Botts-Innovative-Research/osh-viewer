import { defineStore } from 'pinia';
import {reactive, Ref, ref} from 'vue';
import type { SavedMission } from '@/modules/visualization/visualizations/mission/types';
import { MapPoint } from '@/modules/map/types';

export const useMissionStore = defineStore(
	'mission',
	() => {
		// Waypoint planning
        const missionWaypoints: Ref<MapPoint[]> = ref([])
        const missionWaypointsPerSystem = reactive(new Map<string, MapPoint[]>());

		function setMissionWaypoints(waypoints: MapPoint[], systemId: string) {
			missionWaypointsPerSystem.set(systemId, waypoints);
            missionWaypoints.value = [...missionWaypointsPerSystem.values()].flat();
		}
		function clearMissionWaypoints() {
            missionWaypointsPerSystem.clear()
            missionWaypoints.value = [];
		}
        function clearSystemWaypoints(systemId: string) {
           missionWaypointsPerSystem.delete(systemId); //remove systemIds waypoints
           missionWaypoints.value = [...missionWaypointsPerSystem.values()].flat() //update missionwaypoints
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
			clearMissionWaypoints,
			clearSystemWaypoints,
			savedMissions,
			saveMission,
			deleteMission,
			getMissionById,
		};
	},
	{ persist: { pick: ['savedMissions'] } }
);

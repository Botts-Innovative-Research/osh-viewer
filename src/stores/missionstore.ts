import { defineStore } from 'pinia';
import { Ref, ref } from 'vue';
import type { SavedMission } from '@/modules/visualization/visualizations/mission/types';
import { MapPoint } from '@/modules/map/types';

export const useMissionStore = defineStore(
	'mission',
	() => {
		// Waypoint planning
		const missionWaypoints: Ref<MapPoint[]> = ref([]); // List of waypoints for mission planner
		function setMissionWaypoints(waypoints: MapPoint[]) {
			missionWaypoints.value = waypoints;
		}
		function clearMissionWaypoints() {
			missionWaypoints.value = [];
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
			setMissionWaypoints,
			clearMissionWaypoints,
			savedMissions,
			saveMission,
			deleteMission,
			getMissionById,
		};
	},
	{ persist: { pick: ['savedMissions'] } }
);

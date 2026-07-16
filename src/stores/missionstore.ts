import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { SavedMission } from '@/modules/visualization/visualizations/mission/types';

export const useMissionStore = defineStore(
	'mission',
	() => {
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
			savedMissions,
			saveMission,
			deleteMission,
			getMissionById,
		};
	},
	{ persist: { pick: ['savedMissions'] } }
);

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { OSHSystem } from '@/lib/OSHConnectDataStructs';
import { CONFIG_UID } from '@/composables/useConfigPersistence';

export const useSystemStore = defineStore('systems', () => {
	const systems = ref<OSHSystem[]>([]);

	const addSystem = (system: OSHSystem) => {
		// Check if the system already exists
		if (checkIfSystemExists(system.id) || system.id === undefined) {
			console.log('system already exists or id is undefined', system);
			return;
		}
		console.log('adding system', system);
		systems.value.push(system);
	};

	const removeSystem = (system: OSHSystem) => {
		systems.value = systems.value.filter((s) => s !== system);
	};

	const getSystemByName = (name: string) => {
		return systems.value.find((system) => system.name === name);
	};

	const checkIfSystemExists = (id: string) => {
		return systems.value.some((system) => system.id === id);
	};

	const getSystemById = (id: string) => {
		return systems.value.find((system) => system.id === id);
	};

	// Fetch all systems EXCEPT the config system
	const getFilteredSystems = () => {
		return systems.value.filter(system => system.system.properties.properties.uid !== CONFIG_UID);
	}

	return {
		systems,
		addSystem,
		removeSystem,
		getSystemByName,
		checkIfSystemExists,
		getSystemById,
		getFilteredSystems
	};
}, { persist: { pick: ['systems'] } });

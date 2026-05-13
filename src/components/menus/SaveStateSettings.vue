<script setup lang="ts">
import { useNodeStore } from '@/stores/nodestore';
import { computed, onMounted, ref, watch } from 'vue';
import { useConfigPersistence } from '@/composables/useConfigPersistence';

const nodeStore = useNodeStore();
const { saveConfig, listConfigs } = useConfigPersistence();

const emit = defineEmits(['saved']);

const CREATE_NEW = 'Create new...';
const selectedConfig = ref<string | null>(null);
const newConfigName = ref('');
const newConfigDescription = ref('');
const availableConfigs = ref<any[]>([]);
const loadingConfigs = ref(false);
const configName = computed(() => {
	if (selectedConfig.value !== CREATE_NEW) return selectedConfig.value;
	else return newConfigName.value;
});

async function fetchConfigs() {
	loadingConfigs.value = true;
	availableConfigs.value = await listConfigs();
	loadingConfigs.value = false;
}

function itemProps(item: any) {
	return {
		title: item.name,
		subtitle: item.description,
		value: item.name,
	};
}

const configList = computed(() => {
	return [
		{
			name: CREATE_NEW,
			description: '',
		},
		...availableConfigs.value,
	];
});

function validateNewConfigName(v: string): boolean | string {
	if (!v.trim()) return 'Config name is required';
	if (availableConfigs.value.some((config) => config.name === v.trim()))
		return 'A configuration with this name already exists';
	return true;
}

const canSave = computed(() => {
	if (!selectedConfig.value) return false;
	if (selectedConfig.value === CREATE_NEW) {
		return (
			validateNewConfigName(newConfigName.value) === true &&
			!!newConfigDescription.value.trim()
		);
	}
	return true;
});

async function handleSave() {
	if (configName.value !== null) {
		const success = await saveConfig(configName.value, newConfigDescription.value);
		if (success) {
			emit('saved');
		}
	}
}

const listNodes = computed(() => {
	return nodeStore.nodes.map((node) => ({
		...node,
		id: `${node.host}:${node.port}`,
	}));
});

const selectedNode = computed({
	get: () => nodeStore.defaultNodeId,
	set: (val) => nodeStore.updateDefaultNode(val),
});

// Re-fetch configs when selected node changes
watch(selectedNode, fetchConfigs);

// Fetch on mount
onMounted(fetchConfigs);
</script>

<template>
	<v-card class="pa-2">
		<v-card-title>Save State</v-card-title>
		<v-card-text>
			<v-form @submit.prevent="handleSave">
				<v-select
					v-model="selectedNode"
					:items="listNodes"
					label="Select node to save state to"
					persistent-hint
					item-title="name"
					item-value="id"
				/>
				<v-select
					v-model="selectedConfig"
					:item-props="itemProps"
					:items="configList"
					label="Select a configuration to save to"
					persistent-hint
				/>
				<v-sheet v-if="selectedConfig === CREATE_NEW">
					<v-divider class="pb-4" />
					<h4 class="pb-4">Create a New Configuration</h4>
					<v-text-field
						v-model="newConfigName"
						label="Create new config name"
						persistent-hint
						:rules="[(v) => validateNewConfigName(v)]"
						class="pb-4"
					/>
					<v-text-field
						v-model="newConfigDescription"
						label="Create new config description"
						persistent-hint
						:rules="[(v) => !!v || 'Config description is required']"
					/>
				</v-sheet>
				<v-card-actions>
					<v-btn
						block
						type="submit"
						color="success"
						variant="tonal"
						:disabled="!canSave"
						>Save State</v-btn
					>
				</v-card-actions>
			</v-form>
		</v-card-text>
	</v-card>
</template>

<style scoped></style>

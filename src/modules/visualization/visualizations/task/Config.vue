<script setup lang="ts">
import type { VisualizationConfigRole } from '../../registry/types';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useConfig } from '../../wizard/composables/useConfig';
import RoleCheckbox from '../../wizard/components/RoleCheckbox.vue';
import ControlStreamPicker from '../../wizard/components/ControlStreamPicker.vue';
import { TaskConfigRoles } from './Descriptor';
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, ref } from 'vue';

const vizwizStore = useVizWizStore();

function restoreStreamRoles(): VisualizationConfigRole[] {
	const roles: VisualizationConfigRole[] = [...TaskConfigRoles];
	const existingKeys = new Set(roles.map((r) => r.role));

	for (const key of Object.keys(vizwizStore.csConfig)) {
		if (key.startsWith('stream-') && !existingKeys.has(key)) {
			const index = parseInt(key.split('-')[1], 10);
			roles.push({
				role: key,
				label: `Stream ${index + 1}`,
				description: 'The controlstream to task from.',
				type: 'cs',
				required: false,
				multiple: true,
				showPropertySelector: false,
			});
		}
	}

	roles.sort((a, b) => {
		const aIdx = parseInt(a.role.split('-')[1], 10);
		const bIdx = parseInt(b.role.split('-')[1], 10);
		return aIdx - bIdx;
	});

	return roles;
}

const streamRoles = ref<VisualizationConfigRole[]>(restoreStreamRoles());

const { checkedRoles, validRoles, valid, include } = useConfig(streamRoles.value, true);

function addStream() {
	const index = streamRoles.value.length;
	const newRole: VisualizationConfigRole = {
		role: `stream-${index}`,
		label: `Stream ${index + 1}`,
		description: 'The controlstream to task from.',
		type: 'cs',
		required: false,
		multiple: true,
		showPropertySelector: false,
	};
	streamRoles.value.push(newRole);
	checkedRoles[newRole.role] = true;
	validRoles[newRole.role] = false;
	vizwizStore.updateCsConfig(newRole.role, { selected: true });
}

function removeStream(index: number) {
	if (streamRoles.value.length <= 1) return;
	const role = streamRoles.value[index];
	streamRoles.value.splice(index, 1);
	delete checkedRoles[role.role];
	delete validRoles[role.role];
	delete vizwizStore.csConfig[role.role];
}

const emit = defineEmits<VisualizationComponentEmits>();
const effectiveValid = computed(() => {
	return streamRoles.value.some(
		(r) => checkedRoles[r.role] && validRoles[r.role]
	);
});
useComponentValidation(effectiveValid, emit);
</script>

<template>
	<v-container v-for="(config, index) in streamRoles" :key="config.role">
		<RoleCheckbox
			v-model="checkedRoles[config.role]"
			:label="config.label"
			:tooltip="config.description"
			:disabled="config.required"
		>
      <v-row>
        <ControlStreamPicker
            v-if="checkedRoles[config.role]"
            :role="config.role"
            :show-property-selector="config.showPropertySelector ?? true"
            v-model:valid="validRoles[config.role]"
        />
        <v-btn
            v-if="!config.required"
            variant="text"
            color="error"
            size="small"
            icon="mdi-close"
            @click="removeStream(index)"
        ></v-btn>
      </v-row>
		</RoleCheckbox>
	</v-container>

	<v-container>
		<v-btn
			variant="tonal"
			color="primary"
			prepend-icon="mdi-plus"
			@click="addStream"
		>
			Add Stream
		</v-btn>
	</v-container>
</template>

<style scoped></style>

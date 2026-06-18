<script setup lang="ts">
import type { VisualizationConfigRole } from '../../registry/types';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useConfig } from '../../wizard/composables/useConfig';
import RoleCheckbox from '../../wizard/components/RoleCheckbox.vue';
import DataSourcePicker from '../../wizard/components/DataSourcePicker.vue';
import ControlStreamPicker from '../../wizard/components/ControlStreamPicker.vue';
import { MissionConfigRoles } from './Descriptor';

const props = withDefaults(defineProps<{ configRoles: VisualizationConfigRole[] }>(), {
	configRoles: () => MissionConfigRoles,
});

const { checkedRoles, validRoles, valid } = useConfig(props.configRoles);

// Validation
const emit = defineEmits<VisualizationComponentEmits>();
useComponentValidation(valid, emit);
</script>
<template>
	<v-container v-for="config in props.configRoles">
		<RoleCheckbox
			v-model="checkedRoles[config.role]"
			:label="config.label"
			:tooltip="config.description"
			:disabled="config.required"
		>
			<DataSourcePicker
				v-if="checkedRoles[config.role] && config.type === 'ds'"
				:role="config.role"
				:multiple="config.multiple"
				v-model:valid="validRoles[config.role]"
				:show-property-selector="config.showPropertySelector ?? true"
			/>
			<ControlStreamPicker
				v-if="checkedRoles[config.role] && config.type === 'cs'"
				:role="config.role"
				:show-property-selector="config.showPropertySelector ?? true"
				v-model:valid="validRoles[config.role]"
			/>
		</RoleCheckbox>
	</v-container>
</template>

<style scoped></style>

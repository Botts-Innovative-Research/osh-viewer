<script setup lang="ts">
import type { VisualizationConfigRole } from '../../registry/types';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useConfig } from '../../wizard/composables/useConfig';
import RoleCheckbox from '../../wizard/components/RoleCheckbox.vue';
import DataSourcePicker from '../../wizard/components/DataSourcePicker.vue';
import ControlStreamPicker from '../../wizard/components/ControlStreamPicker.vue';
import { TextConfigRoles } from './Descriptor';
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{ configRoles: VisualizationConfigRole[]; optional?: boolean }>(),
	{
		configRoles: () => TextConfigRoles,
		optional: false,
	}
);

const { checkedRoles, validRoles, valid, include } = useConfig(props.configRoles, !props.optional);

// Validation
const emit = defineEmits<VisualizationComponentEmits>();
const effectiveValid = computed(() => {
	if (!props.optional) return valid.value;
	if (include.value) return valid.value;
	return true;
});
useComponentValidation(effectiveValid, emit);
</script>
<template>
	<v-container v-if="props.optional">
		<v-switch
			v-model="include"
			label="Include in visualization?"
			color="primary"
			inset="material"
		/>
	</v-container>

	<v-expand-transition>
		<div v-if="include">
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
		</div>
	</v-expand-transition>
</template>

<style scoped></style>

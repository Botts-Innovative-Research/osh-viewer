<script setup lang="ts">
import { PointMarkerConfigRoles } from './Descriptor';
import type { VisualizationConfigRole } from '../../registry/types';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useConfig } from '../../wizard/composables/useConfig';
import RoleCheckbox from '../../wizard/components/RoleCheckbox.vue';
import DataSourcePicker from '../../wizard/components/DataSourcePicker.vue';
import ControlStreamPicker from '../../wizard/components/ControlStreamPicker.vue';
import { computed, ref, watch } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const props = withDefaults(
	defineProps<{ configRoles: VisualizationConfigRole[]; optional?: boolean }>(),
	{
		configRoles: () => PointMarkerConfigRoles,
		optional: false,
	}
);

const { checkedRoles, validRoles, valid, include, autoMap } = useConfig(
	props.configRoles,
	!props.optional
);

const vizwizStore = useVizWizStore();
const useFlatLocation = ref(vizwizStore.dsConfig.location?.locationFormat === 'flat');

watch(useFlatLocation, (isFlat) => {
	vizwizStore.updateDsConfig('location', {
		property: null,
		label: null,
		locationFormat: isFlat ? 'flat' : undefined,
	});
});

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
			<v-container class="pb-0">
				<v-btn
					variant="tonal"
					color="primary"
					prepend-icon="mdi-auto-fix"
					@click="autoMap"
				>
					Auto Map Streams
				</v-btn>
			</v-container>
			<v-container v-for="config in props.configRoles">
				<RoleCheckbox
					v-model="checkedRoles[config.role]"
					:label="config.label"
					:tooltip="config.description"
					:disabled="config.required"
				>
					<v-switch
						v-if="config.role === 'location' && checkedRoles[config.role]"
						v-model="useFlatLocation"
						label="Use separate Lat / Lon / Alt fields"
						color="primary"
						density="compact"
						hide-details
						class="mb-2 ml-3"
						inset="material"
					/>
					<DataSourcePicker
						v-if="checkedRoles[config.role] && config.type === 'ds'"
						:role="config.role"
						:multiple="config.multiple"
						v-model:valid="validRoles[config.role]"
						:show-property-selector="config.showPropertySelector ?? true"
						:flat-location="config.role === 'location' && useFlatLocation"
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

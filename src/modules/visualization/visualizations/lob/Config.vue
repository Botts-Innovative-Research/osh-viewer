<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { ref, computed, reactive, watch, onMounted } from 'vue';
import DataSourcePicker from '../../wizard/components/DataSourcePicker.vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';

// Retrieve datastreams
const vizwizStore = useVizWizStore();

// Checked status for each role
const checkedRoles = reactive({
	origin: computed({
		get: () => vizwizStore.dsConfig.origin?.selected ?? true,
		set: (val: boolean) => vizwizStore.updateDsConfig('origin', { selected: val }),
	}),
	bearing: computed({
		get: () => vizwizStore.dsConfig.bearing?.selected ?? true,
		set: (val: boolean) => vizwizStore.updateDsConfig('bearing', { selected: val }),
	}),
});

// Initialize dsConfig with origin and bearing selected by default when mounted
onMounted(() => {
	if (!vizwizStore.dsConfig.origin) {
		vizwizStore.updateDsConfig('origin', { selected: true });
	}
	if (!vizwizStore.dsConfig.bearing) {
		vizwizStore.updateDsConfig('bearing', { selected: true });
	}
});

// If dsConfig is reset, ensure origin and bearing are selected by default
watch(
	() => vizwizStore.dsConfig,
	(newVal) => {
		if (!newVal.origin) {
			vizwizStore.updateDsConfig('origin', { selected: true });
		}
		if (!newVal.bearing) {
			vizwizStore.updateDsConfig('bearing', { selected: true });
		}
	},
	{ deep: true }
);

// Validation: at least origin and bearing must be selected and configured
const emit = defineEmits<VisualizationComponentEmits>();
const roleOriginValid = ref<boolean>(false);
const roleBearingValid = ref<boolean>(false);
const valid = computed(() => {
	// If role is checked, must be valid. If not checked, ignore validity
	const originValid = checkedRoles.origin ? roleOriginValid.value : true;
	const bearingValid = checkedRoles.bearing ? roleBearingValid.value : true;
	return originValid && bearingValid;
});
useComponentValidation(valid, emit);
</script>
<template>
	<!-- Origin -->
	<v-container>
		<v-checkbox
			label="Origin"
			v-model="checkedRoles.origin"
			disabled
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.origin"
			role="origin"
			v-model:valid="roleOriginValid"
		/>
	</v-container>

	<!-- Bearing -->
	<v-container>
		<v-checkbox
			label="Bearing"
			v-model="checkedRoles.bearing"
			disabled
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.bearing"
			role="bearing"
			v-model:valid="roleBearingValid"
		/>
	</v-container>
</template>

<style scoped></style>

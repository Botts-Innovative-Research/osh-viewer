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
	location: computed({
		get: () => vizwizStore.dsConfig.location?.selected ?? true,
		set: (val: boolean) => vizwizStore.updateDsConfig('location', { selected: val }),
	}),
	polylineId: computed({
		get: () => vizwizStore.dsConfig.polylineId?.selected ?? false,
		set: (val: boolean) => {
			if (val) {
				vizwizStore.updateDsConfig('polylineId', { selected: val });
			} else {
				delete vizwizStore.dsConfig.polylineId;
			}
		},
	}),
});

// Initialize dsConfig with location selected by default when mounted
onMounted(() => {
	if (!vizwizStore.dsConfig.location) {
		vizwizStore.updateDsConfig('location', { selected: true });
	}
});

// If dsConfig is reset, ensure location is selected by default
watch(
	() => vizwizStore.dsConfig,
	(newVal) => {
		if (!newVal.location) {
			vizwizStore.updateDsConfig('location', { selected: true });
		}
	},
	{ deep: true }
);

// Validation: at least location must be selected and other selected roles must be configured
const emit = defineEmits<VisualizationComponentEmits>();
const roleLocationValid = ref<boolean>(false);
const rolePolylineIdValid = ref<boolean>(false);
const valid = computed(() => {
	// If role is checked, must be valid. If not checked, ignore validity
	const locationValid = checkedRoles.location ? roleLocationValid.value : true;
	const polylineIdValid = checkedRoles.polylineId ? rolePolylineIdValid.value : true;
	return locationValid && polylineIdValid;
});
useComponentValidation(valid, emit);
</script>
<template>
	<!-- Location -->
	<v-container>
		<v-checkbox
			label="Location"
			v-model="checkedRoles.location"
			disabled
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.location"
			role="location"
			v-model:valid="roleLocationValid"
		/>
	</v-container>

	<!-- Polyline ID -->
	<v-container>
		<v-checkbox
			label="Polyline ID"
			v-model="checkedRoles.polylineId"
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.polylineId"
			role="polylineId"
			v-model:valid="rolePolylineIdValid"
			multiple
		/>
	</v-container>
</template>

<style scoped></style>

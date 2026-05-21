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
	position: computed({
		get: () => vizwizStore.dsConfig.position?.selected ?? true,
		set: (val: boolean) => vizwizStore.updateDsConfig('position', { selected: val }),
	}),
	semiMajorAxis: computed({
		get: () => vizwizStore.dsConfig.semiMajorAxis?.selected ?? true,
		set: (val: boolean) => {
			if (val) {
				vizwizStore.updateDsConfig('semiMajorAxis', { selected: val });
			} else {
				delete vizwizStore.dsConfig.semiMajorAxis;
			}
		},
	}),
	semiMinorAxis: computed({
		get: () => vizwizStore.dsConfig.semiMinorAxis?.selected ?? true,
		set: (val: boolean) => {
			if (val) {
				vizwizStore.updateDsConfig('semiMinorAxis', { selected: val });
			} else {
				delete vizwizStore.dsConfig.semiMinorAxis;
			}
		},
	}),
});

// Initialize dsConfig with position, semiMajorAxis, and semiMinorAxis selected by default when mounted
onMounted(() => {
	if (!vizwizStore.dsConfig.position) {
		vizwizStore.updateDsConfig('position', { selected: true });
	}
	if (!vizwizStore.dsConfig.semiMajorAxis) {
		vizwizStore.updateDsConfig('semiMajorAxis', { selected: true });
	}
	if (!vizwizStore.dsConfig.semiMinorAxis) {
		vizwizStore.updateDsConfig('semiMinorAxis', { selected: true });
	}
});

// If dsConfig is reset, ensure position, semiMajorAxis, and semiMinorAxis are selected by default
watch(
	() => vizwizStore.dsConfig,
	(newVal) => {
		if (!newVal.position) {
			vizwizStore.updateDsConfig('position', { selected: true });
		}
		if (!newVal.semiMajorAxis) {
			vizwizStore.updateDsConfig('semiMajorAxis', { selected: true });
		}
		if (!newVal.semiMinorAxis) {
			vizwizStore.updateDsConfig('semiMinorAxis', { selected: true });
		}
	},
	{ deep: true }
);

// Validation: at least position must be selected and other selected roles must be configured
const emit = defineEmits<VisualizationComponentEmits>();
const rolePositionValid = ref<boolean>(false);
const roleSemiMajorAxisValid = ref<boolean>(false);
const roleSemiMinorAxisValid = ref<boolean>(false);
const valid = computed(() => {
	// If role is checked, must be valid. If not checked, ignore validity
	const positionValid = checkedRoles.position ? rolePositionValid.value : true;
	const semiMajorAxisValid = checkedRoles.semiMajorAxis ? roleSemiMajorAxisValid.value : true;
	const semiMinorAxisValid = checkedRoles.semiMinorAxis ? roleSemiMinorAxisValid.value : true;
	return positionValid && semiMajorAxisValid && semiMinorAxisValid;
});
useComponentValidation(valid, emit);
</script>
<template>
	<!-- Location -->
	<v-container>
		<v-checkbox
			label="Location"
			v-model="checkedRoles.position"
			disabled
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.position"
			role="position"
			v-model:valid="rolePositionValid"
		/>
	</v-container>

	<!-- Semi-Major Axis -->
	<v-container>
		<v-checkbox
			label="Semi-Major Axis"
			v-model="checkedRoles.semiMajorAxis"
			disabled
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.semiMajorAxis"
			role="semiMajorAxis"
			v-model:valid="roleSemiMajorAxisValid"
		/>
	</v-container>

	<!-- Semi-Minor Axis -->
	<v-container>
		<v-checkbox
			label="Semi-Minor Axis"
			v-model="checkedRoles.semiMinorAxis"
			disabled
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.semiMinorAxis"
			role="semiMinorAxis"
			v-model:valid="roleSemiMinorAxisValid"
		/>
	</v-container>
</template>

<style scoped></style>

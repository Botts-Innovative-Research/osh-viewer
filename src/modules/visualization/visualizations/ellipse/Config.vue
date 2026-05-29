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
	ellipseId: computed({
		get: () => vizwizStore.dsConfig.ellipseId?.selected ?? false,
		set: (val: boolean) => {
			if (val) {
				vizwizStore.updateDsConfig('ellipseId', { selected: val });
			} else {
				delete vizwizStore.dsConfig.ellipseId;
			}
		},
	}),
	color: computed({
		get: () => vizwizStore.dsConfig.color?.selected ?? false,
		set: (val: boolean) => {
			if (val) {
				vizwizStore.updateDsConfig('color', { selected: val });
			} else {
				delete vizwizStore.dsConfig.color;
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
const roleEllipseIdValid = ref<boolean>(false);
const roleColorValid = ref<boolean>(false);
const valid = computed(() => {
	// If role is checked, must be valid. If not checked, ignore validity
	const positionValid = checkedRoles.position ? rolePositionValid.value : true;
	const semiMajorAxisValid = checkedRoles.semiMajorAxis ? roleSemiMajorAxisValid.value : true;
	const semiMinorAxisValid = checkedRoles.semiMinorAxis ? roleSemiMinorAxisValid.value : true;
	const ellipseIdValid = checkedRoles.ellipseId ? roleEllipseIdValid.value : true;
	const colorValid = checkedRoles.color ? roleColorValid.value : true;
	return (
		positionValid && semiMajorAxisValid && semiMinorAxisValid && ellipseIdValid && colorValid
	);
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

	<!-- Ellipse ID -->
	<v-container>
		<v-checkbox
			label="Ellipse ID"
			v-model="checkedRoles.ellipseId"
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.ellipseId"
			role="ellipseId"
			multiple
			v-model:valid="roleEllipseIdValid"
		/>
	</v-container>

	<!-- Color -->
	<v-container>
		<v-checkbox
			label="Color"
			v-model="checkedRoles.color"
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.color"
			role="color"
			multiple
			v-model:valid="roleColorValid"
		/>
	</v-container>
</template>

<style scoped></style>

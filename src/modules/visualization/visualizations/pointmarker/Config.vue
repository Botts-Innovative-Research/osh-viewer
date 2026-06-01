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
	orientation: computed({
		get: () => vizwizStore.dsConfig.orientation?.selected ?? false,
		set: (val: boolean) => {
			if (val) {
				vizwizStore.updateDsConfig('orientation', { selected: val });
			} else {
				delete vizwizStore.dsConfig.orientation;
			}
		},
	}),
	markerId: computed({
		get: () => vizwizStore.dsConfig.markerId?.selected ?? false,
		set: (val: boolean) => {
			if (val) {
				vizwizStore.updateDsConfig('markerId', { selected: val });
			} else {
				delete vizwizStore.dsConfig.markerId;
			}
		},
	}),
	pmIconColor: computed({
		get: () => vizwizStore.dsConfig.pmIconColor?.selected ?? false,
		set: (val: boolean) => {
			if (val) {
				vizwizStore.updateDsConfig('pmIconColor', { selected: val });
			} else {
				delete vizwizStore.dsConfig.pmIconColor;
			}
		},
	}),
	pmLabel: computed({
		get: () => vizwizStore.dsConfig.pmLabel?.selected ?? false,
		set: (val: boolean) => {
			if (val) {
				vizwizStore.updateDsConfig('pmLabel', { selected: val });
			} else {
				delete vizwizStore.dsConfig.pmLabel;
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
const roleOrientationValid = ref<boolean>(false);
const roleMarkerIdValid = ref<boolean>(false);
const rolePmIconColorValid = ref<boolean>(false);
const rolePmLabelValid = ref<boolean>(false);
const valid = computed(() => {
	// If role is checked, must be valid. If not checked, ignore validity
	const locationValid = checkedRoles.location ? roleLocationValid.value : true;
	const orientationValid = checkedRoles.orientation ? roleOrientationValid.value : true;
	const markerIdValid = checkedRoles.markerId ? roleMarkerIdValid.value : true;
	const pmIconColorValid = checkedRoles.pmIconColor ? rolePmIconColorValid.value : true;
	const pmLabelValid = checkedRoles.pmLabel ? rolePmLabelValid.value : true;
	return locationValid && orientationValid && markerIdValid && pmIconColorValid && pmLabelValid;
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

	<!-- Orientation -->
	<v-container>
		<v-checkbox
			label="Orientation"
			v-model="checkedRoles.orientation"
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.orientation"
			role="orientation"
			v-model:valid="roleOrientationValid"
		/>
	</v-container>

	<!-- Marker ID -->
	<v-container>
		<v-checkbox
			label="Marker ID"
			v-model="checkedRoles.markerId"
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.markerId"
			role="markerId"
			v-model:valid="roleMarkerIdValid"
			multiple
		/>
	</v-container>

	<!-- Color -->
	<v-container>
		<v-checkbox
			label="Icon Color"
			v-model="checkedRoles.pmIconColor"
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.pmIconColor"
			role="pmIconColor"
			multiple
			v-model:valid="rolePmIconColorValid"
		/>
	</v-container>

	<!-- Label -->
	<v-container>
		<v-checkbox
			label="Icon Label"
			v-model="checkedRoles.pmLabel"
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.pmLabel"
			role="pmLabel"
			v-model:valid="rolePmLabelValid"
		/>
	</v-container>
</template>

<style scoped></style>

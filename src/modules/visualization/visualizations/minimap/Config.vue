<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, reactive, watch, onMounted, ref } from 'vue';
import DataSourcePicker from '../../wizard/components/DataSourcePicker.vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';

const vizwizStore = useVizWizStore();

// Checked status for each role
const checkedRoles = reactive({
	location: computed({
		get: () => vizwizStore.dsConfig.location?.selected ?? true,
		set: (val: boolean) => vizwizStore.updateDsConfig('location', { selected: val }),
	}),
	orientation: computed({
		get: () => vizwizStore.dsConfig.orientation?.selected ?? false,
		set: (val: boolean) => vizwizStore.updateDsConfig('orientation', { selected: val }),
	}),
	video: computed({
		get: () => vizwizStore.dsConfig.video?.selected ?? false,
		set: (val: boolean) => vizwizStore.updateDsConfig('video', { selected: val }),
	}),
});

// Initialize dsConfig with selected by default when mounted
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

// Validation
const emit = defineEmits<VisualizationComponentEmits>();
const locationValid = ref<boolean>(false);
const orientationValid = ref<boolean>(false);
const roleVideoValid = ref<boolean>(false);

const valid = computed(() => {
	const locationValidChecked = checkedRoles.location ? locationValid.value : true;
	const orientationValidChecked = checkedRoles.orientation ? orientationValid.value : true;
	const videoValid = checkedRoles.video ? roleVideoValid.value : true;

	return videoValid && locationValidChecked && orientationValidChecked;
});
useComponentValidation(valid, emit);
</script>
<template>
	<v-container>
		<v-checkbox
			label="Location"
			v-model="checkedRoles.location"
			disabled
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.location"
			role="location"
			:show-property-selector="false"
			v-model:valid="locationValid"
		/>
	</v-container>

	<v-container>
		<v-checkbox
			label="Attitude (required for 1st person view)"
			v-model="checkedRoles.orientation"
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.orientation"
			role="orientation"
			:show-property-selector="false"
			v-model:valid="orientationValid"
		/>
	</v-container>

	<v-container>
		<v-checkbox
			label="Video"
			v-model="checkedRoles.video"
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.video"
			role="video"
			v-model:valid="roleVideoValid"
		/>
	</v-container>
</template>

<style scoped></style>

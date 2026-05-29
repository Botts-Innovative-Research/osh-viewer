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
	lobId: computed({
		get: () => vizwizStore.dsConfig.lobId?.selected ?? false,
		set: (val: boolean) => {
			if (val) {
				vizwizStore.updateDsConfig('lobId', { selected: val });
			} else {
				delete vizwizStore.dsConfig.lobId;
			}
		},
	}),
	iconColor: computed({
		get: () => vizwizStore.dsConfig.iconColor?.selected ?? false,
		set: (val: boolean) => {
			if (val) {
				vizwizStore.updateDsConfig('iconColor', { selected: val });
			} else {
				delete vizwizStore.dsConfig.iconColor;
			}
		},
	}),
	lineColor: computed({
		get: () => vizwizStore.dsConfig.lineColor?.selected ?? false,
		set: (val: boolean) => {
			if (val) {
				vizwizStore.updateDsConfig('lineColor', { selected: val });
			} else {
				delete vizwizStore.dsConfig.lineColor;
			}
		},
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
const roleLobIdValid = ref<boolean>(false);
const roleIconColorValid = ref<boolean>(false);
const roleLineColorValid = ref<boolean>(false);
const valid = computed(() => {
	// If role is checked, must be valid. If not checked, ignore validity
	const originValid = checkedRoles.origin ? roleOriginValid.value : true;
	const bearingValid = checkedRoles.bearing ? roleBearingValid.value : true;
	const lobIdValid = checkedRoles.lobId ? roleLobIdValid.value : true;
	const iconColorValid = checkedRoles.iconColor ? roleIconColorValid.value : true;
	const lineColorValid = checkedRoles.lineColor ? roleLineColorValid.value : true;
	return originValid && bearingValid && lobIdValid && iconColorValid && lineColorValid;
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

	<!-- LoB ID -->
	<v-container>
		<v-checkbox
			label="LoB ID"
			v-model="checkedRoles.lobId"
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.lobId"
			role="lobId"
			multiple
			v-model:valid="roleLobIdValid"
		/>
	</v-container>

	<!-- Icon Color -->
	<v-container>
		<v-checkbox
			label="Icon Color"
			v-model="checkedRoles.iconColor"
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.iconColor"
			role="iconColor"
			multiple
			v-model:valid="roleIconColorValid"
		/>
	</v-container>

	<!-- Line Color -->
	<v-container>
		<v-checkbox
			label="Line Color"
			v-model="checkedRoles.lineColor"
		></v-checkbox>
		<DataSourcePicker
			v-if="checkedRoles.lineColor"
			role="lineColor"
			multiple
			v-model:valid="roleLineColorValid"
		/>
	</v-container>
</template>

<style scoped></style>

<script setup lang="ts">
import { ref } from 'vue';

const props = withDefaults(
	defineProps<{
		disabled?: boolean;
		isSelected?: boolean;
		hideAlt?: boolean;
		defaultAlt?: number;
		buttonLabel?: string;
		buttonIcon?: string;
	}>(),
	{
		disabled: false,
		isSelected: false,
		hideAlt: false,
		defaultAlt: 0,
		buttonLabel: 'Add',
		buttonIcon: 'mdi-plus',
	}
);

const emit = defineEmits<{
	toggle: [];
	submit: [payload: { lat: number; lon: number; alt: number }];
}>();

const latInput = ref<number>(0.0);
const lonInput = ref<number>(0.0);
const altInput = ref<number>(props.defaultAlt);
const form = ref<any>(null);

async function onSubmit() {
	const { valid } = await form.value.validate();
	if (!valid) return;

	emit('submit', {
		lat: latInput.value,
		lon: lonInput.value,
		alt: props.hideAlt ? 0 : altInput.value,
	});
}

function setLatLonAlt(lat: number, lon: number, alt: number) {
	latInput.value = lat;
	lonInput.value = lon;
	altInput.value = alt;
}

function setLatLonAltAndSubmit(lat: number, lon: number, alt: number) {
	setLatLonAlt(lat, lon, alt);
	onSubmit();
}

defineExpose({ setLatLonAlt, setLatLonAltAndSubmit });
</script>

<template>
	<v-form ref="form">
		<v-row
			density="comfortable"
			cols="12"
			class="d-flex align-center justify-center pb-4"
		>
			<v-col
				cols="auto"
				xs="3"
			>
				<IconButton
					:color="isSelected ? 'primary' : 'grey'"
					@click="emit('toggle')"
					:disabled="disabled"
					rounded="xl"
				>
					<v-icon>{{
						isSelected ? 'mdi-crosshairs-gps' : 'mdi-crosshairs'
					}}</v-icon>
				</IconButton>
				<v-tooltip
					activator="parent"
					location="top"
				>
					{{
						isSelected
							? 'Click map to set location'
							: 'Enable map selection'
					}}
				</v-tooltip>
			</v-col>
			<v-col
				cols="2.5"
				xs="3"
				class="field-floating-details"
			>
				<v-text-field
					v-model.number="latInput"
					type="number"
					label="Latitude"
					placeholder="0.0"
					hint="-90 to 90"
					:rules="[
						(v) => (v >= -90 && v <= 90) || 'Must be -90 to 90',
					]"
				/>
			</v-col>
			<v-col
				cols="2.5"
				xs="3"
				class="field-floating-details"
			>
				<v-text-field
					v-model.number="lonInput"
					type="number"
					label="Longitude"
					placeholder="0.0"
					hint="-180 to 180"
					:rules="[
						(v) => (v >= -180 && v <= 180) || 'Must be -180 to 180',
					]"
				/>
			</v-col>
			<v-col
				v-if="!hideAlt"
				cols="2.5"
				xs="3"
				class="field-floating-details"
			>
				<v-text-field
					v-model.number="altInput"
					type="number"
					label="Altitude"
					placeholder="0.0"
					hide-details
				/>
			</v-col>
			<v-col xs="12">
				<v-btn
					block
					color="primary"
					variant="tonal"
					@click="onSubmit"
					:prepend-icon="buttonIcon"
					:disabled="disabled"
				>
					{{ buttonLabel }}
				</v-btn>
			</v-col>
		</v-row>
	</v-form>
</template>

<style scoped>
.field-floating-details {
	position: relative;
}

.field-floating-details :deep(.v-input__details) {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
}
</style>
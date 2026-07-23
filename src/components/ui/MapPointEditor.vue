<script setup lang="ts">
import { computed, ref } from 'vue';
import { MapPoint } from '@/modules/map/types';
import ActionButton from "@/components/ui/ActionButton.vue";

const props = withDefaults(
	defineProps<{
		hasSelector?: boolean; // Whether the crosshair "selector" button is included
		isSelected?: boolean; // Crosshair "selector" button state
		isSelectorDisabled?: boolean; // Crosshair "selector" disabled status
		selectorToolLabel?: string; // Name of tool to use in selector button's tooltip
		hasSubmit?: boolean; // Whether "Send"/"Submit" button is included
		submitLabel?: string; // Label for submit button
		submitIcon?: string; // Icon for submit button
		hideAlt?: boolean; // Whether to include altitude input
		minAlt?: number; // Minimum value for altitude, inclusive
	}>(),
	{
		hasSelector: true,
		isSelected: false,
		isSelectorDisabled: true,
		selectorToolLabel: 'map tool',
		hasSubmit: true,
		submitLabel: 'Add',
		submitIcon: 'mdi-plus',
		hideAlt: false,
	}
);

// MapPoint value of the editor
const point = defineModel<MapPoint>({
	required: true,
});

// Emit selector toggled
const emit = defineEmits<{
	toggle: [];
	submit: [point: MapPoint];
}>();

const form = ref<any>(null);
const valid = ref(false);
async function onSubmit() {
	console.log('Test');
	const { valid } = await form.value.validate();
	if (!valid) return;

	if (!valid || !point.value) return;
	emit('submit', { ...point.value });
}
// Set default value of input to 0 when none given
function defaultToZero(key: keyof MapPoint) {
	const value = point.value[key] as number | '' | null | undefined;
	if (value == null || value === '') {
		point.value[key] = 0;
	}
}
</script>

<template>
	<v-form
		ref="form"
		v-model="valid"
	>
		<v-row
			density="compact"
			cols="12"
			class="d-flex align-center justify-center pb-4"
		>
			<v-col
				cols="auto"
				v-if="props.hasSelector"
			>
				<IconButton
					:color="props.isSelected ? 'primary' : 'grey'"
					@click="emit('toggle')"
					:disabled="props.isSelectorDisabled"
					rounded="xl"
				>
					<v-icon>{{
						props.isSelected ? 'mdi-crosshairs-gps' : 'mdi-crosshairs'
					}}</v-icon>
				</IconButton>
				<v-tooltip
					activator="parent"
					location="top"
				>
					{{
						props.isSelected
							? 'Click map to set location'
							: `Enable ${props.selectorToolLabel}`
					}}
				</v-tooltip>
			</v-col>
			<v-col
				cols="2.5"
				class="field-floating-details"
			>
				<v-text-field
					v-model.number="point.lat"
					type="number"
					label="Latitude"
					placeholder="0.0"
					hint="-90 to 90"
					min="-90"
					max="90"
					:rules="[(v) => (v >= -90 && v <= 90) || 'Must be -90 to 90']"
					@blur="defaultToZero('lat')"
				/>
			</v-col>
			<v-col
				cols="2.5"
				class="field-floating-details"
			>
				<v-text-field
					v-model.number="point.lon"
					type="number"
					label="Longitude"
					placeholder="0.0"
					hint="-180 to 180"
					min="-180"
					max="180"
					:rules="[(v) => (v >= -180 && v <= 180) || 'Must be -180 to 180']"
					@blur="defaultToZero('lon')"
				/>
			</v-col>
			<v-col
				cols="2.5"
				v-if="!hideAlt"
				class="field-floating-details"
			>
				<v-text-field
					v-model.number="point.alt"
					type="number"
					label="Altitude"
					placeholder="0.0"
					:min="props.minAlt"
					:rules="
						props.minAlt
							? [
									(v) =>
										v >= (props.minAlt ?? 0) ||
										`Must be at least ${props.minAlt}`,
								]
							: []
					"
					@blur="defaultToZero('alt')"
				/>
			</v-col>
			<v-col
				cols="2.5"
				v-if="props.hasSubmit"
				class="field-floating-details"
			>
        <ActionButton
            :label="props.submitLabel"
            :icon="props.submitIcon"
            :disabled="!valid"
            @submit="onSubmit"
        />
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

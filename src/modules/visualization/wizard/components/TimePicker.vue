<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { DateTime } from 'luxon';
import { useVisualizationStore } from '@/stores/visualizationstore';

const props = defineProps<{ title: string }>();
const emit = defineEmits(['update:formattedDate']);
const visualizationStore = useVisualizationStore();

// Split the incoming timeInstant into date and time parts
const date = ref(0);
const year = ref(0);
const month = ref(0);
const day = ref(0);
const time = ref(0);
const hour = ref(0);
const minute = ref(0);
const second = ref(0);

const minSecondMin = 0;
const minSecondMax = 59;
const hourMin = 0;
const hourMax = 23;
const monthMin = 1;
const monthMax = 12;
const dayMin = 1;
const dayMax = 31;

// Generate year, month, day options
const currentYear = DateTime.utc().year;
const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

const manualInput = ref(false);
const manualDate = ref('');
const manualInputError = ref('');

const formattedDate = computed({
	get() {
		if (manualInput.value) {
			// Validate manual input using Luxon
			const dt = DateTime.fromISO(manualDate.value, { zone: 'utc' });
			if (!dt.isValid) {
				manualInputError.value = dt.invalidExplanation || 'Invalid ISO date/time format.';
			} else {
				manualInputError.value = '';
			}
			return manualDate.value;
		}
		return DateTime.fromObject(
			{
				year: year.value,
				month: month.value,
				day: day.value,
				hour: hour.value,
				minute: minute.value,
				second: second.value,
			},
			{ zone: 'utc' }
		).toISO();
	},
	set(val: string) {
		if (manualInput.value) {
			manualDate.value = val;
		}
	},
});

watch(formattedDate, (newVal, oldVal) => {
	if (newVal !== oldVal && !manualInputError.value) {
		emit('update:formattedDate', newVal);
		console.log('[TimePicker] Time instant updated:', newVal);
	}
});

onMounted(() => {
	const nowUTC = DateTime.utc();
	console.log('[TimePicker] Mounted, setting initial values based on current date:', nowUTC);
	year.value = nowUTC.year;
	month.value = nowUTC.month;
	day.value = nowUTC.day;
	hour.value = nowUTC.hour;
	minute.value = nowUTC.minute;
	second.value = nowUTC.second;

	console.log(
		'[TimePicker] Initializing TimePicker with current date:',
		year.value,
		month.value,
		day.value,
		hour.value,
		minute.value,
		second.value
	);
});
</script>

<template>
	<v-card class="pa-2">
		<v-card-title>{{ props.title }}</v-card-title>
		<v-container>
			<v-row>
				<v-text-field
					v-model="formattedDate"
					label="ISO Time Instant (UTC)"
				/>
			</v-row>

			<v-row
				v-if="!manualInput"
				dense
			>
				<v-col cols="4">
					<v-combobox
						v-model="year"
						:items="yearOptions"
						label="Year"
						type="number"
						variant="solo"
						density="compact"
					/>
				</v-col>
				<v-col cols="3">
					<v-combobox
						v-model="month"
						:items="monthOptions"
						label="Month"
						type="number"
						variant="solo"
						density="compact"
					/>
				</v-col>
				<v-col cols="3">
					<v-combobox
						v-model="day"
						:items="dayOptions"
						label="Day"
						type="number"
						variant="solo"
						density="compact"
					/>
				</v-col>
			</v-row>

			<v-row
				v-if="!manualInput"
				dense
			>
				<v-col cols="3">
					<v-number-input
						v-model="hour"
						label="Hour"
						type="number"
						variant="solo"
						control-variant="split"
						:min="hourMin"
						:max="hourMax"
						density="compact"
					/>
				</v-col>
				<v-col cols="3">
					<v-number-input
						v-model="minute"
						label="Minute"
						type="number"
						variant="solo"
						control-variant="split"
						:min="minSecondMin"
						:max="minSecondMax"
						density="compact"
					/>
				</v-col>
				<v-col cols="3">
					<v-number-input
						v-model="second"
						label="Second"
						type="number"
						variant="solo"
						control-variant="split"
						:min="minSecondMin"
						:max="minSecondMax"
						density="compact"
					/>
				</v-col>
			</v-row>

			<v-row>
				<v-col>
					<v-checkbox
						v-model="manualInput"
						label="Enable manual input"
					/>
				</v-col>
			</v-row>

			<v-row v-if="manualInput">
				<v-col>
					<v-alert
						v-if="manualInputError"
						type="error"
						dismissible
					>
						{{ manualInputError }}
					</v-alert>
				</v-col>
			</v-row>
		</v-container>
	</v-card>
</template>

<style scoped></style>

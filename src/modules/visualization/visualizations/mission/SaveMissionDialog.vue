<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
	waypointCount: number;
}>();

const show = defineModel<boolean>({ required: true });

const emit = defineEmits<{
	save: [name: string];
}>();

const missionName = ref('');

function save() {
	const name = missionName.value.trim();
	if (!name) return;
	emit('save', name);
	missionName.value = '';
}

function cancel() {
	show.value = false;
	missionName.value = '';
}
</script>

<template>
	<v-dialog
		v-model="show"
		max-width="400"
	>
		<v-card>
			<v-card-title>Save Mission</v-card-title>
			<v-card-text>
				<v-text-field
					v-model="missionName"
					label="Mission Name"
					density="compact"
					autofocus
					:rules="[() => !!missionName.trim() || 'Name is required']"
					@keyup.enter="save"
				/>
				<p class="text-caption text-grey mt-2">
					{{ waypointCount }} waypoints will be saved with current settings.
				</p>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					variant="text"
					@click="cancel"
					>Cancel</v-btn
				>
				<v-btn
					color="primary"
					variant="flat"
					@click="save"
					prepend-icon="mdi-content-save"
					>Save</v-btn
				>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

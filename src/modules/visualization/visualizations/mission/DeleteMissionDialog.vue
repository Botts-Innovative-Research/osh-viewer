<script setup lang="ts">
const show = defineModel<boolean>({ required: true });

const emit = defineEmits<{
	confirm: [];
}>();

function confirm() {
	emit('confirm');
}
</script>

<template>
	<v-dialog
		v-model="show"
		max-width="400"
	>
		<v-card>
			<v-card-item>
				<v-card-title>Delete Mission</v-card-title>
			</v-card-item>
			<v-card-text>
				Are you sure you want to delete this mission? This action cannot be undone.
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					variant="text"
					@click="show = false"
					>Cancel</v-btn
				>
				<v-btn
					color="error"
					variant="flat"
					@click="confirm"
					>Delete</v-btn
				>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

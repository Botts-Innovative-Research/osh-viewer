<script setup lang="ts">
const props = defineProps<{
	title: string;
	subtitle?: string;
	text: string;
	confirmText?: string;
	confirmColor?: string;
}>();

const emit = defineEmits<{
	cancel: [];
	confirm: [];
}>();

const model = defineModel<boolean>();
</script>

<template>
	<v-dialog
		v-model="model"
		max-width="400"
	>
		<v-card>
			<v-card-item>
				<v-card-title>{{ props.title }}</v-card-title>
				<v-card-subtitle v-if="props.subtitle">
					{{ props.subtitle }}
				</v-card-subtitle>
			</v-card-item>
			<v-card-text>
				{{ props.text }}
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					variant="text"
					@click="emit('cancel')"
				>
					Cancel
				</v-btn>
				<v-btn
					:color="props.confirmColor ?? 'error'"
					variant="flat"
					@click="emit('confirm')"
				>
					{{ props.confirmText ?? 'Confirm' }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

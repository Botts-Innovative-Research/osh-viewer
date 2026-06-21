<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { OSHSystem } from '@/lib/OSHConnectDataStructs';

const props = defineProps<{
	system: OSHSystem;
}>();
</script>

<template>
	<v-card class="pa-2">
		<v-card-title>Customize FOI</v-card-title>
		<v-card-text>
			<v-alert
				:text="props.system.name"
				type="info"
				class="mb-4"
			></v-alert>
			<v-list>
				<v-list-item>
					<v-list-item-title>Test</v-list-item-title>
				</v-list-item>
			</v-list>
		</v-card-text>
	</v-card>
</template>

<style scoped></style>

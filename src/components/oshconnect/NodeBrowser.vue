<script setup>
	import { useNodeStore } from '@/stores/nodestore.ts';
	import { storeToRefs } from 'pinia';

	const nodeStore = useNodeStore();
	const { nodes } = storeToRefs(nodeStore);
</script>
<template>
	<div class="scrollable-panels">
		<v-expansion-panels density="compact">
			<v-expansion-panel v-for="node in nodes" :key="node.uuid">
				<v-expansion-panel-title>
					<div class="d-flex align-center">
						<v-icon class="mr-2">mdi-server</v-icon>
						<span class="font-weight-bold mr-4">{{ node.name }}</span>
						<v-spacer></v-spacer>
						<v-chip size="small" :color="node.tls ? 'success' : 'warning'">
							{{ node.tls ? 'Secure' : 'Unsecure' }}
						</v-chip>
					</div>
				</v-expansion-panel-title>
				<v-expansion-panel-text>
					<v-list density="compact">
						<v-list-item>
							<v-list-item-subtitle>Node Host</v-list-item-subtitle>
							<v-list-item-title>{{ node.host }}</v-list-item-title>
						</v-list-item>
						<v-list-item>
							<v-list-item-subtitle>Node Port</v-list-item-subtitle>
							<v-list-item-title>{{ node.port }}</v-list-item-title>
						</v-list-item>
						<v-list-item>
							<v-list-item-subtitle>Node Path</v-list-item-subtitle>
							<v-list-item-title>{{ node.apiRoot }}</v-list-item-title>
						</v-list-item>
						<v-list-item>
							<v-list-item-subtitle>Node User</v-list-item-subtitle>
							<v-list-item-title>{{ node.username }}</v-list-item-title>
						</v-list-item>
					</v-list>
				</v-expansion-panel-text>
			</v-expansion-panel>
		</v-expansion-panels>
	</div>
</template>

<style scoped>
	.scrollable-panels {
		max-height: 600px;
		overflow-y: auto;
	}
</style>

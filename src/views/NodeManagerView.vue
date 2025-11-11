<script setup>
	import NodeManager from '@/components/oshconnect/NodeManager.vue';
	import NodeBrowser from '@/components/oshconnect/NodeBrowser.vue';
	import HeaderToolbar from '@/components/HeaderToolbar.vue';
</script>

<template>
	<v-card flat class="fill-height pa-0" style="background: transparent; box-shadow: none">
		<v-container fluid class="fill-height pa-0">
			<v-row no-gutters align="stretch" class="fill-height">
				<v-col cols="12" md="6" class="d-flex flex-column fill-height">
					<v-card title="Node Manager" class="manager-card flex-grow-1" elevation="6">
						<NodeManager class="flex-grow-1" />
					</v-card>
				</v-col>
				<v-col cols="12" md="6" class="d-flex flex-column fill-height">
					<v-card title="Nodes" class="browser-card flex-grow-1" elevation="6">
						<NodeBrowser class="fill-height" />
					</v-card>
				</v-col>
			</v-row>
		</v-container>
	</v-card>
</template>

<style scoped>
	.fill-height {
		height: 100vh;
		min-height: 100vh;
	}
	.flex-grow-1 {
		flex-grow: 1;
	}
	.manager-card,
	.browser-card {
		margin: 16px;
		border-radius: 14px;
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.1),
			0 1.5px 4px rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
	}
	@media (max-width: 960px) {
		.manager-card,
		.browser-card {
			margin: 8px 0;
		}
	}
</style>

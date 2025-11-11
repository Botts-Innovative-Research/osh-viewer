<script setup>
	import { ref } from 'vue';
	import { useSystemStore } from '@/stores/systemstore.ts';
	import { useDataStreamStore } from '@/stores/datastreamstore.ts';

	const datastreams = useDataStreamStore().dataStreams;
</script>
<template>
	<v-treeview
		width="100%"
		:items="datastreams"
		item-value="uuid"
		item-title="name"
		color="primary"
		activatable>
	</v-treeview>
</template>

<style scoped></style>

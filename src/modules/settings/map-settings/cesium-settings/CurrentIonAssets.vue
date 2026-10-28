<script setup lang="ts">
import DeleteButton from '@/components/ui/DeleteButton.vue';
import { useCesiumIonStore } from '@/stores/cesiumionstore';

const cesiumIonStore = useCesiumIonStore();
</script>
<template>
	<v-list
		activatable
		bg-color="transparent"
	>
		<v-list-item
			v-for="asset in cesiumIonStore.addedAssets"
			:key="asset.id"
			class="ga-2 px-2"
			v-if="cesiumIonStore.addedAssets.length > 0"
		>
			<template #prepend>
				<DeleteButton
					label="Remove asset"
					@delete="cesiumIonStore.removeAsset(asset.id)"
				>
				</DeleteButton>
			</template>
			<v-list-item-title>{{ asset.name }}</v-list-item-title>
		</v-list-item>
		<v-list-item v-else>
			No assets added yet.
		</v-list-item>
	</v-list>
</template>
<script setup lang="ts">
import { computed } from 'vue';


const props = defineProps<{
  items: any[];
  selectedItem: any;
  tooltip: boolean;
}>()

const emit = defineEmits<{
  (e: 'update:value', value: any): void
}>()

const selectedItem = computed({
  get: () => props.selectedItem,
  set: (val: any) => emit('update:value', val)
})

function selectItem(item: string) {
	selectedItem.value = item
}

</script>

<template>
	<v-row justify="center" class="mb-2" v-if="items.length > 0">
		<v-col v-for="item in items" :key="item.id" cols="12" sm="6" md="3"
			class="d-flex justify-center">
			<v-card :elevation="selectedItem == item ? 10 : 2" :color="selectedItem == item ? 'primary' : ''"
				class="d-flex flex-column align-center justify-center pa-4 type-card" @click="selectItem(item.id)"
				style="cursor: pointer; min-height: 120px; max-width: 220px; width: 100%">
				<v-icon size="36" class="mb-2">{{ item.icon }}</v-icon>
				<span>{{ item.label }}</span>
				<v-tooltip v-if="props.tooltip" activator="parent" location="bottom">{{ item.description }}</v-tooltip>
			</v-card>
		</v-col>
	</v-row>
</template>
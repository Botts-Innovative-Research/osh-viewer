<script setup lang="ts">
import { computed, toRaw } from 'vue';

const props = defineProps<{
	items: any[];
	selectedItem: any;
	tooltip: boolean;
	size: 'small' | 'large';
}>();

const emit = defineEmits<{
	(e: 'update:value', value: any): void;
}>();

const selectedItem = computed({
	get: () => props.selectedItem,
	set: (val: any) => emit('update:value', val),
});

function selectItem(item: any) {
	selectedItem.value = item;
}
</script>

<template>
	<v-item-group
		mandatory
		:model-value="selectedItem"
		@update:model-value="selectItem"
	>
		<v-container>
			<v-row>
				<TransitionGroup
					tag="div"
					class="d-flex flex-wrap w-100"
				>
					<v-col
						v-for="item in items"
						:key="item.id"
						:cols="props.size === 'small' ? 2 : 3"
					>
						<v-item
							:value="item"
							v-slot="{ isSelected, toggle }"
						>
							<v-card
								:color="isSelected ? 'primary' : ''"
								class="d-flex align-center justify-center"
								:height="props.size === 'small' ? 100 : 150"
								@click="toggle"
							>
								<v-scroll-y-transition>
									<div class="d-flex flex-column align-center text-center">
										<v-icon
											size="36"
											class="mb-2"
											>{{
												item.icon.startsWith('mdi-')
													? item.icon
													: `mdi-${item.icon}`
											}}</v-icon
										>
										<span>{{ item.label }}</span>
									</div>
								</v-scroll-y-transition>
								<v-tooltip
									v-if="props.tooltip"
									activator="parent"
									location="bottom"
									>{{ item.description }}</v-tooltip
								>
							</v-card>
						</v-item>
					</v-col>
				</TransitionGroup>
			</v-row>
		</v-container>
	</v-item-group>
</template>

<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import { computed, ref, watch } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import AudioOptions from '@/modules/visualization/wizard/customizations/AudioOptions.vue';

const openPanels = ref<string[]>(['general', 'audio']);

const vizwizStore = useVizWizStore();
const defaultName = ref<string>('');


watch(
    () => vizwizStore.dsConfig.samples,
    (val) => {
       if (val && val.label) {
          defaultName.value = val.label + (val.uom ? ` (${val.uom})` : '');
       }
    },
    { immediate: true, deep: true }
);

// Validation: Name cannot be empty
const emit = defineEmits<VisualizationComponentEmits>();
const nameValid = ref<boolean>(false);
const audioOptionsValid = ref<boolean>(false);
const valid = computed(() => nameValid.value && audioOptionsValid.value);
useComponentValidation(valid, emit);


</script>

<template>
	<v-expansion-panels
		rounded="lg"
		static
		multiple
		v-model="openPanels"
	>
		<v-expansion-panel
			eager
			value="general"
		>
			<v-expansion-panel-title>
				General
				<template
					v-slot:actions
					v-if="!nameValid"
				>
					<v-icon
						color="error"
						icon="mdi-alert-circle"
					>
					</v-icon>
				</template>
			</v-expansion-panel-title>
			<v-expansion-panel-text>
				<name-control
					:default-name="defaultName"
					v-model:valid="nameValid"
				></name-control>
			</v-expansion-panel-text>
		</v-expansion-panel>
        <v-expansion-panel
            eager
            title="Chart Options"
            value="audio"
        >
            <v-expansion-panel-text>
                <AudioOptions v-model:valid="audioOptionsValid" />
            </v-expansion-panel-text>
        </v-expansion-panel>
	</v-expansion-panels>
</template>

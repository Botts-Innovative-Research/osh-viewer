import { useUIStore } from '@/stores/uistore';
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, nextTick, onMounted, ref, toRaw } from 'vue';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { VisualizationFormComponent } from '../../registry/types';
import { VisualizationRegistry } from '../../registry/VisualizationRegistry';
import SelectType from '../SelectType.vue';
import SelectData from '../SelectData.vue';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { showToast } from '@/composables/useToast';

export function useVisualizationWizard(options: {
	mode: 'create' | 'edit';
	viz?: OSHVisualization;
}) {
	// Stores
	const uiStore = useUIStore();
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	// States
	const isLoading = ref(true);
	const currentStep = ref(1);
	const componentValid = ref<boolean[]>([]);
	const selectedType = ref<string>('');
	const initialConfig = ref(null);

	/* INIT */
	async function init() {
		vizwizStore.reset();

		if (options.mode === 'create') {
			vizwizStore.setId(`visualization-${randomUUID()}`);
		} else if (options.mode === 'edit' && options.viz) {
			console.log("help me")
			initialConfig.value = JSON.parse(JSON.stringify(options.viz.wizardConfig));
			vizwizStore.setWizardConfig(options.viz.wizardConfig);
			selectedType.value = options.viz.type;
			await nextTick();
		}

		isLoading.value = false;
	};

	/* STEP BUILDING */
	const completeSteps = computed(() => {
		const baseSteps: VisualizationFormComponent[] = [
			{
				id: 'select-type',
				label: 'Select Visualization Type',
				short: 'Type',
				component: SelectType,
			},
			{
				id: 'select-data',
				label: `Select System & Datasource - ${VisualizationRegistry[selectedType.value]?.label || 'Unknown'}`,
				short: 'Data',
				component: SelectData,
			},
		];

		if (!selectedType.value) {
			const placeholderStep: VisualizationFormComponent = {
				id: 'placeholder',
				label: 'Next steps',
				short: '...',
				component: null,
			};
			return [...baseSteps, placeholderStep];
		} else {
			const entry = VisualizationRegistry[selectedType.value];
			const dynamicSteps: VisualizationFormComponent[] = entry.formComponents ?? [];
			return [...baseSteps, ...dynamicSteps];
		}
	});

	/* NAVIGATION */
	function changeStep(direction: number) {
		const newStep = currentStep.value + direction;
		if (newStep < 1) return;
		if (newStep > completeSteps.value.length) return;
		currentStep.value = newStep;
	}
	function stepStatus(index: number) {
		if (index < currentStep.value) return 'primary';
		if (index === currentStep.value) return 'primary';
		return '';
	}
	const isLastStep = computed(() => currentStep.value === completeSteps.value.length);

	/* SUBMIT */
	async function submit() {
		const type = selectedType.value;
		const entry = VisualizationRegistry[type];

		if (!entry) return;

		if (options.mode === 'edit') {
			const initial = JSON.stringify(toRaw(initialConfig.value));
			const updated = JSON.stringify(toRaw(vizwizStore.getWizardConfig()));

			// No changes made, skip build
			if (initial === updated) {
				console.log('No changes were made. Skipping rebuild.');
				showToast('No changes made to visualization', 'INFO');
				return;
			}
			// Changes made, delete and unmount old viz
			else if (options.viz) {
				visualizationStore.removeVisualization(options.viz); // Delete old visualization
				await nextTick(); // Let Vue unmount the viz component and disconnect datasources
			}
		}

		// Call default "build" function from the builder module
		const builderModule = await entry.builder();
		builderModule.default();

		// Close the wizard
		showToast(`Visualization ${options.mode === 'create' ? 'created' : 'updated'}`, 'SUCCESS');
		uiStore.vizWizOpen = false;
	}

	return {
		isLoading,
		currentStep,
		componentValid,
		selectedType,
		completeSteps,
    stepStatus,
		isLastStep,
		changeStep,
		init,
		submit,
	};
}

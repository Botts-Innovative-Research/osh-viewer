<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();

const milSymbol = ref('');

function selectMilSymbol(val: string) {
    milSymbol.value = val;

    vwStore.updateVisualizationCustomizationOptions({
        milSymbol: val,
    });
}

onMounted(() => {
    if (vwStore.visualizationCustomizationOptions.milSymbol) {
        milSymbol.value = vwStore.visualizationCustomizationOptions.milSymbol;
    }
});
</script>

<template>
    <div>
        <h3>Military Symbol</h3>

        <v-select
            :model-value="milSymbol"
            :items="['SFGPUCI----K---', 'SFGPEWRH---A---']"
            label="Select military symbol"
            @update:model-value="selectMilSymbol"
        />
    </div>
</template>

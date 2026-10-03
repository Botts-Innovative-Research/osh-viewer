<script setup lang="ts">
import { ref, computed } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';
import ms from 'milsymbol';
import RadioCards from '@/components/ui/RadioCards.vue';

const vwStore = useVizWizStore();

// Types for the catalog
interface MilSymbolOption {
    title: string;
    functionId: string; // 6 chars, '-' padded
}

interface MilSymbolCategory {
    value: string; // battle dimension letter in the SIDC
    title: string;
    icon: string;
    symbols: MilSymbolOption[];
}

// Categories and their sample symbols
const milSymbolCategories: MilSymbolCategory[] = [
    {
        value: 'P',
        title: 'Space',
        icon: 'mdi-satellite-variant',
        symbols: [
            { title: 'Satellite', functionId: 'S-----' },
        ],
    },
    {
        value: 'A',
        title: 'Air',
        icon: 'mdi-airplane',
        symbols: [
            { title: 'Military Fixed Wing', functionId: 'MF----' },
            { title: 'Military Rotary Wing', functionId: 'MH----' },
        ],
    },
    {
        value: 'G',
        title: 'Ground',
        icon: 'mdi-tank',
        symbols: [
            { title: 'Infantry', functionId: 'UCI---' },
            { title: 'Armor', functionId: 'UCA---' },
        ],
    },
    {
        value: 'S',
        title: 'Sea Surface',
        icon: 'mdi-ferry',
        symbols: [
            { title: 'Surface Combatant', functionId: 'C-----' },
            { title: 'Carrier', functionId: 'CLCV--' },
        ],
    },
    {
        value: 'U',
        title: 'Sea Subsurface',
        icon: 'mdi-submarine',
        symbols: [
            { title: 'Submarine', functionId: 'S-----' },
        ],
    },
    {
        value: 'F',
        title: 'SOF',
        icon: 'mdi-parachute',
        symbols: [
            { title: 'SOF Ground', functionId: 'G-----' },
            { title: 'SOF Naval', functionId: 'N-----' },
        ],
    },
];

// Builds a full 15-character SIDC from its parts
function buildSidc(affiliation: string, dimension: string, functionId: string): string {
    return `S${affiliation}${dimension}P${functionId}`.padEnd(15, '-');
}

const affiliation = 'F'; // friendly for now
const category = ref<string | null>(null);
const selectedSidc = ref<string | null>(null);

// Restore a previously saved symbol
const saved = vwStore.visualizationCustomizationOptions.milSymbol as string | undefined;
if (saved && milSymbolCategories.some((c) => c.value === saved[2])) {
    category.value = saved[2];
    selectedSidc.value = saved;
}

// The category object matching the dropdown selection
const selectedCategory = computed(() =>
    milSymbolCategories.find((c) => c.value === category.value)
);

// Palette items for RadioCards, built from the selected category's symbols
const palette = computed(() =>
    (selectedCategory.value?.symbols ?? []).map((s) => {
        const sidc = buildSidc(affiliation, category.value!, s.functionId);
        return {
            id: sidc,
            label: s.title,
            icon: '',
            description: s.title,
            image: new ms.Symbol(sidc, { size: 30 }).toDataURL(),
            sidc,
        };
    })
);

// The palette item matching the saved symbol (null if it's in a different category)
const selectedPaletteItem = computed(
    () => palette.value.find((item) => item.sidc === selectedSidc.value) ?? null
);

function selectSymbol(sidc: string) {
    selectedSidc.value = sidc;

    vwStore.updateVisualizationCustomizationOptions({
        milSymbol: sidc,
    });
}
</script>

<template>
    <div>
        <v-select
            v-model="category"
            :items="milSymbolCategories"
            item-title="title"
            item-value="value"
            :item-props="(item) => ({ prependIcon: item.icon })"
            label="Category"
            variant="outlined"
            density="comfortable"
        ></v-select>

        <v-expand-transition>
            <div v-if="selectedCategory">
                <radio-cards
                    :items="palette"
                    :selected-item="selectedPaletteItem"
                    :tooltip="false"
                    @update:value="(val) => selectSymbol(val.sidc)"
                    size="small"
                ></radio-cards>
            </div>
        </v-expand-transition>
    </div>
</template>
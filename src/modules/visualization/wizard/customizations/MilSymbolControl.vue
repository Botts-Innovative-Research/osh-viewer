<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';
import ms from 'milsymbol';
import RadioCards from '@/components/ui/RadioCards.vue';

const vwStore = useVizWizStore();

interface MilSymbolOption {
    title: string;
    functionId: string; // 6 chars, '-' padded
}

interface MilSymbolCategory {
    value: string; // Battle dimension letter in the SIDC
    title: string;
    icon: string;
    symbols: MilSymbolOption[];
}

// Categories and their symbols (symbols are shown in the Advanced section)
const milSymbolCategories: MilSymbolCategory[] = [
    {
        value: 'P',
        title: 'Space',
        icon: 'mdi-satellite-variant',
        symbols: [
            { title: 'Satellite', functionId: 'S-----' },
            { title: 'Crewed Space Vehicle', functionId: 'V-----' },
            { title: 'Space Station', functionId: 'T-----' },
            { title: 'Space Launch Vehicle', functionId: 'L-----' },
        ],
    },
    {
        value: 'A',
        title: 'Air',
        icon: 'mdi-airplane',
        symbols: [
            { title: 'Military Fixed Wing', functionId: 'MF----' },
            { title: 'Fighter', functionId: 'MFF---' },
            { title: 'Bomber', functionId: 'MFB---' },
            { title: 'Attack', functionId: 'MFA---' },
            { title: 'Cargo', functionId: 'MFC---' },
            { title: 'Tanker', functionId: 'MFK---' },
            { title: 'Reconnaissance', functionId: 'MFR---' },
            { title: 'UAV', functionId: 'MFQ---' },
            { title: 'Military Rotary Wing', functionId: 'MH----' },
            { title: 'Civilian Fixed Wing', functionId: 'CF----' },
            { title: 'Civilian Rotary Wing', functionId: 'CH----' },
            { title: 'Missile', functionId: 'WM----' },
        ],
    },
    {
        value: 'G',
        title: 'Ground',
        icon: 'mdi-tank',
        symbols: [
            { title: 'Infantry', functionId: 'UCI---' },
            { title: 'Armor', functionId: 'UCA---' },
            { title: 'Field Artillery', functionId: 'UCF---' },
            { title: 'Reconnaissance', functionId: 'UCR---' },
            { title: 'Engineer', functionId: 'UCE---' },
            { title: 'Air Defense', functionId: 'UCD---' },
            { title: 'Aviation', functionId: 'UCV---' },
            { title: 'CBRN', functionId: 'UUA---' },
            { title: 'Signal', functionId: 'UUS---' },
            { title: 'Military Intelligence', functionId: 'UUM---' },
            { title: 'Military Police', functionId: 'UUL---' },
            { title: 'Medical', functionId: 'USM---' },
            { title: 'Supply', functionId: 'USS---' },
            { title: 'Transportation', functionId: 'UST---' },
            { title: 'Maintenance', functionId: 'USX---' },
            { title: 'Tank', functionId: 'EVAT--' },
        ],
    },
    {
        value: 'S',
        title: 'Sea Surface',
        icon: 'mdi-ferry',
        symbols: [
            { title: 'Surface Combatant', functionId: 'C-----' },
            { title: 'Carrier', functionId: 'CLCV--' },
            { title: 'Battleship', functionId: 'CLBB--' },
            { title: 'Cruiser', functionId: 'CLCC--' },
            { title: 'Destroyer', functionId: 'CLDD--' },
            { title: 'Frigate', functionId: 'CLFF--' },
            { title: 'Amphibious Warfare Ship', functionId: 'CA----' },
            { title: 'Mine Warfare Vessel', functionId: 'CM----' },
            { title: 'Patrol', functionId: 'CP----' },
            { title: 'Merchant Ship', functionId: 'XM----' },
            { title: 'Fishing Vessel', functionId: 'XF----' },
        ],
    },
    {
        value: 'U',
        title: 'Sea Subsurface',
        icon: 'mdi-submarine',
        symbols: [
            { title: 'Submarine', functionId: 'S-----' },
            { title: 'Torpedo', functionId: 'WT----' },
            { title: 'Sea Mine', functionId: 'WM----' },
        ],
    },
    {
        value: 'F',
        title: 'SOF',
        icon: 'mdi-parachute',
        symbols: [
            { title: 'SOF Aviation', functionId: 'A-----' },
            { title: 'SOF Fixed Wing', functionId: 'AF----' },
            { title: 'SOF Rotary Wing', functionId: 'AH----' },
            { title: 'SOF Naval', functionId: 'N-----' },
            { title: 'SEAL', functionId: 'NS----' },
            { title: 'Underwater Demolition', functionId: 'NU----' },
            { title: 'SOF Ground', functionId: 'G-----' },
            { title: 'Special Forces', functionId: 'GS----' },
            { title: 'Ranger', functionId: 'GR----' },
            { title: 'SOF Support', functionId: 'B-----' },
        ],
    },
];

// Four basic frames shown in the main view
const basicIdentities = [
    { value: 'U', title: 'Unknown' },
    { value: 'F', title: 'Friend' },
    { value: 'N', title: 'Neutral' },
    { value: 'H', title: 'Hostile' },
];

// All standard identities, shown in the Advanced dropdown
const allIdentities = [
    { value: 'A', title: 'Assumed Friend' },
    { value: 'M', title: 'Exercise Assumed Friend' },
    { value: 'D', title: 'Exercise Friend' },
    { value: 'L', title: 'Exercise Neutral' },
    { value: 'G', title: 'Exercise Pending' },
    { value: 'W', title: 'Exercise Unknown' },
    { value: 'K', title: 'Faker' },
    { value: 'F', title: 'Friend' },
    { value: 'H', title: 'Hostile' },
    { value: 'J', title: 'Joker' },
    { value: 'N', title: 'Neutral' },
    { value: 'O', title: 'None Specified' },
    { value: 'P', title: 'Pending' },
    { value: 'S', title: 'Suspect' },
    { value: 'U', title: 'Unknown' },
];

const category = ref<string | null>(null);
const selectedSidc = ref<string | null>(null);
const showAdvanced = ref(false);
const advancedIdentity = ref('F');

// Build a full 15-character SIDC from identity, category, and function ID
function buildSidc(identity: string, dimension: string, functionId: string): string {
    return `S${identity}${dimension}P${functionId}`.padEnd(15, '-');
}

// Build a RadioCards item, using milsymbol to generate the icon image
function makeItem(sidc: string, label: string) {
    return {
        id: sidc,
        label,
        icon: '',
        description: label,
        image: new ms.Symbol(sidc, { size: 30 }).toDataURL(),
        sidc,
    };
}

const selectedCategory = computed(() =>
    milSymbolCategories.find((c) => c.value === category.value)
);

// Main view: four basic frames for the selected category
const basicPalette = computed(() =>
    category.value
        ? basicIdentities.map((i) =>
              makeItem(buildSidc(i.value, category.value!, '------'), i.title)
          )
        : []
);

// Advanced view: every symbol in the selected category, using the selected identity
const advancedPalette = computed(() =>
    (selectedCategory.value?.symbols ?? []).map((s) =>
        makeItem(buildSidc(advancedIdentity.value, category.value!, s.functionId), s.title)
    )
);

// Highlight the saved symbol in whichever palette it belongs to (null if not in that palette)
const selectedBasicItem = computed(
    () => basicPalette.value.find((item) => item.sidc === selectedSidc.value) ?? null
);
const selectedAdvancedItem = computed(
    () => advancedPalette.value.find((item) => item.sidc === selectedSidc.value) ?? null
);

function selectSymbol(sidc: string) {
    selectedSidc.value = sidc;

    vwStore.updateVisualizationCustomizationOptions({
        milSymbol: sidc,
    });
}

onMounted(() => {
    const saved = vwStore.visualizationCustomizationOptions.milSymbol;

    // Restore a previously saved symbol
    if (saved && milSymbolCategories.some((c) => c.value === saved[2])) {
        category.value = saved[2];
        selectedSidc.value = saved;

        // If the saved symbol isn't one of the four basic frames, open Advanced to show it
        const isBasic =
            saved.slice(4, 10) === '------' &&
            basicIdentities.some((i) => i.value === saved[1]);
        if (!isBasic) {
            showAdvanced.value = true;
            advancedIdentity.value = saved[1];
        }
    }
});
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
            <div class="milsymbol-palette">
                <radio-cards
                    :items="basicPalette"
                    :selected-item="selectedBasicItem"
                    :tooltip="false"
                    @update:value="(val) => selectSymbol(val.sidc)"
                    size="small"
                ></radio-cards>
            </div>

                <div class="d-flex justify-center">
                    <v-btn
                        variant="text"
                        size="small"
                        :append-icon="showAdvanced ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                        @click="showAdvanced = !showAdvanced"
                    >
                        Advanced
                    </v-btn>
                </div>

                <v-expand-transition>
                    <div v-if="showAdvanced">
                        <v-select
                            v-model="advancedIdentity"
                            :items="allIdentities"
                            item-title="title"
                            item-value="value"
                            label="Identity"
                            variant="outlined"
                            density="comfortable"
                        ></v-select>
                        <div class="milsymbol-palette">
                            <radio-cards
                                :items="advancedPalette"
                                :selected-item="selectedAdvancedItem"
                                :tooltip="true"
                                @update:value="(val) => selectSymbol(val.sidc)"
                                size="small"
                            ></radio-cards>
                        </div>
                    </div>
                </v-expand-transition>
            </div>
        </v-expand-transition>
    </div>
</template>
<style scoped>
.milsymbol-palette :deep(.v-card .flex-column) {
    width: 100%;
    padding: 0 4px;
}

.milsymbol-palette :deep(.v-card .flex-column > img) {
    height: 36px;
    flex-shrink: 0;
    margin-bottom: 4px !important;
}

.milsymbol-palette :deep(.v-card .flex-column > span) {
    font-size: 0.75rem;
    line-height: 1.2;
    word-break: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
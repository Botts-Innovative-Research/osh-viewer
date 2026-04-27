<script setup lang="ts">
import { useMapStore } from '@/stores/mapstore';
import { computed, ref } from 'vue';
import DeleteButton from '@/components/ui/DeleteButton.vue';

const mapStore = useMapStore()
const url = ref('');

const focusedMap = computed({
  get: () => mapStore.focusedMap,
  set: (val) => mapStore.setFocusedMap(val),
})

async function addIonAssetUrl() {
  if (focusedMap.value === 'cesium' && url.value) {
    try {
      await mapStore.fetchLayerFromUrl(url.value);
      url.value = ''; // Clear input on success
    } catch (error) {
      console.error('Error fetching layer from URL:', error);
    }
  }
}

const canAdd = computed(() => {
  return focusedMap.value === 'cesium' && url.value && url.value.startsWith('http');
})

</script>

<template>
  <v-card class="elevation-0">
    <v-card-item>
      <v-card-title>Map Settings</v-card-title>
      <v-card-subtitle>Configure map-related settings.</v-card-subtitle>
    </v-card-item>
    <v-card-text class="pl-0">
      <v-list>
        <v-list-item>
          <v-list-item-title>Map Type</v-list-item-title>
          <template #append>
            <v-btn-toggle v-model="focusedMap" mandatory class="ga-2">
              <v-btn value="leaflet">
                Leaflet
              </v-btn>
              <v-btn value="cesium">
                Cesium
              </v-btn>
            </v-btn-toggle>
          </template>
        </v-list-item>
        <!-- Cesium-specific Settings -->
        <v-expand-transition>
          <div v-if="focusedMap === 'cesium'">
            <v-divider class="ma-2" />
            <v-list-item>
              <v-list-item-title>Map Layers</v-list-item-title>
              <v-list-item-subtitle>
                Enter a URL to add a new map service layer
              </v-list-item-subtitle>
              <v-spacer class="ma-4" />
              <v-text-field label="Map layer URL" v-model="url"
                :rules="[v => !v || v.startsWith('http') || 'Must be a valid URL']">
                <template #append-inner>
                  <v-btn prepend-icon="mdi-plus" color="info" :disabled="!canAdd" @click="addIonAssetUrl">
                    Add
                  </v-btn>
                </template>
              </v-text-field>
              <v-expansion-panels variant="accordion" rounded="lg">
                <v-expansion-panel title="Current Layers">
                  <v-expansion-panel-text>
                    <v-list-item v-for="layer in mapStore.cesiumMapLayers" :key="layer.id">
                      <template #prepend>
                        <DeleteButton label="Remove"
                          @delete="mapStore.removeLayer(layer.id)">
                        </DeleteButton>
                      </template>
                      <v-list-item-title>{{ layer.url }}</v-list-item-title>
                    </v-list-item>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-list-item>
          </div>
        </v-expand-transition>
      </v-list>
    </v-card-text>
  </v-card>
</template>
<style scoped>
.x-scroll {
  overflow-x: auto;
}
</style>
<script setup lang="ts">
import { useUIStore } from '@/stores/uistore';
import { computed, ref } from 'vue';


const uiStore = useUIStore()
const url = ref('');

const focusedMap = computed({
  get: () => uiStore.focusedMap,
  set: (val) => uiStore.setFocusedMap(val),
})

function addIonAssetUrl() {
  if (focusedMap.value === 'cesium' && url.value) {
    uiStore.cesiumIonAssetUrl = url.value;
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
              <v-list-item-title>Add Map Layer</v-list-item-title>
              <v-list-item-subtitle>
                Enter a URL to add a new map service layer
              </v-list-item-subtitle>
              <v-spacer class="ma-4" />
              <v-text-field label="Map layer URL" v-model="url"
                :rules="[v => !v || v.startsWith('http') || 'Must be a valid URL']">
                <template #append-inner>
                  <v-btn color="info" :disabled="!canAdd" @click="addIonAssetUrl">
                    Add
                  </v-btn>
                </template>
              </v-text-field>
            </v-list-item>
          </div>
        </v-expand-transition>
      </v-list>
    </v-card-text>
  </v-card>
</template>
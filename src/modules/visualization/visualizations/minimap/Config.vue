<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, reactive, watch, onMounted, ref } from 'vue';
import DataSourcePicker from '../../wizard/components/DataSourcePicker.vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import { MiniMapConfigRoles } from '@/modules/visualization/visualizations/minimap/Descriptor';
import { VisualizationConfigRole } from '@/modules/visualization/registry/types';
import { useConfig } from '@/modules/visualization/wizard/composables/useConfig';
import RoleCheckbox from '@/modules/visualization/wizard/components/RoleCheckbox.vue';
import ControlStreamPicker from '@/modules/visualization/wizard/components/ControlStreamPicker.vue';
import {MissionConfigRoles} from "@/modules/visualization/visualizations/mission/Descriptor";

const props = withDefaults(
    defineProps<{ configRoles: VisualizationConfigRole[]; optional?: boolean }>(),
    {
      configRoles: () => MiniMapConfigRoles,
      optional: false,
    }
);

const { checkedRoles, validRoles, valid, include, autoMap } = useConfig(props.configRoles, !props.optional);

// Validation
const emit = defineEmits<VisualizationComponentEmits>();
useComponentValidation(valid, emit);
</script>
<template>
  <v-container v-if="props.optional">
    <v-switch
        v-model="include"
        label="Include in visualization?"
        color="primary"
        inset="material"
    />
  </v-container>

  <v-expand-transition>
    <div v-if="include">
      <v-container class="pb-0">
        <v-btn
            variant="tonal"
            color="primary"
            prepend-icon="mdi-auto-fix"
            @click="autoMap"
        >
          Auto Map Streams
        </v-btn>
      </v-container>
      <v-container v-for="config in props.configRoles">
        <RoleCheckbox
            v-model="checkedRoles[config.role]"
            :label="config.label"
            :tooltip="config.description"
            :disabled="config.required"
        >
          <DataSourcePicker
              v-if="checkedRoles[config.role] && config.type === 'ds'"
              :role="config.role"
              :multiple="config.multiple"
              v-model:valid="validRoles[config.role]"
              :show-property-selector="config.showPropertySelector ?? true"
          />
        </RoleCheckbox>
      </v-container>
    </div>
  </v-expand-transition>
</template>

<style scoped></style>
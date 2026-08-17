<script setup lang="ts">
import DeleteButton from '@/components/ui/DeleteButton.vue';
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settingsstore';
import { useMapStore } from '@/stores/mapstore';
const settingsStore = useSettingsStore();
const mapStore = useMapStore();
const enableOfflineMaps = computed({
	get: () => settingsStore.enableOfflineMaps ?? false,
	set: (val) => settingsStore.setEnableOfflineMaps(val),
});
</script>
<template>
	<v-card style="padding: 0px">
		<v-card-item>
			<v-card-title>Offline Map Settings</v-card-title>
			<v-card-subtitle>Configure offline maps.</v-card-subtitle>
		</v-card-item>
		<v-card-text class="pa-2 d-flex flex-column ga-2">
			<v-list>
				<v-list-item>
					<v-list-item-title>Enable Offline Maps</v-list-item-title>
					<template #append>
						<v-switch
							v-model="enableOfflineMaps"
							color="primary"
							inset="material"
							hide-details
						></v-switch>
					</template>
				</v-list-item>
				<v-list-item>
					<v-btn
						block
						variant="tonal"
						color="primary"
						prepend-icon="mdi-plus-circle"
						>Add Offline Map</v-btn
					>
					<v-btn
						block
						variant="outlined"
						color="default"
						prepend-icon="mdi-close"
						>Cancel</v-btn
					>
				</v-list-item>
				<v-list-item>
					<!--			<v-form @submit.prevent="createNode()">-->
					<!--				<v-text-field-->
					<!--					label="Node Name"-->
					<!--					v-model="nodeName"-->
					<!--					placeholder="Test"-->
					<!--					:rules="[(v) => !!v || 'Name is required']"-->
					<!--					required-->
					<!--				/>-->
					<!--				<v-text-field-->
					<!--					label="Node Host"-->
					<!--					v-model="nodeHost"-->
					<!--					placeholder="localhost"-->
					<!--					:rules="[(v) => !!v || 'Host is required']"-->
					<!--					required-->
					<!--				/>-->
					<!--				<v-number-input-->
					<!--					label="Node Port"-->
					<!--					v-model="nodePort"-->
					<!--					placeholder="8080"-->
					<!--					variant="outlined"-->
					<!--					inputmode="numeric"-->
					<!--					onkeydown="if(['e', 'E', '+', '-'].includes(event.key)) event.preventDefault();"-->
					<!--					:rules="[(v) => !!v || 'Port is required']"-->
					<!--					required-->
					<!--				/>-->
					<!--				<v-text-field-->
					<!--					label="Node Path"-->
					<!--					v-model="nodePath"-->
					<!--					placeholder="sensorhub/api"-->
					<!--					:rules="[(v) => !!v || 'Path is required']"-->
					<!--					required-->
					<!--				/>-->
					<!--				<v-text-field-->
					<!--					label="Node User"-->
					<!--					v-model="nodeUser"-->
					<!--					:rules="[(v) => !!v || 'Username is required']"-->
					<!--					required-->
					<!--				/>-->
					<!--				<v-text-field-->
					<!--					label="Node Password"-->
					<!--					v-model="nodePassword"-->
					<!--					type="password"-->
					<!--					:rules="[(v) => !!v || 'Password is required']"-->
					<!--					required-->
					<!--				/>-->
					<!--				<v-checkbox-->
					<!--					label="TLS: Secure"-->
					<!--					v-model="tls"-->
					<!--					color="primary"-->
					<!--					hide-details-->
					<!--				></v-checkbox>-->

					<!--				&lt;!&ndash; Buttons inside the form &ndash;&gt;-->
					<!--				<v-card-actions>-->
					<!--					<v-btn-->
					<!--						text-->
					<!--						@click="cancelForm"-->
					<!--						>Cancel</v-btn-->
					<!--					>-->
					<!--					<v-btn-->
					<!--						type="submit"-->
					<!--						color="primary"-->
					<!--						variant="tonal"-->
					<!--						:disabled="!isValid"-->
					<!--						>Create Node</v-btn-->
					<!--					>-->
					<!--				</v-card-actions>-->
					<!--			</v-form>-->
				</v-list-item>
				<v-divider></v-divider>
				<v-list-item>
					<!--					<v-expansion-panels-->
					<!--						variant="accordion"-->
					<!--						rounded="lg"-->
					<!--						flat-->
					<!--					>-->
					<!--						<v-expansion-panel>-->
					<!--							<v-expansion-panel-title>-->
					<!--								Current Offline Map Layers-->
					<!--								<v-fade-transition>-->
					<!--									<v-badge-->
					<!--										v-if="mapStore.cesiumMapLayers.length"-->
					<!--										inline-->
					<!--										location="top right"-->
					<!--										:content="mapStore.cesiumMapLayers.length"-->
					<!--										class="pl-2"-->
					<!--									/>-->
					<!--								</v-fade-transition>-->
					<!--							</v-expansion-panel-title>-->
					<!--							<v-expansion-panel-text-->
					<!--								v-if="mapStore.cesiumMapLayers.length"-->
					<!--								class="layer-list"-->
					<!--							>-->
					<!--								<v-list-->
					<!--									activatable-->
					<!--									bg-color="transparent"-->
					<!--								>-->
					<!--									<v-list-item-->
					<!--										v-for="layer in mapStore.cesiumMapLayers"-->
					<!--										:key="layer.id"-->
					<!--										class="ga-2 px-2"-->
					<!--									>-->
					<!--										<template #prepend>-->
					<!--											<DeleteButton-->
					<!--												label="Remove"-->
					<!--												@delete="mapStore.removeLayer(layer.id)"-->
					<!--											>-->
					<!--											</DeleteButton>-->
					<!--										</template>-->
					<!--										<v-list-item-title>{{ layer.url }}</v-list-item-title>-->
					<!--									</v-list-item>-->
					<!--								</v-list>-->
					<!--							</v-expansion-panel-text>-->
					<!--							<v-expansion-panel-text v-else>-->
					<!--								No layers added yet.-->
					<!--							</v-expansion-panel-text>-->
					<!--						</v-expansion-panel>-->
					<!--					</v-expansion-panels>-->
				</v-list-item>
			</v-list>
		</v-card-text>
	</v-card>
</template>
<style scoped>
:deep(.layer-list .v-expansion-panel-text__wrapper) {
	padding: 8px;
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useOSHConnectStore } from '@/stores/oshconnectstore.js';
import { useUIStore } from '@/stores/uistore';
import { OSHNode } from '@/lib/OSHConnectDataStructs';
import { showToast } from '@/composables/useToast';

const oshconnect = useOSHConnectStore().getInstance();
const uiStore = useUIStore();

// Form fields
const nodeName = ref('Test');
const nodeHost = ref(window.location.hostname);
const nodePort = ref('8080');
const nodePath = ref('sensorhub/api');
const nodeUser = ref('admin');
const nodePassword = ref('admin');
const tls = ref(false);

const isValid = computed(() => {
	if (
		nodeName.value &&
		nodeHost.value &&
		nodePort.value &&
		nodePath.value &&
		nodeUser.value &&
		nodePassword.value
	)
		return true;
	else return false;
});

async function createNode() {
	// This function will be called when the button is clicked
	const result = await oshconnect.createNode(
		nodeName.value,
		nodeHost.value,
		nodePort.value,
		nodePath.value,
		nodeUser.value,
		nodePassword.value,
		tls.value
	);

	if (result instanceof OSHNode) {
		oshconnect.fetchSlowResources();
		cancelForm();
	} else {
		showToast(result.message ?? 'Failed to create node', 'ERROR');
	}
}

const cancelForm = () => {
	uiStore.nodeConfigFormOpen = false;
};

function sanitizeAPIRoot(path) {
	if (path.startsWith('/')) {
		path = path.slice(1);
	}
	if (path.endsWith('/')) {
		path = path.slice(0, -1);
	}
	return path;
}
</script>

<template>
	<v-card class="pa-2">
		<v-card-title>Add a New Node</v-card-title>

		<v-card-text>
			<v-form @submit.prevent="createNode()">
				<v-text-field
					label="Node Name"
					v-model="nodeName"
					placeholder="Test"
					class="mb-2"
					:rules="[(v) => !!v || 'Name is required']"
					required
				/>
				<v-text-field
					label="Node Host"
					v-model="nodeHost"
					placeholder="localhost"
					:rules="[(v) => !!v || 'Host is required']"
					required
				/>
				<v-text-field
					label="Node Port"
					v-model="nodePort"
					placeholder="8181"
					type="number"
					inputmode="numeric"
					onkeydown="if(['e', 'E', '+', '-'].includes(event.key)) event.preventDefault();"
					class="mb-2"
					:rules="[(v) => !!v || 'Port is required']"
					required
				/>
				<v-text-field
					label="Node Path"
					v-model="nodePath"
					placeholder="sensorhub/api"
					class="mb-2"
					:rules="[(v) => !!v || 'Path is required']"
					required
				/>
				<v-text-field
					label="Node User"
					v-model="nodeUser"
					class="mb-2"
					:rules="[(v) => !!v || 'Username is required']"
					required
				/>
				<v-text-field
					label="Node Password"
					v-model="nodePassword"
					type="password"
					class="mb-2"
					:rules="[(v) => !!v || 'Password is required']"
					required
				/>
				<v-checkbox
					label="TLS: Secure"
					v-model="tls"
				></v-checkbox>

				<!-- Buttons inside the form -->
				<v-card-actions>
					<v-btn
						type="submit"
						color="success"
						variant="tonal"
						:disabled="!isValid"
						>Create Node</v-btn
					>
					<v-btn
						text
						@click="cancelForm"
						>Cancel</v-btn
					>
				</v-card-actions>
			</v-form>
		</v-card-text>
	</v-card>
</template>

<style scoped></style>

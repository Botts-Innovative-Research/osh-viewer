import { h, ref } from 'vue';
import ControlFilter from 'osh-js/source/core/sweapi/control/ControlFilter';
import Control from 'osh-js/source/core/sweapi/control/Control';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { showToast } from '@/composables/useToast';
import {useToast} from "vue-toastification";

type CommandType = {
	type: string;
	details: { [key: string]: any };
};

/**
 * Generic function to send a command through a controlstream
 *
 * @param commandBaseUrl
 * @param controlStreamId
 * @param command
 * @param auth
 */
export function sendCommand(commandBaseUrl: string, controlStreamId: string, command: any, auth: string) {
	console.log(`Sending command to ${commandBaseUrl}/controlstreams/${controlStreamId}/commands `, command);

    let encoded = btoa(auth)

	// Command sending logic
	fetch(`${commandBaseUrl}/controlstreams/${controlStreamId}/commands`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
            ...(auth && {'Authorization': `Basic ${encoded}`})
		},
        mode: 'cors',
		body: JSON.stringify(command),
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error('API call failed: ' + response.statusText);
			}
			return response.json();
		})
		.then((data) => {
			console.log('Command successful: ', data);
			showToast(`Command successful: ${data}`, 'SUCCESS');
		})
		.catch((error) => {
			console.error('Error sending command: ', error);
			showToast('Error sending command.', 'ERROR');
		});
}

/**
 * Fetch the schema for a control stream
 *
 * @param controlstream
 * @param networkProperties
 * @returns
 */
export async function fetchControlStreamSchema(controlstream: any, networkProperties: any) {
    const props = {
		id: controlstream.id,
		'system@id': controlstream.parentId == null ? controlstream['system@id'] : controlstream.parentId,
		name: controlstream.name,
		type: controlstream.type,
	};

	const control = new Control(props, networkProperties);

	console.log('[ControlstreamUtils] Fetching schema for controlstream:', control);

	let filter = new ControlFilter();
	return control
		.getSchema(filter)
		.then((schema: any) => {
			if (schema) {
				console.log('[ControlstreamUtils] Schema fetched:', schema);
				// Add to store and fetch beautified command schema
				const schemaItems = schema.parametersSchema.items
					? schema.parametersSchema.items
					: schema.parametersSchema;
				const prettySchema = getCommandType(schemaItems, controlstream.id);
				return prettySchema;
			}
		})
		.catch((error: any) => {
			console.error('[ControlstreamUtils] Error fetching schema:', error);
			return null;
		});
}

/**
 * Get command type and simplified schema, add to control stream store
 *
 * @param schema
 * @param id
 * @returns
 */
export function getCommandType(schema: any, id: string) {
	const controlStreamStore = useControlStreamStore();

	// Start with empty command schema
	let commandType: CommandType | undefined;
	let commandSchema: any = {};

	// Check for PTZ camera command schema
	if (
		Array.isArray(schema) &&
		schema.some((item: any) => item.name === 'pan' || item.name === 'rpan')
	) {
		const type = 'PTZCam';
		let isRelative = false;
		let isPreset = false;
		let isDataRecord = false;

		// Check for relative commands
		if (schema.some((item: any) => item.name === 'rpan')) isRelative = true;
		// Check for preset commands
		if (schema.some((item: any) => item.name === 'preset')) isPreset = true;
		// Check for DataRecord commands
		if (schema.some((item: any) => item.type === 'DataRecord')) isDataRecord = true;

		commandType = {
			type: type,
			details: {
				hasRelative: isRelative,
				hasPreset: isPreset,
				hasDataRecord: isDataRecord,
			},
		};

		if (schema.some((item: any) => item.name === 'pan')) {
			// Add absolute PTZ command schema
			commandSchema.pan = {
				type: 'number',
				constraint: schema.find((item: any) => item.name === 'pan').constraint.intervals[0],
			};
			commandSchema.tilt = {
				type: 'number',
				constraint: schema.find((item: any) => item.name === 'tilt').constraint.intervals[0],
			};
			commandSchema.zoom = {
				type: 'number',
				constraint: schema.find((item: any) => item.name === 'zoom').constraint.intervals[0],
			};
		}
		if (schema.some((item: any) => item.name === 'rpan')) {
			// Add relative PTZ command schema
			commandSchema.rpan = {
				type: 'number',
			};
			commandSchema.rtilt = {
				type: 'number',
			};
			commandSchema.rzoom = {
				type: 'number',
			};
		}
		if (schema.some((item: any) => item.name === 'preset')) {
			// Add Preset PTZ command schema
			const presetItem = schema.find((item: any) => item.name === 'preset');
			// Add all possible preset values as an array
			commandSchema.preset = { type: presetItem.type, values: presetItem.constraint.values };
		}
		if (schema.some((item: any) => item.type === 'DataRecord')) {
			// Add DataRecord PTZ command schema
			const dataRecItem = schema.find((item: any) => item.type === 'DataRecord');
			commandSchema[dataRecItem.name] = {
				type: dataRecItem.type,
				pan: { type: 'number', constraint: commandSchema.pan.constraint },
				tilt: { type: 'number', constraint: commandSchema.tilt.constraint },
				zoom: { type: 'number', constraint: commandSchema.zoom.constraint },
			};
		}
	}
	// Check for LLA command schema
	else if (schema.label === 'LLA') {
		commandType = { type: 'LLA', details: {} };
		commandSchema.lat = { type: 'number' };
		commandSchema.lon = { type: 'number' };
		commandSchema.alt = { type: 'number' };
	}

	// Add to store
	controlStreamStore.addCSSchema(id, commandType, commandSchema);

	console.log(commandSchema);

	return commandSchema;
}

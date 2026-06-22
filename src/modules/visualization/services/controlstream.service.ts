import { showToast } from '@/composables/useToast';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import ControlStreamFilter from 'osh-js/source/core/consysapi/controlstream/ControlStreamFilter';
import ControlStream from 'osh-js/source/core/consysapi/controlstream/ControlStream';

type CommandType = {
	type: string;
	details: { [key: string]: any };
};

export function mineControlObsPropsFromCS(csID: string): { cs: any; controlledProperties: any } {
	const controlStreamStore = useControlStreamStore();
	const cs = controlStreamStore.getControlStreamsById([csID])[0];

	if (!cs) {
		console.warn('No controlstream given');
	}

	const controlledProperties = cs.controlstream.properties.controlledProperties || [];

	return { cs, controlledProperties };
}

export async function fetchCsSchema(controlstream: any): Promise<any> {
	let checkedFormat = controlstream.properties.formats.filter(
		(format: any) =>
			format.includes('application/swe+json') || format.includes('application/swe+binary')
	);

	if (!checkedFormat) {
		checkedFormat = ['application/om+json']; // Fallback to om+json which should be available always
	}

	let filter = new ControlStreamFilter({ format: 'application/json' });
	return controlstream
		.getSchema(filter)
		.then((schemaRes: any) => {
			if (schemaRes) {
				return schemaRes;
			}
		})
		.catch((error: any) => {
			console.error('[fetchCsSchema] Error fetching schema:', error);
			return null;
		});
}

/**
 * Generic function to send a command through a controlstream
 *
 * @param commandBaseUrl
 * @param controlStreamId
 * @param command
 * @param auth
 */
export function sendCommand(
	commandBaseUrl: string,
	controlStreamId: string,
	command: any,
	auth: string
) {
	console.log(
		`Sending command to ${commandBaseUrl}/controlstreams/${controlStreamId}/commands `,
		command
	);

	let encoded = btoa(auth);

	// Command sending logic
	fetch(`${commandBaseUrl}/controlstreams/${controlStreamId}/commands`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(auth && { Authorization: `Basic ${encoded}` }),
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
			showToast(`Command successful!`, 'SUCCESS');
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
		'system@id':
			controlstream.parentId == null ? controlstream['system@id'] : controlstream.parentId,
		name: controlstream.name,
		type: controlstream.type,
	};

	const control = new ControlStream(props, networkProperties);

	let filter = new ControlStreamFilter();
	return control
		.getSchema(filter)
		.then((schema: any) => {
			if (schema) {
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
				constraint: schema.find((item: any) => item.name === 'tilt').constraint
					.intervals[0],
			};
			commandSchema.zoom = {
				type: 'number',
				constraint: schema.find((item: any) => item.name === 'zoom').constraint
					.intervals[0],
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

	return commandSchema;
}

import { describe, expect, it } from 'vitest';
import { getPropertyTitle, mapPropertySelection } from './propertySelection';

// REQ-VPM-001; SCENARIO-VPM-CONFIG-001.
describe('mapPropertySelection', () => {
	it('preserves the order selected by the user', () => {
		const fields = [
			{ name: 'label', label: 'Label' },
			{ name: 'altitude', label: 'Altitude', uom: { code: 'm' } },
		];

		expect(mapPropertySelection(fields, ['altitude', 'label'])).toEqual({
			property: ['altitude', 'label'],
			label: ['Altitude', 'Label'],
			uom: ['m', ''],
		});
	});

	it('disambiguates duplicate display labels by property name', () => {
		const fields = [
			{ name: 'reportedStatus', label: 'Status' },
			{ name: 'derivedStatus', label: 'Status' },
		];

		expect(getPropertyTitle(fields[0], fields)).toBe('Status (reportedStatus)');
		expect(getPropertyTitle(fields[1], fields)).toBe('Status (derivedStatus)');
		expect(mapPropertySelection(fields, ['derivedStatus'])).toEqual({
			property: ['derivedStatus'],
			label: ['Status'],
			uom: [''],
		});
	});
});

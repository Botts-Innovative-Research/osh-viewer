import { describe, expect, it } from 'vitest';
import { BuildRoleProperty } from './aggregation.service';

// REQ-VPM-001; SCENARIO-VPM-CONFIG-001.
describe('BuildRoleProperty', () => {
	it('SCENARIO-VPM-CONFIG-001 preserves selected property labels and units', () => {
		const result = BuildRoleProperty([
			{
				pmDetails: {
					property: ['label', 'altitude'],
					label: ['Label', 'Altitude'],
					uom: ['', 'm'],
					outputName: 'bms-unit-pli',
				},
			},
		]);

		expect(result).toEqual({
			pmDetails: {
				property: ['label', 'altitude'],
				label: ['Label', 'Altitude'],
				uom: ['', 'm'],
				outputName: 'bms-unit-pli',
			},
		});
	});

	it('keeps existing compression metadata while adding display metadata', () => {
		const result = BuildRoleProperty([
			{
				video: {
					property: 'frame',
					label: 'Frame',
					uom: '',
					outputName: 'video',
					compression: 'h264',
				},
			},
		]);

		expect(result.video).toEqual({
			property: 'frame',
			label: 'Frame',
			uom: '',
			outputName: 'video',
			compression: 'h264',
		});
	});
});

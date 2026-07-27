import { describe, expect, it } from 'vitest';
import {
	getPointMarkerIdentityDatastreamId,
	validatePointMarkerDetailsDatastream,
} from './pointMarkerConfig';

// REQ-VPM-001/003; SCENARIO-VPM-CONFIG-001 and SCENARIO-VPM-DETAIL-001.
describe('point marker detail datastream', () => {
	it('uses Marker ID as the identity stream when configured', () => {
		expect(
			getPointMarkerIdentityDatastreamId({
				location: { selected: true, dsId: 'location-ds' },
				markerId: { selected: true, dsId: 'identity-ds' },
			})
		).toBe('identity-ds');
	});

	it('falls back to the Location stream for single-marker layers', () => {
		expect(
			getPointMarkerIdentityDatastreamId({
				location: { selected: true, dsId: 'location-ds' },
			})
		).toBe('location-ds');
	});

	it('rejects a detail stream that cannot be joined to marker identity', () => {
		expect(() =>
			validatePointMarkerDetailsDatastream({
				location: { selected: true, dsId: 'location-ds' },
				markerId: { selected: true, dsId: 'identity-ds' },
				pmDetails: { selected: true, dsId: 'unrelated-ds' },
			})
		).toThrow(/same datastream as Marker ID/);
	});
});

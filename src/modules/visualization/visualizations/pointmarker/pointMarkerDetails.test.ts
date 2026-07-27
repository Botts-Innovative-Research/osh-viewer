import { describe, expect, it } from 'vitest';
import { buildPointMarkerDescription } from './pointMarkerDetails';

// REQ-VPM-002/003; SCENARIO-VPM-DETAIL-001 and SCENARIO-VPM-SAFETY-001.
describe('buildPointMarkerDescription', () => {
	it('SCENARIO-VPM-DETAIL-001 renders selected values, labels, units, and nested data in order', () => {
		const html = buildPointMarkerDescription(
			{
				label: 'Sandhills Hive 1',
				altitude: 42.5,
				telemetryIsStale: false,
				location: { lat: 35.1198, lon: -78.9806 },
			},
			{
				property: ['label', 'altitude', 'telemetryIsStale', 'location'],
				label: ['Label', 'Altitude', 'Telemetry Is Stale', 'Location'],
				uom: ['', 'm', '', ''],
			}
		);

		expect(html).toBe(
			'<table class="osh-point-marker-details"><tbody>' +
				'<tr><th scope="row">Label</th><td>Sandhills Hive 1</td></tr>' +
				'<tr><th scope="row">Altitude</th><td>42.5 m</td></tr>' +
				'<tr><th scope="row">Telemetry Is Stale</th><td>false</td></tr>' +
				'<tr><th scope="row">Location</th><td>lat: 35.1198, lon: -78.9806</td></tr>' +
				'</tbody></table>'
		);
	});

	it('SCENARIO-VPM-DETAIL-001 renders missing, empty, and non-finite values as an em dash', () => {
		const html = buildPointMarkerDescription(
			{ missing: null, empty: '', nan: Number.NaN, infinite: Number.POSITIVE_INFINITY },
			{
				property: ['missing', 'empty', 'nan', 'infinite'],
				label: ['Missing', 'Empty', 'NaN', 'Infinite'],
				uom: ['m', 'm', 'm', 'm'],
			}
		);

		expect(html.match(/<td>—<\/td>/g)).toHaveLength(4);
		expect(html).not.toContain('— m');
	});

	it('SCENARIO-VPM-SAFETY-001 escapes labels, values, object keys, and units', () => {
		const html = buildPointMarkerDescription(
			{ unsafe: { '<img onerror=alert(1)>': '<script>alert(1)</script>' } },
			{
				property: 'unsafe',
				label: '<b>Unsafe</b>',
				uom: 'm<script>',
			}
		);

		expect(html).not.toContain('<script>');
		expect(html).not.toContain('<img');
		expect(html).not.toContain('<b>');
		expect(html).toContain('&lt;b&gt;Unsafe&lt;/b&gt;');
		expect(html).toContain('&lt;img onerror=alert(1)&gt;');
		expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
		expect(html).toContain('m&lt;script&gt;');
	});

	it('returns an empty description when no properties are selected', () => {
		expect(buildPointMarkerDescription({ label: 'ignored' }, { property: [] })).toBe('');
	});
});

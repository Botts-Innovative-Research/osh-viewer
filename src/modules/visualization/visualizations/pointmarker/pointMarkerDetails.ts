export interface PointMarkerDetailSelection {
	property: string | string[];
	label?: string | string[];
	uom?: string | string[];
}

const MISSING_VALUE = '—';

function toArray<T>(value: T | T[] | undefined): T[] {
	if (value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function formatValue(value: unknown): string {
	if (value === undefined || value === null || value === '') return MISSING_VALUE;
	if (typeof value === 'number' && !Number.isFinite(value)) return MISSING_VALUE;
	if (Array.isArray(value)) {
		if (value.length === 0) return MISSING_VALUE;
		return value.map(formatValue).join(', ');
	}
	if (typeof value === 'object') {
		const entries = Object.entries(value);
		if (entries.length === 0) return MISSING_VALUE;
		return entries.map(([key, entryValue]) => `${key}: ${formatValue(entryValue)}`).join(', ');
	}
	return String(value);
}

/**
 * Builds the HTML consumed by osh-js PointMarkerLayer.getDescription.
 * REQ-VPM-002 / SCENARIO-VPM-SAFETY-001: every schema- or record-controlled value is escaped.
 */
export function buildPointMarkerDescription(
	record: Record<string, unknown>,
	selection: PointMarkerDetailSelection
): string {
	const properties = toArray(selection.property);
	if (properties.length === 0) return '';

	const labels = toArray(selection.label);
	const units = toArray(selection.uom);
	const rows = properties.map((property, index) => {
		const label = labels[index] || property;
		const formattedValue = formatValue(record[property]);
		const unit = formattedValue !== MISSING_VALUE ? units[index] || '' : '';
		const valueWithUnit = unit ? `${formattedValue} ${unit}` : formattedValue;

		return `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(valueWithUnit)}</td></tr>`;
	});

	return `<table class="osh-point-marker-details"><tbody>${rows.join('')}</tbody></table>`;
}

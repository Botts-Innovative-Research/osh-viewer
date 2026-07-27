export interface SelectableProperty {
	name: string;
	label?: string;
	uom?: { code?: string };
}

export interface PropertySelection {
	property: string | string[];
	label: string | string[];
	uom: string | string[];
}

const displayName = (field: SelectableProperty): string => field.label ?? field.name;

export function getPropertyTitle(field: SelectableProperty, fields: SelectableProperty[]): string {
	const label = displayName(field);
	const duplicateLabel = fields.some(
		(candidate) => candidate.name !== field.name && displayName(candidate) === label
	);
	return duplicateLabel ? `${label} (${field.name})` : label;
}

export function mapPropertySelection(
	fields: SelectableProperty[],
	value: string | string[]
): PropertySelection | null {
	const fieldsByName = new Map(fields.map((field) => [field.name, field]));

	if (Array.isArray(value)) {
		const selected = value
			.map((name) => fieldsByName.get(name))
			.filter((field): field is SelectableProperty => field !== undefined);

		return {
			property: selected.map((field) => field.name),
			label: selected.map(displayName),
			uom: selected.map((field) => field.uom?.code ?? ''),
		};
	}

	const field = fieldsByName.get(value);
	if (!field) return null;

	return {
		property: field.name,
		label: displayName(field),
		uom: field.uom?.code ?? '',
	};
}

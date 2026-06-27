import ms from 'milsymbol';

export function getMilSymbol(id: string) {
	return new ms.Symbol(id, {}).toDataURL();
}

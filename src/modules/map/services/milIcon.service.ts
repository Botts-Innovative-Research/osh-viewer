import { getLatestObservation } from '@/modules/visualization/services/datasource.service';
import ms from 'milsymbol';
import { IConSysApiDataSourceProperties } from '@/modules/visualization/types/datasource';

/**
 * Based on a property ID, return GUCI milsymbol
 * @param id
 * @returns
 */
export function getMilSymbol(id: string) {
	return new ms.Symbol(id, {}).toDataURL();
}

import { createContext, useContext } from 'react';

export type UnitSystem = 'metric' | 'us';

const UnitSystemContext = createContext<UnitSystem>('metric');

export const UnitSystemProvider = UnitSystemContext.Provider;

export function useUnitSystem(): UnitSystem {
	return useContext(UnitSystemContext);
}

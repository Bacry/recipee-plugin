import { createContext, useContext } from 'react';
import { Language, t as translate } from './strings';

export const LanguageContext = createContext<Language>('fr');

export const LanguageProvider = LanguageContext.Provider;

// Convenience hook — components call useT() to get a t() function already
// bound to the current language, instead of importing t() and useContext()
// separately everywhere.
export function useT() {
	const language = useContext(LanguageContext);
	return (key: string) => translate(key, language);
}

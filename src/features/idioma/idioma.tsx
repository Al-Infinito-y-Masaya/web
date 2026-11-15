import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode
} from 'react';

import { appConfig } from '@/config/app';

import { en } from './en';
import { es, type Textos } from './es';
import { crearFormato, type Formato } from './formato';

export type Idioma = 'es' | 'en';

const TEXTOS: Record<Idioma, Textos> = { es, en };

type Valor = {
	idioma: Idioma;
	setIdioma: (idioma: Idioma) => void;
	/** Every user-facing string. The API returns codes; the words live here (RNF-14). */
	t: Textos;
	fmt: Formato;
};

const Contexto = createContext<Valor | null>(null);

function idiomaInicial(): Idioma {
	try {
		const guardado = localStorage.getItem(appConfig.storageKeys.language);
		if (guardado === 'es' || guardado === 'en') return guardado;
	} catch {
		/* Storage blocked: fall through to the browser language. */
	}
	return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')
		? 'en'
		: 'es';
}

export function IdiomaProvider({ children, inicial }: { children: ReactNode; inicial?: Idioma }) {
	const [idioma, setEstado] = useState<Idioma>(() => inicial ?? idiomaInicial());

	const setIdioma = useCallback((nuevo: Idioma) => {
		setEstado(nuevo);
		try {
			localStorage.setItem(appConfig.storageKeys.language, nuevo);
		} catch {
			/* Preference not persisted; the choice still applies to this visit. */
		}
	}, []);

	useEffect(() => {
		document.documentElement.lang = idioma;
	}, [idioma]);

	const valor = useMemo<Valor>(
		() => ({ idioma, setIdioma, t: TEXTOS[idioma], fmt: crearFormato(idioma) }),
		[idioma, setIdioma]
	);

	return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useIdioma() {
	const valor = useContext(Contexto);
	if (!valor) throw new Error('useIdioma debe usarse dentro de <IdiomaProvider>.');
	return valor;
}

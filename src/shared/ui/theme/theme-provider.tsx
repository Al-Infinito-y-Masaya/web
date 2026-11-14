import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { appConfig } from '@/config/app';

export type Theme = 'dark' | 'light' | 'system';

type ThemeProviderState = {
	theme: Theme;
	/** The theme actually applied (`system` resolved). */
	resolvedTheme: 'dark' | 'light';
	setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function readStoredTheme(key: string, fallback: Theme): Theme {
	try {
		const stored = localStorage.getItem(key);
		return stored === 'dark' || stored === 'light' || stored === 'system' ? stored : fallback;
	} catch {
		return fallback;
	}
}

/**
 * Light / dark / system theme. Toggles the `dark` class on `<html>` (Tailwind's
 * `dark:` variant reads it) and persists the choice. The inline script in
 * index.html applies it before React loads, avoiding a flash.
 */
export function ThemeProvider({
	children,
	defaultTheme = 'system',
	storageKey = appConfig.storageKeys.theme
}: {
	children: ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
}) {
	const [theme, setThemeState] = useState<Theme>(() => readStoredTheme(storageKey, defaultTheme));
	const [systemDark, setSystemDark] = useState(() => media().matches);

	useEffect(() => {
		const mql = media();
		const onChange = () => setSystemDark(mql.matches);
		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	}, []);

	const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

	useEffect(() => {
		const root = document.documentElement;
		root.classList.remove('light', 'dark');
		root.classList.add(resolvedTheme);
	}, [resolvedTheme]);

	const setTheme = (next: Theme) => {
		try {
			localStorage.setItem(storageKey, next);
		} catch {
			/* Not persisted. */
		}
		setThemeState(next);
	};

	return (
		<ThemeProviderContext.Provider value={{ theme, resolvedTheme, setTheme }}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeProviderContext);
	if (!context) throw new Error('useTheme must be used within a ThemeProvider');
	return context;
}

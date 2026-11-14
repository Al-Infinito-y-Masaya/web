import { useSyncExternalStore } from 'react';

/** Whether the media query matches; updates on resize. `useMediaQuery('(min-width: 768px)')`. */
export function useMediaQuery(query: string) {
	return useSyncExternalStore(
		onChange => {
			const mql = window.matchMedia(query);
			mql.addEventListener('change', onChange);
			return () => mql.removeEventListener('change', onChange);
		},
		() => window.matchMedia(query).matches,
		() => false
	);
}

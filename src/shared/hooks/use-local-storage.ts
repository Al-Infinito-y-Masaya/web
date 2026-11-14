import { useCallback, useState } from 'react';

/**
 * `useState` persisted to localStorage (JSON). Falls back to in-memory state
 * when storage is unavailable (private mode, blocked cookies).
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
	const [value, setValue] = useState<T>(() => {
		try {
			const stored = localStorage.getItem(key);
			return stored != null ? (JSON.parse(stored) as T) : initialValue;
		} catch {
			return initialValue;
		}
	});

	const set = useCallback(
		(next: T | ((prev: T) => T)) => {
			setValue(prev => {
				const resolved = next instanceof Function ? next(prev) : next;
				try {
					localStorage.setItem(key, JSON.stringify(resolved));
				} catch {
					/* Not persisted: lives as long as the tab. */
				}
				return resolved;
			});
		},
		[key]
	);

	return [value, set] as const;
}

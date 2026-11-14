import { useEffect } from 'react';

/** Asks the browser to confirm before closing or reloading the tab while `dirty`. */
export function useBeforeUnload(dirty: boolean) {
	useEffect(() => {
		if (!dirty) return;
		const warn = (e: BeforeUnloadEvent) => e.preventDefault();
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, [dirty]);
}

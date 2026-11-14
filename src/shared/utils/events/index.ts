/**
 * Tiny app-wide event bus over `window` CustomEvents, for signals that cross
 * unrelated parts of the tree (e.g. the API client telling the UI that the
 * session expired). Add your event names here.
 */
export const events = {
	sessionExpired: 'app:session-expired'
} as const;

export type AppEvent = (typeof events)[keyof typeof events];

export const eventBus = {
	dispatch(event: AppEvent, detail?: unknown) {
		window.dispatchEvent(new CustomEvent(event, { detail }));
	},
	/** Subscribes and returns the unsubscribe function (fits `useEffect`). */
	listen(event: AppEvent, callback: (e: CustomEvent) => void) {
		const handler = (e: Event) => callback(e as CustomEvent);
		window.addEventListener(event, handler);
		return () => window.removeEventListener(event, handler);
	}
};

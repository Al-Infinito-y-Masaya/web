/**
 * Keep the visible date until its replacement is complete, warm up the neighbouring
 * dates and retain a few recent sources.
 *
 * A source is in one of three states: hidden (`visibility: none`, no tile requests),
 * warm (visible at opacity 0, so the map fetches its tiles) or shown (opacity 1).
 * The layer fades between opacities, so swapping dates cross-fades.
 */
export interface RasterPort {
	add(id: string, url: string): void;
	show(id: string, visible: boolean, opacity: number): void;
	remove(id: string): void;
	loaded(id: string): boolean;
}
export type RasterStatus = {
	key: string;
	displayed: string | null;
	loading: boolean;
	error: boolean;
};
export const RASTER_CAPACITY = 5;
export class RasterCache {
	private entries = new Map<string, string>();
	private counter = 0;
	private wanted: string | null = null;
	private displayed: string | null = null;
	private pending = false;
	private warm = new Set<string>();
	constructor(
		private port: RasterPort,
		private notify: (status: RasterStatus) => void,
		private capacity = RASTER_CAPACITY
	) {}
	select(key: string, url: string) {
		// Abort a superseded request unless it is being warmed up as a neighbour; it must
		// never replace the user's latest selection.
		if (
			this.wanted &&
			this.wanted !== this.displayed &&
			this.wanted !== key &&
			!this.warm.has(this.wanted)
		)
			this.drop(this.wanted);
		else if (this.wanted && this.wanted !== this.displayed && this.wanted !== key)
			this.port.show(this.entries.get(this.wanted)!, true, 0);
		this.wanted = key;
		this.pending = true;
		const id = this.ensure(key, url);
		this.port.show(id, true, key === this.displayed ? 1 : 0);
		this.notify({ key, displayed: this.displayed, loading: true, error: false });
		this.check(id);
	}
	/** Fetch these dates in the background without showing them. */
	prefetch(items: ReadonlyArray<readonly [key: string, url: string]>) {
		this.warm = new Set(items.map(([key]) => key));
		for (const [key, url] of items) {
			if (key === this.wanted || key === this.displayed) continue;
			const known = this.entries.has(key);
			const id = this.ensure(key, url, false);
			if (!known || key !== this.displayed) this.port.show(id, true, 0);
		}
		for (const [key, id] of this.entries)
			if (!this.warm.has(key) && key !== this.wanted && key !== this.displayed)
				this.port.show(id, false, 0);
		this.evict();
	}
	check(id: string) {
		const key = this.wanted;
		if (!this.pending || !key || this.entries.get(key) !== id || !this.port.loaded(id)) return;
		this.pending = false;
		const previous = this.displayed;
		this.displayed = key;
		for (const [other, source] of this.entries) {
			if (other === key) this.port.show(source, true, 1);
			// The previous date fades out instead of disappearing at once.
			else if (other === previous || this.warm.has(other)) this.port.show(source, true, 0);
			else this.port.show(source, false, 0);
		}
		this.evict();
		this.notify({ key, displayed: key, loading: false, error: false });
	}
	fail(id: string) {
		if (this.wanted && this.entries.get(this.wanted) === id) {
			this.pending = false;
			this.notify({
				key: this.wanted,
				displayed: this.displayed,
				loading: false,
				error: true
			});
			return;
		}
		// A failed neighbour is dropped quietly; selecting it later retries the request.
		for (const [key, source] of this.entries)
			if (source === id && key !== this.displayed) {
				this.warm.delete(key);
				this.drop(key);
			}
	}
	retry(key: string, url: string) {
		this.drop(key);
		if (this.displayed === key) this.displayed = null;
		this.select(key, url);
	}
	deactivate() {
		if (this.wanted && this.wanted !== this.displayed) this.drop(this.wanted);
		this.wanted = null;
		this.pending = false;
		this.displayed = null;
		this.warm.clear();
		for (const id of this.entries.values()) this.port.show(id, false, 0);
	}
	private ensure(key: string, url: string, touch = true) {
		let id = this.entries.get(key);
		if (!id) {
			id = `acquisition-${++this.counter}`;
			this.entries.set(key, id);
			this.port.add(id, url);
		} else if (touch) {
			this.entries.delete(key);
			this.entries.set(key, id);
		}
		return id;
	}
	private evict() {
		while (this.entries.size > this.capacity) {
			const oldest = [...this.entries.keys()].find(
				k => k !== this.wanted && k !== this.displayed && !this.warm.has(k)
			);
			if (!oldest) return;
			this.drop(oldest);
		}
	}
	private drop(key: string) {
		const id = this.entries.get(key);
		if (id) this.port.remove(id);
		this.entries.delete(key);
	}
}

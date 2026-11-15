/** Keep the visible date until its replacement is complete; retain three recent sources. */
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
export class RasterCache {
	private entries = new Map<string, string>();
	private counter = 0;
	private wanted: string | null = null;
	private displayed: string | null = null;
	private pending = false;
	constructor(
		private port: RasterPort,
		private notify: (status: RasterStatus) => void
	) {}
	select(key: string, url: string) {
		// Abort a superseded request; it must never replace the user's latest selection.
		if (this.wanted && this.wanted !== this.displayed && this.wanted !== key)
			this.drop(this.wanted);
		this.wanted = key;
		this.pending = true;
		let id = this.entries.get(key);
		if (!id) {
			id = `acquisition-${++this.counter}`;
			this.entries.set(key, id);
			this.port.add(id, url);
		} else {
			this.entries.delete(key);
			this.entries.set(key, id);
		}
		this.port.show(id, true, key === this.displayed ? 1 : 0);
		this.notify({ key, displayed: this.displayed, loading: true, error: false });
		this.check(id);
	}
	check(id: string) {
		const key = this.wanted;
		if (!this.pending || !key || this.entries.get(key) !== id || !this.port.loaded(id)) return;
		this.pending = false;
		this.displayed = key;
		for (const [other, source] of this.entries)
			this.port.show(source, other === key, other === key ? 1 : 0);
		while (this.entries.size > 3) {
			const oldest = [...this.entries.keys()].find(k => k !== key)!;
			this.drop(oldest);
		}
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
		for (const id of this.entries.values()) this.port.show(id, false, 0);
	}
	private drop(key: string) {
		const id = this.entries.get(key);
		if (id) this.port.remove(id);
		this.entries.delete(key);
	}
}

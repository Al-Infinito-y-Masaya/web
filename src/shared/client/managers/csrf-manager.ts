export interface CSRFManagerOptions {
	/** Header the token is sent in, e.g. `x-csrftoken`. */
	headerName: string;
	/** Fetches a fresh token from the backend. */
	fetchToken: () => Promise<string>;
}

/**
 * Keeps a CSRF token in memory, fetching it lazily and de-duplicating
 * concurrent fetches. Needed by backends that use cookie sessions and require
 * a CSRF header on unsafe requests (Django, Rails, Laravel…).
 */
export class CSRFManager {
	private token: string | null = null;
	private pending: Promise<string> | null = null;

	constructor(private readonly options: CSRFManagerOptions) {}

	get(): string | null {
		return this.token;
	}

	clear(): void {
		this.token = null;
	}

	async ensure(force = false): Promise<string> {
		if (this.token && !force) return this.token;
		if (this.pending) return this.pending;

		const pending = this.options.fetchToken();
		this.pending = pending;

		try {
			const token = await pending;
			this.token = token;
			return token;
		} finally {
			if (this.pending === pending) this.pending = null;
		}
	}

	async headers(force = false): Promise<Record<string, string>> {
		const token = await this.ensure(force);
		return { [this.options.headerName]: token };
	}

	inject(request: Request): Request {
		if (!this.token) throw new Error('CSRF token has not been loaded.');
		const headers = new Headers(request.headers);
		headers.set(this.options.headerName, this.token);
		return new Request(request, { headers });
	}
}

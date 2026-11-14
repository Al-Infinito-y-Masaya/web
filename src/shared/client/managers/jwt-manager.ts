export interface JWTManagerOptions {
	/** Returns whether the current access token is still valid. */
	verifyAccess: () => Promise<boolean>;
	/** Refreshes the access token; returns whether it worked. */
	refreshAccess: () => Promise<boolean>;
}

/**
 * Coordinates access-token refreshes so that many requests failing with 401 at
 * once trigger a single refresh call.
 */
export class JWTManager {
	private refreshPending: Promise<boolean> | null = null;

	constructor(private readonly options: JWTManagerOptions) {}

	async ensure(): Promise<boolean> {
		const valid = await this.options.verifyAccess();
		if (valid) return true;
		return this.refresh();
	}

	async refresh(): Promise<boolean> {
		if (this.refreshPending) return this.refreshPending;

		const pending = this.options.refreshAccess();
		this.refreshPending = pending;

		try {
			return await pending;
		} finally {
			if (this.refreshPending === pending) this.refreshPending = null;
		}
	}
}

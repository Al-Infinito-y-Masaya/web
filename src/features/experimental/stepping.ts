/** Move through the dates, optionally staying on the same orbit direction. */
type Pass = { direccion: string };

export function stepDate(dates: readonly Pass[], from: number, delta: number, sameOrbit: boolean) {
	const n = dates.length;
	if (n === 0) return from;
	const orbit = dates[from]?.direccion;
	for (let k = 1; k <= n; k++) {
		const i = (((from + delta * k) % n) + n) % n;
		if (!sameOrbit || dates[i]!.direccion === orbit) return i;
	}
	return from;
}

/** The dates a step forward or back would reach, nearest first, without repeats. */
export function neighborDates(dates: readonly Pass[], from: number, sameOrbit: boolean) {
	const next = stepDate(dates, from, 1, sameOrbit);
	const previous = stepDate(dates, from, -1, sameOrbit);
	return [...new Set([next, previous])].filter(i => i !== from);
}

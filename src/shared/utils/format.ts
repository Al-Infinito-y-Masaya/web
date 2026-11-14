import { appConfig } from '@/config/app';

/*
 * Locale-aware formatting helpers. The locale comes from `appConfig.locale`
 * (browser locale by default).
 */

const locale = appConfig.locale;
const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
const dateTimeFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
const monthFormat = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
const numberFormat = new Intl.NumberFormat(locale);
const relativeFormat = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

/**
 * Parses an ISO string. Date-only values ("2026-11-05") are read as a local
 * day; `new Date` would read them as UTC and could land on the previous day.
 */
export function parseDate(value: string | Date | null | undefined): Date | null {
	if (!value) return null;
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
	const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
		? new Date(`${value}T00:00:00`)
		: new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | Date | null | undefined) {
	const date = parseDate(value);
	return date ? dateFormat.format(date) : null;
}

export function formatDateTime(value: string | Date | null | undefined) {
	const date = parseDate(value);
	return date ? dateTimeFormat.format(date) : null;
}

export function formatMonth(value: string | Date | null | undefined) {
	const date = parseDate(value);
	return date ? monthFormat.format(date) : null;
}

export function formatNumber(value: number | null | undefined) {
	return value == null ? null : numberFormat.format(value);
}

/** "3 days ago", "in 2 hours". */
export function formatRelative(value: string | Date | null | undefined, now = new Date()) {
	const date = parseDate(value);
	if (!date) return null;
	const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
	const units: [Intl.RelativeTimeFormatUnit, number][] = [
		['year', 31_536_000],
		['month', 2_592_000],
		['day', 86_400],
		['hour', 3_600],
		['minute', 60]
	];
	for (const [unit, size] of units) {
		if (Math.abs(seconds) >= size)
			return relativeFormat.format(Math.round(seconds / size), unit);
	}
	return relativeFormat.format(seconds, 'second');
}

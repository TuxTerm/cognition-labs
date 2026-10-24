export function formatDate(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Unknown';
	return new Intl.DateTimeFormat('en', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	}).format(date);
}

export function formatDuration(durationMs: number): string {
	const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	if (minutes === 0) return `${seconds}s`;
	return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

export function formatClock(milliseconds: number): string {
	const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
	return `${count} ${count === 1 ? singular : plural}`;
}

export function monthLabel(date = new Date()): string {
	return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(date);
}

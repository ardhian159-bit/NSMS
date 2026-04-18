// =============================================================================
// NSMS — ISO Week Utilities
// Source: legacy Code.gs getISOWeekLabel (line 705-711) + sales.html getISOWeek
// =============================================================================

/**
 * Get ISO 8601 week number for a given date.
 */
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return weekNo
}

/**
 * Get week label string: "W16-2026"
 */
export function getWeekLabel(date: Date): string {
  const week = getISOWeek(date)
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const year = d.getUTCFullYear()
  return `W${week}-${year}`
}

/**
 * Get current week label.
 */
export function getCurrentWeekLabel(): string {
  return getWeekLabel(new Date())
}

/**
 * Get current year.
 */
export function getCurrentYear(): number {
  return new Date().getFullYear()
}

/**
 * Get current ISO week info for display badges.
 * Returns { week, year, dateLabel } where dateLabel is e.g. "18 April 2026"
 */
export function getISOWeekInfo(): { week: number; year: number; dateLabel: string } {
  const now = new Date()
  const week = getISOWeek(now)
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const year = d.getUTCFullYear()
  const dateLabel = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return { week, year, dateLabel }
}

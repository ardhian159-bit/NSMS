// =============================================================================
// NSMS — Lead Detail + Tracker History
// Source: legacy dashboard.html openPipelineModal (line 962-1019)
// Pure functions
// =============================================================================

import type { Lead, TrackerEntry } from '../types'

/**
 * Parse week label "W{N}-YYYY" → rank numerik (year*100 + week).
 * Untuk sort kronologis yang benar (localeCompare salah: "W3" > "W24").
 */
export function weekRank(label: string | null | undefined): number {
  const m = (label || '').match(/^W(\d+)-(\d+)$/i)
  if (!m) return -1
  return parseInt(m[2], 10) * 100 + parseInt(m[1], 10)
}

/**
 * Find a lead by funnelId from an array.
 * Used by the detail drawer/modal.
 */
export function getLeadByFunnelId(data: Lead[], funnelId: string): Lead | undefined {
  return data.find((d) => d.funnelId === funnelId)
}

/**
 * Get tracker history entries for a given funnelId, sorted newest first
 * (year desc, lalu week desc).
 */
export function getTrackerHistory(trackers: TrackerEntry[], funnelId: string): TrackerEntry[] {
  return trackers
    .filter((t) => t.funnelId === funnelId)
    .sort((a, b) => weekRank(b.week) - weekRank(a.week))
}

/**
 * Check if a funnel has been updated in the current week.
 */
export function isUpdatedThisWeek(
  trackers: TrackerEntry[],
  funnelId: string,
  currentWeekLabel: string
): boolean {
  return trackers.some((t) => t.funnelId === funnelId && t.week === currentWeekLabel)
}

/**
 * Get the latest week label for a given funnel.
 */
export function getLatestWeekForFunnel(trackers: TrackerEntry[], funnelId: string): string {
  const weeks = trackers
    .filter((t) => t.funnelId === funnelId && t.week)
    .map((t) => t.week)
    .sort((a, b) => weekRank(a) - weekRank(b))

  return weeks.length > 0 ? weeks[weeks.length - 1] : ''
}

/**
 * Count how many funnels have been updated in the current week.
 */
export function getWeeklyUpdateStats(
  funnelIds: string[],
  trackers: TrackerEntry[],
  currentWeekLabel: string
): { updated: number; total: number; percent: number } {
  const updatedIds = new Set(
    trackers
      .filter((t) => t.week === currentWeekLabel)
      .map((t) => t.funnelId)
  )

  const total = funnelIds.length
  const updated = funnelIds.filter((id) => updatedIds.has(id)).length
  const percent = total > 0 ? Math.round((updated / total) * 100) : 0

  return { updated, total, percent }
}

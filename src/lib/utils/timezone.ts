/**
 * Thailand timezone utilities for time-locked features
 * Thailand is UTC+7 (no daylight saving time)
 */

const THAILAND_TIMEZONE = 'Asia/Bangkok'

/**
 * Check if all content should be unlocked (for testing before wedding day)
 * Set NEXT_PUBLIC_UNLOCK_ALL_CONTENT=true in environment to bypass time locks
 */
export function isUnlockAllEnabled(): boolean {
  return process.env.NEXT_PUBLIC_UNLOCK_ALL_CONTENT === 'true'
}

/**
 * Get current time in Thailand (UTC+7)
 */
export function getThailandTime(): Date {
  const now = new Date()
  // Convert to Thailand time string and parse back
  const thailandTimeString = now.toLocaleString('en-US', {
    timeZone: THAILAND_TIMEZONE,
  })
  return new Date(thailandTimeString)
}

// Wedding date: January 31, 2026
const WEDDING_YEAR = 2026
const WEDDING_MONTH = 1 // January (1-indexed for comparison)
const WEDDING_DAY = 31

/**
 * Check if today is the wedding day in Thailand time
 */
export function isWeddingDay(): boolean {
  const thailandTime = getThailandTime()
  const year = thailandTime.getFullYear()
  const month = thailandTime.getMonth() + 1 // getMonth() is 0-indexed
  const day = thailandTime.getDate()

  return year === WEDDING_YEAR && month === WEDDING_MONTH && day === WEDDING_DAY
}

/**
 * Check if a specific unlock time has passed in Thailand time
 * Only unlocks on the wedding day at the specified time
 * @param hour - Hour in 24-hour format (0-23)
 * @param minute - Minute (0-59)
 * @returns true if it's the wedding day and the current Thailand time is at or past the unlock time
 */
export function isTimeUnlocked(hour: number, minute: number): boolean {
  // If unlock all is enabled, bypass time checks (for testing)
  if (isUnlockAllEnabled()) {
    return true
  }

  // Only unlock on the wedding day
  if (!isWeddingDay()) {
    return false
  }

  const thailandTime = getThailandTime()
  const currentHour = thailandTime.getHours()
  const currentMinute = thailandTime.getMinutes()

  // Compare times
  if (currentHour > hour) return true
  if (currentHour === hour && currentMinute >= minute) return true
  return false
}

/**
 * Format time for display (e.g., "4:30 PM")
 * @param hour - Hour in 24-hour format (0-23)
 * @param minute - Minute (0-59)
 * @returns Formatted time string in 12-hour format
 */
export function formatThailandTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  const displayMinute = minute.toString().padStart(2, '0')
  return `${displayHour}:${displayMinute} ${period}`
}

export const BASE_POINTS = 100
export const TIME_BONUS_MAX = 50
export const GAMES_COMPLETION_BONUS = 200

export function calculatePoints(
  isCorrect: boolean,
  timeTakenMs: number,
  timeLimitMs: number
): number {
  if (!isCorrect) return 0

  const timeRatio = Math.max(0, 1 - timeTakenMs / timeLimitMs)
  return BASE_POINTS + Math.round(TIME_BONUS_MAX * timeRatio)
}

export function getRemainingTime(startedAt: string, timeLimitSeconds: number): number {
  const startTime = new Date(startedAt).getTime()
  const elapsed = Date.now() - startTime
  const remaining = timeLimitSeconds * 1000 - elapsed
  return Math.max(0, Math.floor(remaining / 1000))
}

export function formatTimeMs(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const milliseconds = ms % 1000
  return `${seconds}.${Math.floor(milliseconds / 100)}s`
}

export function getPointsBreakdown(
  isCorrect: boolean,
  timeTakenMs: number,
  timeLimitMs: number
): { base: number; timeBonus: number; total: number } {
  if (!isCorrect) {
    return { base: 0, timeBonus: 0, total: 0 }
  }

  const timeRatio = Math.max(0, 1 - timeTakenMs / timeLimitMs)
  const timeBonus = Math.round(TIME_BONUS_MAX * timeRatio)

  return {
    base: BASE_POINTS,
    timeBonus,
    total: BASE_POINTS + timeBonus,
  }
}

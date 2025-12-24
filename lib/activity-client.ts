import type { ActivityAction } from './activity'

export async function logActivityClient(
  action: ActivityAction,
  details?: string
) {
  try {
    await fetch('/api/activity/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details }),
    })
  } catch (error) {
    console.error('[Activity] Failed to log activity:', error)
  }
}

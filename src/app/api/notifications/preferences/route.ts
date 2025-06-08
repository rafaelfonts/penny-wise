import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/services/notifications-temp'
import type { UpdateNotificationPreferences } from '@/lib/types/alerts'

// GET /api/notifications/preferences - Get user preferences
export async function GET() {
  try {
    const preferences = await notificationService.getNotificationPreferences()
    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications/preferences - Update user preferences
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const updates: UpdateNotificationPreferences = body

    const result = await notificationService.updateNotificationPreferences(updates)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
} 
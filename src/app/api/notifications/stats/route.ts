import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notifications-temp';

// GET /api/notifications/stats - Get notification statistics
export async function GET() {
  try {
    const stats = await notificationService.getNotificationStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification stats' },
      { status: 500 }
    );
  }
}

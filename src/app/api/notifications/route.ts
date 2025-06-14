import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notifications-temp';
import type { CreateNotification, NotificationType } from '@/lib/types/alerts';

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const typeParam = searchParams.get('type');

    // For now, we'll just get all notifications as the service doesn't support filtering yet
    const response = await notificationService.getUserNotifications();

    // Apply client-side filtering if type is specified
    if (typeParam && typeParam !== 'all') {
      response.notifications = response.notifications.filter(
        notification => notification.type === (typeParam as NotificationType)
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const notification: CreateNotification = body;

    // Validate required fields
    if (!notification.title || !notification.message || !notification.type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message, type' },
        { status: 400 }
      );
    }

    const result = await notificationService.createNotification(notification);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

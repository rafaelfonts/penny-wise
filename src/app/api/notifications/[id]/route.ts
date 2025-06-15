import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notifications';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// PATCH /api/notifications/[id] - Mark notification as read
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const result = await notificationService.markAsRead(id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const result = await notificationService.deleteNotification(id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}

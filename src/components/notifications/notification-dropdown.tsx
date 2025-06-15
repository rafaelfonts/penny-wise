'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationCenter } from './notification-center';
import { notificationService } from '@/lib/services/notifications';
import type { NotificationStats } from '@/lib/types/alerts';

export function NotificationDropdown() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadStats();

    // Auto-refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const notificationStats =
        await notificationService.getNotificationStats();
      setStats(notificationStats);
    } catch (err) {
      console.error('Failed to load notification stats:', err);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {stats && stats.unread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
            >
              {stats.unread > 99 ? '99+' : stats.unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <NotificationCenter variant="dropdown" maxHeight="500px" />
      </PopoverContent>
    </Popover>
  );
}

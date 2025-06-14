'use client';

import { useState, useEffect } from 'react';
import { Settings, Bell, Clock, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationService } from '@/lib/services/notifications-temp';
import type {
  NotificationPreferences,
  UpdateNotificationPreferences,
} from '@/lib/types/alerts';

interface NotificationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Simple Switch component to avoid dependency issues
function Switch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
      onClick={() => onCheckedChange(!checked)}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function NotificationSettings({
  open,
  onOpenChange,
}: NotificationSettingsProps) {
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadPreferences();
    }
  }, [open]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const userPreferences =
        await notificationService.getNotificationPreferences();
      setPreferences(userPreferences);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load preferences'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      setError(null);

      const updates: UpdateNotificationPreferences = {
        push_enabled: preferences.push_enabled ?? undefined,
        email_enabled: preferences.email_enabled ?? undefined,
        alert_notifications: preferences.alert_notifications ?? undefined,
        market_notifications: preferences.market_notifications ?? undefined,
        news_notifications: preferences.news_notifications ?? undefined,
        system_notifications: preferences.system_notifications ?? undefined,
        quiet_hours_start: preferences.quiet_hours_start ?? undefined,
        quiet_hours_end: preferences.quiet_hours_end ?? undefined,
        timezone: preferences.timezone ?? undefined,
      };

      await notificationService.updateNotificationPreferences(updates);
      onOpenChange(false);

      // Initialize push notifications if enabled
      if (preferences.push_enabled) {
        await notificationService.initializePushNotifications();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save preferences'
      );
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (
    key: keyof NotificationPreferences,
    value: boolean | string
  ) => {
    if (!preferences) return;

    setPreferences(prev =>
      prev
        ? {
            ...prev,
            [key]: value,
          }
        : null
    );
  };

  const testNotification = async () => {
    try {
      await notificationService.createDemoNotification('system');
    } catch (err) {
      console.error('Failed to send test notification:', err);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </DialogTitle>
          <DialogDescription>
            Configure how and when you receive notifications
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {preferences && (
          <div className="space-y-6">
            {/* Delivery Methods */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-4 w-4" />
                  Delivery Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Push Notifications
                    </Label>
                    <p className="text-xs text-gray-500">
                      Receive notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={preferences.push_enabled ?? false}
                    onCheckedChange={(checked: boolean) =>
                      updatePreference('push_enabled', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-xs text-gray-500">
                      Receive important updates via email
                    </p>
                  </div>
                  <Switch
                    checked={preferences.email_enabled ?? false}
                    onCheckedChange={(checked: boolean) =>
                      updatePreference('email_enabled', checked)
                    }
                  />
                </div>

                {preferences.push_enabled && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testNotification}
                      className="w-full"
                    >
                      Send Test Notification
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notification Types */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notification Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Price Alerts</Label>
                    <p className="text-xs text-gray-500">
                      When your price alerts are triggered
                    </p>
                  </div>
                  <Switch
                    checked={preferences.alert_notifications ?? false}
                    onCheckedChange={(checked: boolean) =>
                      updatePreference('alert_notifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Market Updates
                    </Label>
                    <p className="text-xs text-gray-500">
                      Major market movements and news
                    </p>
                  </div>
                  <Switch
                    checked={preferences.market_notifications ?? false}
                    onCheckedChange={(checked: boolean) =>
                      updatePreference('market_notifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Breaking News</Label>
                    <p className="text-xs text-gray-500">
                      Important financial news and events
                    </p>
                  </div>
                  <Switch
                    checked={preferences.news_notifications ?? false}
                    onCheckedChange={(checked: boolean) =>
                      updatePreference('news_notifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      System Updates
                    </Label>
                    <p className="text-xs text-gray-500">
                      App updates and maintenance notifications
                    </p>
                  </div>
                  <Switch
                    checked={preferences.system_notifications ?? false}
                    onCheckedChange={(checked: boolean) =>
                      updatePreference('system_notifications', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quiet Hours */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Quiet Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Pause notifications during these hours (optional)
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiet-start">Start Time</Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={preferences.quiet_hours_start || ''}
                      onChange={e =>
                        updatePreference('quiet_hours_start', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet-end">End Time</Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={preferences.quiet_hours_end || ''}
                      onChange={e =>
                        updatePreference('quiet_hours_end', e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={preferences.timezone ?? undefined}
                    onValueChange={value => updatePreference('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">
                        Eastern Time
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time
                      </SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      <SelectItem value="America/Sao_Paulo">
                        São Paulo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

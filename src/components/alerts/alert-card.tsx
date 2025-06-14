'use client';

import { useState } from 'react';
import {
  Bell,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Edit,
  Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { Alert } from '@/lib/types/alerts';

interface AlertCardProps {
  alert: Alert;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AlertCard({ alert, onToggle, onDelete }: AlertCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const getAlertTypeIcon = () => {
    switch (alert.alert_type) {
      case 'price':
        return alert.condition_type === 'above' ? TrendingUp : TrendingDown;
      case 'volume':
        return BarChart3;
      case 'technical':
        return BarChart3;
      default:
        return Bell;
    }
  };

  const getConditionText = () => {
    const { condition_type, target_value, alert_type } = alert;

    switch (alert_type) {
      case 'price':
        return `${condition_type} $${target_value.toFixed(2)}`;
      case 'volume':
        return `${condition_type} ${target_value.toLocaleString()}`;
      case 'technical':
        return `${condition_type} ${target_value}`;
      default:
        return `${condition_type} ${target_value}`;
    }
  };

  const getStatusBadge = () => {
    if (!alert.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (alert.triggered_at) {
      return <Badge variant="destructive">Triggered</Badge>;
    }

    return (
      <Badge variant="default" className="bg-green-600">
        Active
      </Badge>
    );
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete(alert.id);
    } catch (error) {
      console.error('Failed to delete alert:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const Icon = getAlertTypeIcon();

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${
        alert.is_active
          ? 'border-l-4 border-l-blue-500'
          : 'border-l-4 border-l-gray-300'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`rounded-lg p-2 ${
                alert.is_active
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{alert.symbol}</h3>
                {getStatusBadge()}
                <Badge variant="outline" className="text-xs">
                  {alert.alert_type}
                </Badge>
              </div>

              <p className="mt-1 text-sm text-gray-600">
                Notify when price is{' '}
                <span className="font-medium">{getConditionText()}</span>
              </p>

              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Created {formatDate(alert.created_at)}
                </div>
                {alert.triggered_at && (
                  <div className="flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    Triggered {formatDate(alert.triggered_at)}
                  </div>
                )}
                {(alert.trigger_count ?? 0) > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {alert.trigger_count ?? 0} triggers
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={alert.is_active ?? false}
                onCheckedChange={() => onToggle(alert.id)}
                className="data-[state=checked]:bg-blue-600"
              />
              <span className="text-xs text-gray-500">
                {alert.is_active ? 'On' : 'Off'}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // TODO: Implement edit functionality
                console.log('Edit alert:', alert.id);
              }}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Current Value Display */}
        {alert.current_value && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Current Value:</span>
              <span className="font-medium">
                {alert.alert_type === 'price'
                  ? `$${alert.current_value.toFixed(2)}`
                  : alert.current_value.toLocaleString()}
              </span>
            </div>

            {alert.alert_type === 'price' && (
              <div className="mt-1">
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      alert.condition_type === 'above'
                        ? alert.current_value >= alert.target_value
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                        : alert.current_value <= alert.target_value
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          10,
                          (alert.current_value / alert.target_value) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>Target: ${alert.target_value.toFixed(2)}</span>
                  <span>
                    {(
                      (alert.current_value / alert.target_value - 1) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cooldown Information */}
        {(alert.cooldown_minutes ?? 0) > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            <span>
              Cooldown: {alert.cooldown_minutes} minutes between triggers
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

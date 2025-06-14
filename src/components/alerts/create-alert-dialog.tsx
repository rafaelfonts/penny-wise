'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { alertService } from '@/lib/services/alerts-temp';
import type {
  Alert,
  CreateAlert,
  AlertType,
  ConditionType,
} from '@/lib/types/alerts';

interface CreateAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAlert: (alert: Alert) => void;
}

export function CreateAlertDialog({
  open,
  onOpenChange,
  onCreateAlert,
}: CreateAlertDialogProps) {
  const [formData, setFormData] = useState<CreateAlert>({
    symbol: '',
    alert_type: 'price',
    condition_type: 'above',
    target_value: 0,
    cooldown_minutes: 60,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.symbol || formData.target_value <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newAlert = await alertService.createAlert(formData);
      onCreateAlert(newAlert);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      symbol: '',
      alert_type: 'price',
      condition_type: 'above',
      target_value: 0,
      cooldown_minutes: 60,
    });
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const getConditionOptions = () => {
    switch (formData.alert_type) {
      case 'price':
      case 'volume':
        return [
          { value: 'above', label: 'Above' },
          { value: 'below', label: 'Below' },
        ];
      case 'technical':
        return [
          { value: 'above', label: 'Above' },
          { value: 'below', label: 'Below' },
          { value: 'cross_above', label: 'Crosses Above' },
          { value: 'cross_below', label: 'Crosses Below' },
        ];
      default:
        return [
          { value: 'above', label: 'Above' },
          { value: 'below', label: 'Below' },
        ];
    }
  };

  const getValueLabel = () => {
    switch (formData.alert_type) {
      case 'price':
        return 'Target Price ($)';
      case 'volume':
        return 'Target Volume';
      case 'technical':
        return 'Target Value';
      default:
        return 'Target Value';
    }
  };

  const getValuePlaceholder = () => {
    switch (formData.alert_type) {
      case 'price':
        return '150.00';
      case 'volume':
        return '1000000';
      case 'technical':
        return '70';
      default:
        return '0';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Alert
          </DialogTitle>
          <DialogDescription>
            Set up a new price alert to monitor your investments
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Symbol Input */}
          <div className="space-y-2">
            <Label htmlFor="symbol">Stock Symbol</Label>
            <Input
              id="symbol"
              placeholder="AAPL, GOOGL, MSFT..."
              value={formData.symbol}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  symbol: e.target.value.toUpperCase(),
                }))
              }
              className="uppercase"
              required
            />
          </div>

          {/* Alert Type */}
          <div className="space-y-2">
            <Label htmlFor="alert-type">Alert Type</Label>
            <Select
              value={formData.alert_type}
              onValueChange={(value: AlertType) =>
                setFormData(prev => ({
                  ...prev,
                  alert_type: value,
                  condition_type: 'above', // Reset condition when type changes
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">Price Alert</SelectItem>
                <SelectItem value="volume">Volume Alert</SelectItem>
                <SelectItem value="technical">Technical Indicator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Condition Type */}
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select
              value={formData.condition_type}
              onValueChange={(value: ConditionType) =>
                setFormData(prev => ({ ...prev, condition_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getConditionOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Value */}
          <div className="space-y-2">
            <Label htmlFor="target-value">{getValueLabel()}</Label>
            <Input
              id="target-value"
              type="number"
              step={formData.alert_type === 'price' ? '0.01' : '1'}
              min="0"
              placeholder={getValuePlaceholder()}
              value={formData.target_value || ''}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  target_value: parseFloat(e.target.value) || 0,
                }))
              }
              required
            />
          </div>

          {/* Cooldown */}
          <div className="space-y-2">
            <Label htmlFor="cooldown">Cooldown (minutes)</Label>
            <Select
              value={formData.cooldown_minutes?.toString() || '60'}
              onValueChange={value =>
                setFormData(prev => ({
                  ...prev,
                  cooldown_minutes: parseInt(value),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
                <SelectItem value="1440">24 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {formData.symbol && formData.target_value > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Alert Preview:</p>
                  <p className="mt-1 text-blue-700">
                    Notify me when <strong>{formData.symbol}</strong>{' '}
                    {formData.alert_type} is{' '}
                    <strong>{formData.condition_type}</strong>{' '}
                    <strong>
                      {formData.alert_type === 'price'
                        ? `$${formData.target_value.toFixed(2)}`
                        : formData.target_value.toLocaleString()}
                    </strong>
                  </p>
                  <p className="mt-2 text-xs text-blue-600">
                    Cooldown: {formData.cooldown_minutes} minutes between
                    notifications
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading || !formData.symbol || formData.target_value <= 0
              }
            >
              {loading ? 'Creating...' : 'Create Alert'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

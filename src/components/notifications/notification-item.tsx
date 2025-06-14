'use client'

import { Clock, Check, Trash2, Bell, TrendingUp, Settings, MessageSquare, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Notification } from '@/lib/types/alerts'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const getTypeIcon = () => {
    switch (notification.type) {
      case 'alert':
        return Bell
      case 'market':
        return TrendingUp
      case 'system':
        return Settings
      case 'news':
        return MessageSquare
      case 'portfolio':
        return User
      default:
        return Bell
    }
  }

  const getTypeColor = () => {
    switch (notification.type) {
      case 'alert':
        return 'text-red-600 bg-red-100'
      case 'market':
        return 'text-blue-600 bg-blue-100'
      case 'system':
        return 'text-gray-600 bg-gray-100'
      case 'news':
        return 'text-green-600 bg-green-100'
      case 'portfolio':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'critical':
        return 'border-red-500'
      case 'high':
        return 'border-orange-500'
      case 'medium':
        return 'border-blue-500'
      case 'low':
        return 'border-gray-300'
      default:
        return 'border-gray-300'
    }
  }

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const Icon = getTypeIcon()

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${
        !notification.read 
          ? `border-l-4 ${getPriorityColor()} bg-blue-50/50` 
          : 'border-l-4 border-l-gray-200'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${getTypeColor()}`}>
              <Icon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-medium text-sm ${
                  !notification.read ? 'text-gray-900' : 'text-gray-600'
                }`}>
                  {notification.title}
                </h4>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                )}
              </div>
              
              <p className={`text-sm ${
                !notification.read ? 'text-gray-700' : 'text-gray-500'
              } mb-2`}>
                {notification.message}
              </p>
              
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(notification.created_at)}
                </div>
                
                <Badge 
                  variant="outline" 
                  className="text-xs py-0 px-2"
                >
                  {notification.type}
                </Badge>
                
                {notification.priority !== 'medium' && (
                  <Badge 
                    variant={notification.priority === 'high' || notification.priority === 'critical' ? 'destructive' : 'secondary'}
                    className="text-xs py-0 px-2"
                  >
                    {notification.priority}
                  </Badge>
                )}
              </div>

              {/* Data Preview */}
              {notification.data && Object.keys(notification.data).length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  {notification.type === 'alert' && notification.data.symbol && (
                    <div className="flex justify-between">
                      <span>Symbol:</span>
                      <span className="font-medium">{notification.data.symbol}</span>
                    </div>
                  )}
                  {notification.data.current_price && (
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-medium">${notification.data.current_price}</span>
                    </div>
                  )}
                  {notification.data.change_percent && (
                    <div className="flex justify-between">
                      <span>Change:</span>
                      <span className={`font-medium ${
                        Number(notification.data.change_percent) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {Number(notification.data.change_percent) >= 0 ? '+' : ''}
                        {notification.data.change_percent}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="Mark as read"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(notification.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Delete notification"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
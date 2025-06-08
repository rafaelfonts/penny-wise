import { Metadata } from 'next'
import { NotificationCenter } from '@/components/notifications'

export const metadata: Metadata = {
  title: 'Notifications | Penny Wise',
  description: 'Manage your alerts and notifications',
}

export default function NotificationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-2">
          Stay updated with your price alerts, market movements, and system updates
        </p>
      </div>

      <NotificationCenter variant="page" />
    </div>
  )
} 
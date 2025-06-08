import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatInterface } from '@/components/chat/chat-interface'

export default async function ChatPage() {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="h-screen w-full">
      <ChatInterface />
    </div>
  )
}

export const metadata = {
  title: 'Chat - Penny Wise',
  description: 'Chat inteligente para análise financeira com IA'
} 
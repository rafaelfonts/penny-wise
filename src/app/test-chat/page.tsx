'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Bot, User } from 'lucide-react';

interface TestMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function TestChatPage() {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendTestMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: TestMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Teste direto com DeepSeek
      const response = await fetch('/api/test-deepseek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        const assistantMessage: TestMessage = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          role: 'assistant',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const assistantMessage: TestMessage = {
          id: (Date.now() + 1).toString(),
          content: `Erro: ${response.status} - ${response.statusText}`,
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      const assistantMessage: TestMessage = {
        id: (Date.now() + 1).toString(),
        content: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTestMessage();
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          🧪 Teste do Chat - DeepSeek API
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Teste direto da integração com IA (sem autenticação)
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <Card className="p-8 text-center">
            <Bot className="mx-auto mb-4 h-16 w-16 text-blue-600" />
            <h2 className="mb-3 text-xl font-semibold">Teste do Chat com IA</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Digite uma mensagem para testar a integração com DeepSeek
            </p>
          </Card>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <Bot className="h-8 w-8 rounded-full bg-blue-100 p-1.5 text-blue-600" />
                </div>
              )}

              <Card
                className={`max-w-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                <p
                  className={`mt-2 text-xs ${
                    message.role === 'user'
                      ? 'text-blue-100'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </Card>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <User className="h-8 w-8 rounded-full bg-gray-100 p-1.5 text-gray-600" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="max-h-[120px] min-h-[60px] flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={sendTestMessage}
            disabled={!input.trim() || isLoading}
            size="lg"
            className="px-6"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatStoreClient } from '@/hooks/use-chat-store';
import {
  Send,
  Loader2,
  Paperclip,
  X,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { CommandSuggestions } from './command-suggestions';

interface ChatInputProps {
  className?: string;
}

interface UploadedFile {
  file: File;
  url: string;
  type: 'image' | 'document';
}

// DeepSeek supported file types based on official documentation
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const SUPPORTED_DOCUMENT_TYPES = [
  // Text documents
  'text/plain',
  'text/markdown',
  'text/csv',
  // PDF documents
  'application/pdf',
  // Microsoft Office documents
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Code files
  'text/html',
  'text/css',
  'text/javascript',
  'application/json',
  'text/xml',
  'application/xml',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit as per DeepSeek documentation

export function ChatInput({ className }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    sendMessage,
    sendMessageStream,
    isLoading,
    isStreaming,
    currentConversationId,
    createNewConversation,
  } = useChatStoreClient();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  // Commands detection
  const isCommand = message.startsWith('/');

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      };
    }

    // Check file type
    const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);
    const isDocument = SUPPORTED_DOCUMENT_TYPES.includes(file.type);

    if (!isImage && !isDocument) {
      return {
        isValid: false,
        error:
          'Tipo de arquivo não suportado. Formatos aceitos: JPEG, PNG, WebP, PDF, DOC, TXT, MD, CSV e outros documentos.',
      };
    }

    return { isValid: true };
  };

  const handleFileSelect = (files: FileList) => {
    const newFiles: UploadedFile[] = [];

    Array.from(files).forEach(file => {
      const validation = validateFile(file);

      if (!validation.isValid) {
        alert(validation.error);
        return;
      }

      const url = URL.createObjectURL(file);
      const type = SUPPORTED_IMAGE_TYPES.includes(file.type)
        ? 'image'
        : 'document';

      newFiles.push({ file, url, type });
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].url);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      (!message.trim() && uploadedFiles.length === 0) ||
      isLoading ||
      isStreaming
    )
      return;

    // Create new conversation if none exists
    if (!currentConversationId) {
      try {
        await createNewConversation();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            'Failed to create new conversation:',
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
        return;
      }
    }

    const messageContent = message.trim();
    const filesToSend = [...uploadedFiles.map(f => f.file)]; // Create copy of files array

    setMessage('');
    setShowCommands(false);

    // Clear uploaded files after copying them
    uploadedFiles.forEach(f => URL.revokeObjectURL(f.url));
    setUploadedFiles([]);

    try {
      // Use streaming by default for better UX, passing actual files
      await sendMessageStream(
        messageContent || 'Analisar arquivos anexados',
        filesToSend
      );
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'Streaming failed, falling back to regular:',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      // Fallback to regular message sending with files
      try {
        await sendMessage(
          messageContent || 'Analisar arquivos anexados',
          filesToSend
        );
      } catch (fallbackError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            'Both streaming and regular send failed:',
            fallbackError instanceof Error
              ? fallbackError.message
              : 'Unknown error'
          );
        }
        // Restore the message if both methods fail
        setMessage(messageContent);
        // Restore uploaded files on failure
        const restoredFiles = filesToSend.map(file => ({
          file,
          url: URL.createObjectURL(file),
          type: (file.type.startsWith('image/') ? 'image' : 'document') as
            | 'image'
            | 'document',
        }));
        setUploadedFiles(restoredFiles);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
    }

    if (e.key === 'Escape') {
      setShowCommands(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    setShowCommands(value.startsWith('/') && value.length > 1);
  };

  const handleSelectCommand = (command: string) => {
    setMessage(command + ' ');
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  // Create accepted file types string for input
  const acceptedTypes = [
    ...SUPPORTED_IMAGE_TYPES,
    ...SUPPORTED_DOCUMENT_TYPES,
  ].join(',');

  return (
    <div className={cn('relative', className)}>
      {/* Command suggestions */}
      {showCommands && (
        <CommandSuggestions
          input={message}
          onSelectCommand={handleSelectCommand}
        />
      )}

      {/* File upload area with drag & drop */}
      <div
        className={cn(
          'relative',
          isDragOver &&
            'rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-900/10'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Uploaded files preview */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {uploadedFiles.map((uploadedFile, index) => (
              <div
                key={index}
                className="relative flex max-w-xs items-center gap-2 rounded-lg bg-gray-100 p-2 dark:bg-gray-700"
              >
                {uploadedFile.type === 'image' ? (
                  <>
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                    <Image
                      src={uploadedFile.url}
                      alt={`Preview de ${uploadedFile.file.name}`}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded object-cover"
                    />
                  </>
                ) : (
                  <FileText className="h-4 w-4 text-green-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-100"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Main input form */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isCommand
                  ? 'Digite um comando ou pressione Tab para sugestões...'
                  : uploadedFiles.length > 0
                    ? 'Adicione uma mensagem sobre os arquivos enviados...'
                    : 'Digite sua pergunta sobre o mercado financeiro...'
              }
              className={cn(
                'max-h-[120px] min-h-[44px] resize-none pr-20',
                isCommand && 'border-blue-500 dark:border-blue-400'
              )}
              disabled={isLoading}
            />

            {/* Character count for long messages */}
            {message.length > 100 && (
              <div className="absolute right-2 bottom-2 text-xs text-gray-400">
                {message.length}/2000
              </div>
            )}
          </div>

          <div className="flex gap-1">
            {/* File upload button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleFileButtonClick}
              className="shrink-0"
              title="Anexar arquivo (JPEG, PNG, WebP, PDF, DOC, TXT, MD, CSV)"
              disabled={isLoading || isStreaming}
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Send button */}
            <Button
              type="submit"
              disabled={
                (!message.trim() && uploadedFiles.length === 0) ||
                isLoading ||
                isStreaming
              }
              className="shrink-0"
              title="Enviar mensagem (Enter)"
            >
              {isLoading || isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-blue-50/90 dark:bg-blue-900/90">
            <div className="text-center">
              <Paperclip className="mx-auto mb-2 h-8 w-8 text-blue-500" />
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Solte os arquivos aqui
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Formatos suportados: JPEG, PNG, WebP, PDF, DOC, TXT, MD, CSV
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Pressione Enter para enviar, Shift+Enter para nova linha
        {isCommand && ' • Digite / para ver comandos disponíveis'}
        {uploadedFiles.length > 0 &&
          ` • ${uploadedFiles.length} arquivo(s) anexado(s)`}
      </div>
    </div>
  );
}

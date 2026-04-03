import { useEffect, useState } from 'react';
import {
  deleteThreadMessage,
  getDmConversations,
  getDmThreadMessages,
  getServerThreadMessages,
  sendMessageToThread,
  updateThreadMessage,
} from '../services/chatApi';
import type { ChatMessage, Thread } from '../types/chat';

export const useChatThread = (serverId?: string, channelId?: string, recieverId?: string) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const dmThreads = await getDmConversations();
        setThreads(dmThreads);

        if (serverId && channelId) {
          const data = await getServerThreadMessages(serverId, channelId);
          setActiveThread(data.thread);
          setMessages(data.messages);
          setThreads((prev) => {
            const exists = prev.some((t) => t.id === data.thread.id);
            return exists ? prev : [data.thread, ...prev];
          });
          return;
        }

        if (recieverId) {
          const data = await getDmThreadMessages(recieverId);
          setActiveThread(data.thread);
          setMessages(data.messages);
          setThreads((prev) => {
            const exists = prev.some((t) => t.id === data.thread.id);
            return exists ? prev : [data.thread, ...prev];
          });
          return;
        }

        if (dmThreads.length > 0) {
          const first = dmThreads[0];
          setActiveThread(first);
          if (first.recieverId) {
            const data = await getDmThreadMessages(first.recieverId);
            setMessages(data.messages);
          } else {
            setMessages([]);
          }
        } else {
          setActiveThread(null);
          setMessages([]);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [serverId, channelId, recieverId]);

  const sendMessage = async (content: string) => {
    if (!activeThread) {
      return;
    }

    const sent = await sendMessageToThread(activeThread, content);
    setMessages((prev) => [...prev, sent]);
  };

  const editMessage = async (messageId: string, content: string) => {
    if (!activeThread) {
      return;
    }

    const updated = await updateThreadMessage(activeThread, messageId, content);
    setMessages((prev) => prev.map((message) => {
      if (message.id !== messageId) {
        return message;
      }

      return {
        ...message,
        ...updated,
        id: updated.id || message.id,
        content: updated.content || message.content,
        sender: updated.sender || message.sender,
      };
    }));
  };

  const removeMessage = async (messageId: string) => {
    if (!activeThread) {
      return;
    }

    await deleteThreadMessage(activeThread, messageId);
    setMessages((prev) => prev.filter((message) => message.id !== messageId));
  };

  return {
    threads,
    activeThread,
    messages,
    loading,
    error,
    setActiveThread,
    setMessages,
    sendMessage,
    editMessage,
    removeMessage,
  };
};

import type { ChatMessage, Thread } from '../types/chat';
import { toMessage, toThread } from '../utils/chatAdapter';
import { authFetch } from '../utils/authFetch';

export const getDmConversations = async (): Promise<Thread[]> => {
  const response = await authFetch('api/chat/dms');
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to load conversations');
  }

  return (data.conversations || []).map(toThread);
};

export const getServerThreadMessages = async (serverId: string, channelId: string): Promise<{ thread: Thread; messages: ChatMessage[] }> => {
  const response = await authFetch(`api/servers/${serverId}/textChannels/${channelId}/messages`);
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to load server messages');
  }

  const thread = toThread(data.thread || { kind: 'server', serverId, channelId, title: 'Channel' });
  const messages = (data.messages || []).map((msg: any) => toMessage(msg, thread.id));
  return { thread, messages };
};

export const getDmThreadMessages = async (recieverId: string): Promise<{ thread: Thread; messages: ChatMessage[] }> => {
  const response = await authFetch(`api/chat/dms/${recieverId}/messages`);
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to load DM messages');
  }

  const thread = toThread(data.thread || { kind: 'dm', recieverId, title: 'Direct Message' });
  const messages = (data.messages || []).map((msg: any) => toMessage(msg, thread.id));
  return { thread, messages };
};

export const sendMessageToThread = async (thread: Thread, content: string): Promise<ChatMessage> => {
  const body = JSON.stringify({ content });

  if (thread.kind === 'server' && thread.serverId && thread.channelId) {
    const response = await authFetch(`api/servers/${thread.serverId}/textChannels/${thread.channelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Failed to send server message');
    }
    return toMessage(data.message, thread.id);
  }

  if (thread.kind === 'dm' && thread.recieverId) {
    const response = await authFetch(`api/chat/dms/${thread.recieverId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Failed to send DM');
    }
    return toMessage(data.message, thread.id);
  }

  throw new Error('Thread is missing required identifiers');
};

export const updateThreadMessage = async (thread: Thread, messageId: string, content: string): Promise<ChatMessage> => {
  const body = JSON.stringify({ content });

  const normalizeUpdatedMessage = (rawMessage: any): ChatMessage => {
    const normalized = toMessage(rawMessage, thread.id);
    return {
      ...normalized,
      id: normalized.id || messageId,
      content: normalized.content || content,
      edited: true,
    };
  };

  if (thread.kind === 'server' && thread.serverId && thread.channelId) {
    const response = await authFetch(`api/servers/${thread.serverId}/textChannels/${thread.channelId}/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Failed to update server message');
    }
    return normalizeUpdatedMessage(data.message);
  }

  if (thread.kind === 'dm' && thread.recieverId) {
    const response = await authFetch(`api/chat/dms/${thread.recieverId}/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Failed to update DM message');
    }
    return normalizeUpdatedMessage(data.message);
  }

  throw new Error('Thread is missing required identifiers');
};

export const deleteThreadMessage = async (thread: Thread, messageId: string): Promise<void> => {
  if (thread.kind === 'server' && thread.serverId && thread.channelId) {
    const response = await authFetch(`api/servers/${thread.serverId}/textChannels/${thread.channelId}/messages/${messageId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Failed to delete server message');
    }
    return;
  }

  if (thread.kind === 'dm' && thread.recieverId) {
    const response = await authFetch(`api/chat/dms/${thread.recieverId}/messages/${messageId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Failed to delete DM message');
    }
    return;
  }

  throw new Error('Thread is missing required identifiers');
};

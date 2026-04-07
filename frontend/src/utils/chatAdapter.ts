import type { ChatMessage, Thread } from '../types/chat';

const toId = (value: unknown): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return String(value);
  }

  return '';
};

export const toThread = (raw: any): Thread => {
  if (!raw) {
    return {
      id: '',
      kind: 'dm',
      title: 'Unknown',
    };
  }

  const kind = raw.kind === 'server' ? 'server' : 'dm';

  return {
    id: raw.id || raw._id || '',
    kind,
    title: raw.title || raw.name || raw.username || 'Untitled',
    subtitle: raw.subtitle || '',
    serverId: toId(raw.serverId || raw.serverID),
    channelId: toId(raw.channelId || raw.channelID),
    recieverId: toId(raw.recieverId || raw.recipientId || raw.recipientID),
    avatarUrl: raw.avatarUrl || raw.profilePicture || '',
    updatedAt: raw.updatedAt || raw.createdAt || '',
    lastMessage: raw.lastMessage || '',
  };
};

export const toMessage = (raw: any, threadId: string): ChatMessage => {
  const senderId = toId(raw.userId || raw.userID || raw.senderId || raw.senderID);

  return {
    id: raw._id?.toString?.() || raw.id || '',
    threadId,
    senderId,
    content: raw.message || raw.content || '',
    createdAt: raw.createdAt || new Date().toISOString(),
    edited: Boolean(raw.edited),
    sender: raw.sender,
  };
};

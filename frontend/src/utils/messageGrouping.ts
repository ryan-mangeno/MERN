import type { ChatMessage } from '../hooks/useFriendsChat';

export interface MessageGroup {
  senderId: string;
  messages: ChatMessage[];
}

/**
 * Groups consecutive messages from the same sender
 * @param messages - Flat array of messages
 * @returns Array of message groups with consecutive messages from same sender
 */
export const groupMessagesByUser = (messages: ChatMessage[]): MessageGroup[] => {
  if (!messages || messages.length === 0) return [];

  const groups: MessageGroup[] = [];
  let currentGroup: ChatMessage[] = [];
  let currentSenderId: string | null = null;

  for (const msg of messages) {
    if (msg.senderId !== currentSenderId) {
      // New sender, save previous group if exists
      if (currentGroup.length > 0) {
        groups.push({
          senderId: currentSenderId!,
          messages: currentGroup,
        });
      }
      // Start new group
      currentSenderId = msg.senderId;
      currentGroup = [msg];
    } else {
      // Same sender, add to current group
      currentGroup.push(msg);
    }
  }

  // Don't forget the last group
  if (currentGroup.length > 0) {
    groups.push({
      senderId: currentSenderId!,
      messages: currentGroup,
    });
  }

  return groups;
};

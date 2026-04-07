import React from 'react';
import type { ChatMessage } from '../hooks/useFriendsChat';

interface MessageGroupProps {
  senderUsername: string;
  senderAvatar?: string;
  messages: ChatMessage[];
  isOwn: boolean;
}

const MessageGroup: React.FC<MessageGroupProps> = ({
  senderUsername,
  senderAvatar,
  messages,
  isOwn,
}) => {
  return (
    <div className={`message-group ${isOwn ? 'message-group-own' : 'message-group-other'}`}>
      {/* Avatar */}
      <div className="message-group-avatar">
        {senderAvatar ? (
          <img src={senderAvatar} alt={senderUsername} />
        ) : (
          <span>{(senderUsername || '?')[0]}</span>
        )}
      </div>

      {/* Messages in Group */}
      <div className="message-group-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${isOwn ? 'message-sent' : 'message-received'}`}>
            {/* Username and Time Header - only on first message */}
            {idx === 0 && (
              <div className="message-header">
                <span className="message-username">{senderUsername}</span>
                <span className="message-time">
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
            )}
            {/* Message Content */}
            <div className="message-content">{msg.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageGroup;

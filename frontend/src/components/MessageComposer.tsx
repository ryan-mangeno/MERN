import { useState } from 'react';

type MessageComposerProps = {
  disabled?: boolean;
  onSend: (content: string) => Promise<void>;
};

function MessageComposer({ disabled = false, onSend }: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || disabled || sending) {
      return;
    }

    setSending(true);
    try {
      await onSend(trimmed);
      setContent('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="message-composer">
      <button className="composer-icon-button" type="button" aria-label="Add attachment">
        +
      </button>
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void handleSend();
          }
        }}
        placeholder="Message #random"
        disabled={disabled || sending}
      />
      <div className="composer-actions">
        <button className="composer-icon-button" type="button" aria-label="Send gift">
          🎁
        </button>
        <button className="composer-icon-button" type="button" aria-label="Emoji picker">
          🙂
        </button>
        <button className="composer-send-button" onClick={handleSend} disabled={disabled || sending || !content.trim()}>
        Send
        </button>
      </div>
    </div>
  );
}

export default MessageComposer;

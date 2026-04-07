import type { Thread } from '../types/chat';

type ThreadListProps = {
  threads: Thread[];
  activeThreadId: string;
  onSelectThread: (thread: Thread) => void;
};

function ThreadList({ threads, activeThreadId, onSelectThread }: ThreadListProps) {
  return (
    <aside className="thread-list">
      <div className="thread-list-header">
        <span>Text Channels</span>
      </div>
      {threads.length === 0 && <p className="muted">No conversations yet</p>}
      {threads.map((thread) => (
        <button
          key={thread.id}
          className={`thread-item ${thread.id === activeThreadId ? 'active' : ''}`}
          onClick={() => onSelectThread(thread)}
        >
          <span className="thread-channel-icon">#</span>
          <span className="thread-title">{thread.title}</span>
          <span className="thread-subtitle">{thread.kind === 'server' ? 'Server Channel' : 'Direct Message'}</span>
        </button>
      ))}
    </aside>
  );
}

export default ThreadList;

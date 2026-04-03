import type { Thread } from '../types/chat';

type ThreadHeaderProps = {
  thread: Thread | null;
};

function ThreadHeader({ thread }: ThreadHeaderProps) {
  if (!thread) {
    return <header className="thread-header"><span className="thread-hash">#</span><span>Select a thread</span></header>;
  }

  return (
    <header className="thread-header">
      <div className="thread-header-title">
        <span className="thread-hash">#</span>
        <strong>{thread.title}</strong>
      </div>
      <div className="thread-header-actions" aria-hidden="true">
        <span>🔔</span>
        <span>📌</span>
        <span>👥</span>
      </div>
    </header>
  );
}

export default ThreadHeader;

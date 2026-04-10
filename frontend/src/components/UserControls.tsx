import { useState, useMemo } from 'react';
import './UserControls.css';
import UserControlsOverlay from './UserControlsOverlay';
import { normalizeProfilePicturePath } from '../utils/profilePictureUtils';

interface UserControlsProps {
  userId?: string;
  username?: string;
  profilePicture?: string;
}

const UserControls = ({ userId, username, profilePicture }: UserControlsProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  // Get current user data from localStorage if not provided as props
  const userData = useMemo(() => {
    if (userId && username) {
      return { userId, username, profilePicture };
    }

    try {
      const raw = localStorage.getItem('user_data');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        userId: parsed.id || parsed.userId || '',
        username: parsed.username || 'Unknown',
        profilePicture: parsed.profilePicture || '',
      };
    } catch {
      return null;
    }
  }, [userId, username, profilePicture]);

  if (!userData) return null;

  const displayPicture = normalizeProfilePicturePath(userData.profilePicture);

  return (
    <div className="user-controls">
      <div className="user-controls-left">
        <div className="user-controls-avatar">
          {displayPicture ? (
            <img src={displayPicture} alt={userData.username} />
          ) : (
            <span>{(userData.username || '?')[0]}</span>
          )}
        </div>
        <span className="user-controls-username">{userData.username}</span>
      </div>

      <div className="user-controls-buttons">
        <button
          className={`user-controls-btn user-controls-mute ${isMuted ? 'active' : ''}`}
          onClick={() => setIsMuted(!isMuted)}
          aria-label="Mute"
          title="Mute"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C10.34 3 9 4.37 9 6.07V11.93C9 13.63 10.34 15 12 15C13.66 15 15 13.63 15 11.93V6.07C15 4.37 13.66 3 12 3ZM18.5 11C18.5 11 18.5 11.93 18.5 11.93C18.5 15.23 15.86 17.93 12.5 18V21H11V18C7.64 17.93 5 15.23 5 11.93V11H6.5V11.93C6.5 14.41 8.52 16.43 11 16.43H13C15.48 16.43 17.5 14.41 17.5 11.93V11H18.5Z" />
          </svg>
        </button>

        <button
          className={`user-controls-btn user-controls-deafen ${isDeafened ? 'active' : ''}`}
          onClick={() => setIsDeafened(!isDeafened)}
          aria-label="Deafen"
          title="Deafen"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1C6.48 1 2 5.48 2 11V23h2V13h2v10h2V11C8 7.13 9.92 3.7 12.69 1.43C12.47 1.43 12.24 1.43 12 1ZM22 1C16.48 1 12 5.48 12 11V23h2V13h2v10h2V11C18 7.13 19.92 3.7 22.69 1.43C22.47 1.43 22.24 1.43 22 1Z" />
          </svg>
        </button>

        <button
          className="user-controls-btn user-controls-settings"
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
          title="Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.67 19.18 11.36 19.13 11.06L21.16 9.48C21.34 9.34 21.39 9.07 21.28 8.87L19.36 5.55C19.25 5.35 19.01 5.28 18.81 5.38L16.53 6.62C16.04 6.23 15.5 5.92 14.92 5.71L14.6 3.09C14.57 2.86 14.38 2.69 14.15 2.69H10.85C10.62 2.69 10.43 2.86 10.4 3.09L10.08 5.71C9.5 5.92 8.96 6.23 8.47 6.62L6.19 5.38C5.99 5.28 5.75 5.35 5.64 5.55L3.72 8.87C3.61 9.07 3.66 9.34 3.84 9.48L5.87 11.06C5.82 11.36 5.8 11.67 5.8 12C5.8 12.33 5.82 12.64 5.87 12.94L3.84 14.52C3.66 14.66 3.61 14.93 3.72 15.13L5.64 18.45C5.75 18.65 5.99 18.72 6.19 18.62L8.47 17.38C8.96 17.77 9.5 18.08 10.08 18.29L10.4 20.91C10.43 21.14 10.62 21.31 10.85 21.31H14.15C14.38 21.31 14.57 21.14 14.6 20.91L14.92 18.29C15.5 18.08 16.04 17.77 16.53 17.38L18.81 18.62C19.01 18.72 19.25 18.65 19.36 18.45L21.28 15.13C21.39 14.93 21.34 14.66 21.16 14.52L19.14 12.94ZM12.5 15.5C11.04 15.5 9.8 14.26 9.8 12.8C9.8 11.34 11.04 10.1 12.5 10.1C13.96 10.1 15.2 11.34 15.2 12.8C15.2 14.26 13.96 15.5 12.5 15.5Z" />
          </svg>
        </button>
      </div>

      {showSettings && <UserControlsOverlay onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default UserControls;

import './UserControlsOverlay.css';

interface UserControlsOverlayProps {
  onClose: () => void;
}

const UserControlsOverlay = ({ onClose }: UserControlsOverlayProps) => {
  return (
    <div className="user-controls-overlay" onClick={onClose}>
      <div className="user-controls-modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-controls-modal-header">
          <h2>Settings</h2>
          <button
            className="user-controls-modal-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="user-controls-modal-body">
          {/* Settings content placeholder for future use */}
        </div>
      </div>
    </div>
  );
};

export default UserControlsOverlay;

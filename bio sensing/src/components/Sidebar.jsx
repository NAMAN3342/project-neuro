import { useState } from 'react';

export default function Sidebar({ onReset, onAutoRotateChange }) {
  const [autoRotate, setAutoRotate] = useState(false);

  const handleAutoRotate = (e) => {
    const checked = e.target.checked;
    setAutoRotate(checked);
    onAutoRotateChange(checked);
  };

  return (
    <div className="sidebar">
      <div className="header">
        <h2>Model Viewer</h2>
        <div className="status-badge">Live</div>
      </div>

      <div className="controls-section">
        <h3>Model Info</h3>
        <div className="info-item">
          <span className="label">Name</span>
          <span className="value">Free Head</span>
        </div>
        <div className="info-item">
          <span className="label">Format</span>
          <span className="value">OBJ / MTL</span>
        </div>
      </div>

      <div className="controls-section">
        <h3>Controls</h3>
        <p className="instruction">Left Click: Rotate</p>
        <p className="instruction">Right Click: Pan</p>
        <p className="instruction">Scroll: Zoom</p>

        <div className="control-group">
          <label>Auto Rotate</label>
          <label className="switch">
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={handleAutoRotate}
            />
            <span className="slider round"></span>
          </label>
        </div>

        <button onClick={onReset} className="btn">
          Reset Camera
        </button>
      </div>
    </div>
  );
}

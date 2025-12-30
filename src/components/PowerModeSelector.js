import React from 'react';
import './PowerModeSelector.css';

const PowerModeSelector = ({ mode, setMode }) => {
  const modes = [
    { id: 'optimized', label: 'Power Optimized', icon: '⚡' },
    { id: 'balanced', label: 'Balanced', icon: '⚖️' },
    { id: 'performance', label: 'High Performance', icon: '🚀' }
  ];

  return (
    <div className="power-mode-selector">
      {modes.map(m => (
        <button
          key={m.id}
          className={`mode-btn ${mode === m.id ? 'active' : ''}`}
          onClick={() => setMode(m.id)}
          title={m.label}
        >
          <span className="mode-icon">{m.icon}</span>
          {mode === m.id && <span className="mode-label">{m.label}</span>}
        </button>
      ))}
    </div>
  );
};

export default PowerModeSelector;

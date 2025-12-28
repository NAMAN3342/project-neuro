import React from 'react';
import './SpectrumDisplay.css';

const SpectrumDisplay = ({ bandPowers }) => {
  const bands = [
    { name: 'Delta', key: 'delta', color: '#3498db', range: '0.5-4 Hz', description: 'Deep sleep' },
    { name: 'Theta', key: 'theta', color: '#9b59b6', range: '4-8 Hz', description: 'Drowsiness' },
    { name: 'Alpha', key: 'alpha', color: '#2ecc71', range: '8-13 Hz', description: 'Relaxed' },
    { name: 'Beta', key: 'beta', color: '#e74c3c', range: '13-30 Hz', description: 'Active thinking' }
  ];

  const getPercentage = (value) => {
    return Math.min(100, Math.max(0, value * 100));
  };

  return (
    <div className="spectrum-display">
      <h2>Current Band Powers</h2>
      <div className="bands-container">
        {bands.map(band => {
          const percentage = getPercentage(bandPowers[band.key]);
          return (
            <div key={band.key} className="band-item">
              <div className="band-header">
                <div className="band-info">
                  <span className="band-name">{band.name}</span>
                  <span className="band-range">{band.range}</span>
                </div>
                <div className="band-value">
                  {(bandPowers[band.key] * 100).toFixed(1)}%
                </div>
              </div>
              <div className="band-description">{band.description}</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${percentage}%`,
                    background: band.color
                  }}
                >
                  <div className="progress-glow"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="power-circles">
        {bands.map(band => {
          const percentage = getPercentage(bandPowers[band.key]);
          return (
            <div key={band.key} className="circle-container">
              <svg className="circle-svg" viewBox="0 0 120 120">
                <circle
                  className="circle-bg"
                  cx="60"
                  cy="60"
                  r="50"
                />
                <circle
                  className="circle-progress"
                  cx="60"
                  cy="60"
                  r="50"
                  stroke={band.color}
                  strokeDasharray={`${percentage * 3.14} 314`}
                />
              </svg>
              <div className="circle-text">
                <div className="circle-value">{percentage.toFixed(0)}%</div>
                <div className="circle-label">{band.name}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpectrumDisplay;

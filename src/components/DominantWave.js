import React from 'react';
import './DominantWave.css';

const DominantWave = ({ dominantWave, alphaPeak, bandPowers, channel }) => {
  const getWaveInfo = (wave) => {
    const info = {
      'Delta': { color: '#00d4ff', state: 'Deep Sleep / Unconscious', icon: '🌙' },
      'Theta': { color: '#aa00ff', state: 'Drowsy / Meditative', icon: '🧘' },
      'Alpha': { color: '#00ff9d', state: 'Relaxed / Eyes Closed', icon: '😌' },
      'Beta': { color: '#ff0080', state: 'Alert / Active Thinking', icon: '🧠' }
    };
    return info[wave] || { color: '#64ffda', state: 'Unknown', icon: '📊' };
  };

  const waveInfo = getWaveInfo(dominantWave);

  return (
    <div className="dominant-wave">
      <div className="channel-badge">Channel {channel}</div>
      <div className="wave-grid">
        <div className="dominant-section">
          <div className="section-label">DOMINANT FREQUENCY</div>
          <div className="dominant-display" style={{ borderColor: waveInfo.color }}>
            <span className="wave-icon">{waveInfo.icon}</span>
            <span className="wave-name" style={{ color: waveInfo.color }}>
              {dominantWave}
            </span>
          </div>
          <div className="wave-state">{waveInfo.state}</div>
        </div>

        <div className="metrics-section">
          <div className="section-label">BAND POWER METRICS</div>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">δ Delta</span>
              <span className="metric-value">{(bandPowers.delta * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">θ Theta</span>
              <span className="metric-value">{(bandPowers.theta * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">α Alpha</span>
              <span className="metric-value">{(bandPowers.alpha * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">β Beta</span>
              <span className="metric-value">{(bandPowers.beta * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="alert-section">
          <div className="section-label">DETECTION STATUS</div>
          <div className={`alpha-alert ${alphaPeak ? 'active' : ''}`}>
            <div className="alert-icon">{alphaPeak ? '👁️' : '👀'}</div>
            <div className="alert-text">
              {alphaPeak ? 'EYES CLOSED DETECTED' : 'Eyes Open'}
            </div>
            <div className="alert-detail">
              {alphaPeak 
                ? `Alpha Peak: ${(bandPowers.alpha * 100).toFixed(1)}%` 
                : 'No significant alpha activity'
              }
            </div>
          </div>
        </div>
      </div>

      <div className="info-note">
        <strong>⚠️ Electrode Placement Tips:</strong> For best alpha wave detection, place electrodes at:
        <ul style={{marginTop: '10px', marginLeft: '20px'}}>
          <li><strong>O1 or O2</strong> (occipital - back of head) - BEST for alpha</li>
          <li><strong>Pz</strong> (parietal - top-back) - Good for alpha</li>
          <li><strong>Fp1-Fp2</strong> (frontal - forehead) - Best for beta/theta, weak alpha</li>
        </ul>
        <br/>
        <strong>Why is Beta always dominant?</strong> If using Fp1-Fp2 (frontal), beta dominance is normal 
        since frontal cortex generates beta during waking state. Alpha waves are strongest at the back of 
        the head (visual cortex). <strong>Move electrodes to occipital region (O1/O2)</strong> to see 
        alpha increase when closing eyes.
      </div>
    </div>
  );
};

export default DominantWave;

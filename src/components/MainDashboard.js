import React, { useRef, useEffect, useState } from 'react';
import BrainVisualizer from './BrainVisualizer';
import SpectrumDisplay from './SpectrumDisplay';
import WaveformDisplay from './WaveformDisplay';
import StockwellSpectrogram from './StockwellSpectrogram';
import ChannelSelector from './ChannelSelector';
import PowerModeSelector from './PowerModeSelector';
import ThemeToggle from './ThemeToggle';
import InfoTooltip from './InfoTooltip';
import './MainDashboard.css';

const MainDashboard = ({
  isConnected,
  channelData,
  selectedChannel,
  setSelectedChannel,
  powerMode,
  setPowerMode,
  onConnect,
  onDisconnect,
  onTestMode,
  theme,
  toggleTheme
}) => {
  const currentChannel = channelData[`ch${selectedChannel}`];
  
  const getDominantWave = () => {
    const waves = [
      { name: 'Delta', value: currentChannel.delta, color: '#ff6b6b', emoji: '😴' },
      { name: 'Theta', value: currentChannel.theta, color: '#ffd93d', emoji: '🧘' },
      { name: 'Alpha', value: currentChannel.alpha, color: '#6bcb77', emoji: '😌' },
      { name: 'Beta', value: currentChannel.beta, color: '#4d96ff', emoji: '🎯' },
      { name: 'Gamma', value: currentChannel.gamma, color: '#9b59b6', emoji: '⚡' }
    ];
    return waves.reduce((a, b) => a.value > b.value ? a : b);
  };

  const dominant = getDominantWave();

  return (
    <div className="main-dashboard">
      
      <header className="dashboard-header">
        <div className="logo">
          <span className="logo-project">PROJECT</span>
          <span className="logo-neuro">NEURO</span>
        </div>
        
        <div className="header-controls">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          
          <PowerModeSelector mode={powerMode} setMode={setPowerMode} />
          
          {!isConnected && onTestMode && (
            <button 
              className="test-btn"
              onClick={onTestMode}
              style={{ marginRight: '10px' }}
            >
              🧪 Test Mode
            </button>
          )}
          
          <button 
            className={`connect-btn ${isConnected ? 'connected' : ''}`}
            onClick={isConnected ? onDisconnect : onConnect}
          >
            <span className="status-dot" />
            {isConnected ? 'Disconnect' : 'Connect Arduino'}
          </button>
        </div>
      </header>

      
      <div className="dashboard-content">
        
        <div className="panel brain-panel">
          <div className="panel-header">
            <h3>Neural Activity Map<InfoTooltip text="Interactive 3D visualization of brain activity. Electrode positions (O1/O2, Pz, Fp1/Fp2) show real-time signal intensity. Drag to rotate, scroll to zoom." /></h3>
            <span className="panel-badge">3D View</span>
          </div>
          <BrainVisualizer 
            channelData={channelData}
            selectedChannel={selectedChannel}
          />
        </div>

          
        <div className="panel spectrum-panel">
          <div className="panel-header">
            <h3>Frequency Spectrum<InfoTooltip text="Displays the power distribution across different frequency bands (Delta, Theta, Alpha, Beta, Gamma) using Stockwell Transform analysis." /></h3>
            <span className="panel-badge">Stockwell Transform</span>
          </div>
          
          <ChannelSelector 
            selected={selectedChannel}
            setSelected={setSelectedChannel}
            channelData={channelData}
          />
          
          <SpectrumDisplay data={currentChannel} />
          
          
          <div className="panel-header" style={{ marginTop: '15px' }}>
            <h3>Stockwell Spectrogram<InfoTooltip text="Real-time time-frequency representation showing how brain wave frequencies evolve over time. Brighter colors indicate higher power at that frequency." /></h3>
            <span className="panel-badge">Time-Frequency</span>
          </div>
          <StockwellSpectrogram 
            data={currentChannel}
            frequencies={currentChannel.frequencies}
          />
          
          
          <div className="dominant-card" style={{ borderColor: dominant.color }}>
            <div className="dominant-emoji">{dominant.emoji}</div>
            <div className="dominant-info">
              <span className="dominant-label">Dominant Wave<InfoTooltip position="top" text="The brain wave with the highest power at this moment. Delta=deep sleep, Theta=meditation, Alpha=relaxation, Beta=focus, Gamma=high cognition." /></span>
              <span className="dominant-name" style={{ color: dominant.color }}>
                {dominant.name}
              </span>
            </div>
            <div className="dominant-value" style={{ color: dominant.color }}>
              {dominant.value.toFixed(1)}%
            </div>
          </div>
        </div>

        
        <div className="panel waveform-panel">
          <div className="panel-header">
            <h3>Raw EEG Signal<InfoTooltip text="Live waveform display of the unprocessed EEG voltage signal from the selected electrode channel. Shows real-time brain electrical activity." /></h3>
            <span className="panel-badge">Channel {selectedChannel}</span>
          </div>
          <WaveformDisplay 
            data={currentChannel.raw}
            color={dominant.color}
          />
          
          
          <div className="band-powers">
            <BandPowerBar name="Delta" value={currentChannel.delta} color="#ff6b6b" />
            <BandPowerBar name="Theta" value={currentChannel.theta} color="#ffd93d" />
            <BandPowerBar name="Alpha" value={currentChannel.alpha} color="#6bcb77" />
            <BandPowerBar name="Beta" value={currentChannel.beta} color="#4d96ff" />
            <BandPowerBar name="Gamma" value={currentChannel.gamma} color="#9b59b6" />
          </div>
        </div>
      </div>

      
      <footer className="dashboard-footer">
        <div className="status-item">
          <span className="status-label">Sample Rate</span>
          <span className="status-value">256 Hz</span>
        </div>
        <div className="status-item">
          <span className="status-label">Buffer</span>
          <span className="status-value">256 samples</span>
        </div>
        <div className="status-item">
          <span className="status-label">Algorithm</span>
          <span className="status-value">Fast FFT</span>
        </div>
        <div className="status-item">
          <span className="status-label">Mode</span>
          <span className="status-value">{powerMode.charAt(0).toUpperCase() + powerMode.slice(1)}</span>
        </div>
      </footer>
    </div>
  );
};

const bandInfo = {
  Delta: 'Delta waves (0.5-4 Hz): Associated with deep sleep, healing, and regeneration. High during unconscious states.',
  Theta: 'Theta waves (4-8 Hz): Linked to meditation, creativity, and light sleep. Present during deep relaxation and REM.',
  Alpha: 'Alpha waves (8-13 Hz): Indicates calm, relaxed alertness. Prominent when eyes are closed and during mindfulness.',
  Beta: 'Beta waves (13-30 Hz): Associated with active thinking, focus, and alertness. Dominant during problem-solving.',
  Gamma: 'Gamma waves (30-100 Hz): Related to high-level cognition, perception, and consciousness. Peak during intense focus.'
};

const BandPowerBar = ({ name, value, color }) => (
  <div className="band-power-bar">
    <div className="band-info">
      <span className="band-name">{name}<InfoTooltip position="top" text={bandInfo[name]} /></span>
      <span className="band-value">{value.toFixed(1)}%</span>
    </div>
    <div className="bar-track">
      <div 
        className="bar-fill" 
        style={{ 
          width: `${value}%`,
          background: color,
          boxShadow: `0 0 10px ${color}`
        }} 
      />
    </div>
  </div>
);

export default MainDashboard;

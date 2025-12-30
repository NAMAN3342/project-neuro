import React, { useRef, useEffect, useState } from 'react';
import BrainVisualizer from './BrainVisualizer';
import SpectrumDisplay from './SpectrumDisplay';
import WaveformDisplay from './WaveformDisplay';
import StockwellSpectrogram from './StockwellSpectrogram';
import ChannelSelector from './ChannelSelector';
import PowerModeSelector from './PowerModeSelector';
import './MainDashboard.css';

const MainDashboard = ({
  isConnected,
  channelData,
  selectedChannel,
  setSelectedChannel,
  powerMode,
  setPowerMode,
  onConnect,
  onDisconnect
}) => {
  const currentChannel = channelData[`ch${selectedChannel}`];
  
  const getDominantWave = () => {
    const waves = [
      { name: 'Delta', value: currentChannel.delta, color: '#ff6b6b', emoji: '🌙' },
      { name: 'Theta', value: currentChannel.theta, color: '#ffd93d', emoji: '🧘' },
      { name: 'Alpha', value: currentChannel.alpha, color: '#6bcb77', emoji: '😌' },
      { name: 'Beta', value: currentChannel.beta, color: '#4d96ff', emoji: '🧠' },
      { name: 'Gamma', value: currentChannel.gamma, color: '#9b59b6', emoji: '⚡' }
    ];
    return waves.reduce((a, b) => a.value > b.value ? a : b);
  };

  const dominant = getDominantWave();

  return (
    <div className="main-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo">
          <span className="logo-project">PROJECT</span>
          <span className="logo-neuro">NEURO</span>
        </div>
        
        <div className="header-controls">
          <PowerModeSelector mode={powerMode} setMode={setPowerMode} />
          
          <button 
            className={`connect-btn ${isConnected ? 'connected' : ''}`}
            onClick={isConnected ? onDisconnect : onConnect}
          >
            <span className="status-dot" />
            {isConnected ? 'Disconnect' : 'Connect Arduino'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Left Panel - 3D Brain */}
        <div className="panel brain-panel">
          <div className="panel-header">
            <h3>Neural Activity Map</h3>
            <span className="panel-badge">3D View</span>
          </div>
          <BrainVisualizer 
            channelData={channelData}
            selectedChannel={selectedChannel}
          />
        </div>

        {/* Center Panel - Spectrum */}
        <div className="panel spectrum-panel">
          <div className="panel-header">
            <h3>Frequency Spectrum</h3>
            <span className="panel-badge">Stockwell Transform</span>
          </div>
          
          <ChannelSelector 
            selected={selectedChannel}
            setSelected={setSelectedChannel}
            channelData={channelData}
          />
          
          <SpectrumDisplay data={currentChannel} />
          
          {/* Stockwell Spectrogram - Real Time-Frequency Graph */}
          <div className="panel-header" style={{ marginTop: '15px' }}>
            <h3>Stockwell Spectrogram</h3>
            <span className="panel-badge">Time-Frequency</span>
          </div>
          <StockwellSpectrogram 
            data={currentChannel}
            frequencies={currentChannel.frequencies}
          />
          
          {/* Dominant Wave Card */}
          <div className="dominant-card" style={{ borderColor: dominant.color }}>
            <div className="dominant-emoji">{dominant.emoji}</div>
            <div className="dominant-info">
              <span className="dominant-label">Dominant Wave</span>
              <span className="dominant-name" style={{ color: dominant.color }}>
                {dominant.name}
              </span>
            </div>
            <div className="dominant-value" style={{ color: dominant.color }}>
              {dominant.value.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Right Panel - Waveform */}
        <div className="panel waveform-panel">
          <div className="panel-header">
            <h3>Raw EEG Signal</h3>
            <span className="panel-badge">Channel {selectedChannel}</span>
          </div>
          <WaveformDisplay 
            data={currentChannel.raw}
            color={dominant.color}
          />
          
          {/* Band Powers */}
          <div className="band-powers">
            <BandPowerBar name="Delta" value={currentChannel.delta} color="#ff6b6b" />
            <BandPowerBar name="Theta" value={currentChannel.theta} color="#ffd93d" />
            <BandPowerBar name="Alpha" value={currentChannel.alpha} color="#6bcb77" />
            <BandPowerBar name="Beta" value={currentChannel.beta} color="#4d96ff" />
            <BandPowerBar name="Gamma" value={currentChannel.gamma} color="#9b59b6" />
          </div>
        </div>
      </div>

      {/* Footer Status */}
      <footer className="dashboard-footer">
        <div className="status-item">
          <span className="status-label">Sample Rate</span>
          <span className="status-value">256 Hz</span>
        </div>
        <div className="status-item">
          <span className="status-label">Buffer</span>
          <span className="status-value">512 samples</span>
        </div>
        <div className="status-item">
          <span className="status-label">Algorithm</span>
          <span className="status-value">Stockwell Transform</span>
        </div>
        <div className="status-item">
          <span className="status-label">Mode</span>
          <span className="status-value">{powerMode.charAt(0).toUpperCase() + powerMode.slice(1)}</span>
        </div>
      </footer>
    </div>
  );
};

const BandPowerBar = ({ name, value, color }) => (
  <div className="band-power-bar">
    <div className="band-info">
      <span className="band-name">{name}</span>
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

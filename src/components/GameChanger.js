import React, { useState, useCallback, useEffect, useRef } from 'react';
import './GameChanger.css';

const GameChanger = ({ onBack }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [port, setPort] = useState(null);
  const [gameMode, setGameMode] = useState(false);
  const [channelModes, setChannelModes] = useState({
    ch0: 'EEG',
    ch1: 'EEG',
    ch2: 'EEG'
  });
  const [joystickData, setJoystickData] = useState({
    left: false,
    right: false,
    turbo: false,
    fire: false
  });
  const [statusLog, setStatusLog] = useState([]);
  const readerRef = useRef(null);
  const writerRef = useRef(null);

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setStatusLog(prev => [...prev.slice(-50), { message, type, timestamp }]);
  }, []);

  // Connect to Arduino via Web Serial
  const connectSerial = useCallback(async () => {
    try {
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 115200 });
      setPort(selectedPort);
      setIsConnected(true);
      addLog('Connected to Arduino', 'success');

      // Setup writer
      const writer = selectedPort.writable.getWriter();
      writerRef.current = writer;

      // Setup reader
      const reader = selectedPort.readable.getReader();
      readerRef.current = reader;

      let buffer = '';
      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const text = new TextDecoder().decode(value);
            buffer += text;

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              processIncomingData(line.trim());
            }
          }
        } catch (error) {
          if (error.name !== 'NetworkError') {
            console.error('Read error:', error);
          }
        }
      };

      readLoop();

    } catch (error) {
      console.error('Connection error:', error);
      addLog(`Connection failed: ${error.message}`, 'error');
    }
  }, [addLog]);

  // Process incoming joystick data
  const processIncomingData = useCallback((line) => {
    if (line.startsWith('J,')) {
      // Parse joystick data: J,L:0,R:0,T:0,F:0
      const parts = line.substring(2).split(',');
      const data = {};
      parts.forEach(part => {
        const [key, val] = part.split(':');
        if (key === 'L') data.left = val === '1';
        if (key === 'R') data.right = val === '1';
        if (key === 'T') data.turbo = val === '1';
        if (key === 'F') data.fire = val === '1';
      });
      setJoystickData(data);
    }
  }, []);

  // Send command to Arduino
  const sendCommand = useCallback(async (command) => {
    if (!writerRef.current) {
      addLog('Not connected', 'error');
      return;
    }
    try {
      const encoder = new TextEncoder();
      await writerRef.current.write(encoder.encode(command + '\n'));
      addLog(`Sent: ${command}`, 'sent');
    } catch (error) {
      addLog(`Send failed: ${error.message}`, 'error');
    }
  }, [addLog]);

  // Toggle game mode
  const toggleGameMode = useCallback(async () => {
    const newMode = !gameMode;
    await sendCommand(newMode ? 'GAME ON' : 'GAME OFF');
    setGameMode(newMode);
  }, [gameMode, sendCommand]);

  // Set channel mode
  const setChannelMode = useCallback(async (channel, mode) => {
    await sendCommand(`SET CH${channel} ${mode}`);
    setChannelModes(prev => ({
      ...prev,
      [`ch${channel}`]: mode
    }));
  }, [sendCommand]);

  // Disconnect
  const disconnect = useCallback(async () => {
    if (writerRef.current) {
      await writerRef.current.releaseLock();
      writerRef.current = null;
    }
    if (readerRef.current) {
      await readerRef.current.cancel();
      readerRef.current = null;
    }
    if (port) {
      await port.close();
      setPort(null);
    }
    setIsConnected(false);
    setGameMode(false);
    addLog('Disconnected', 'info');
  }, [port, addLog]);

  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, []);

  const signalModes = ['EEG', 'EMG', 'EOG'];
  const channelInfo = {
    ch0: { name: 'Channel 0', pin: 'A0', description: 'FP1-FP2 Frontal' },
    ch1: { name: 'Channel 1', pin: 'A1', description: 'C3-C4 Motor' },
    ch2: { name: 'Channel 2', pin: 'A2', description: 'O1-O2 Visual' }
  };

  return (
    <div className="game-changer">
      {/* Header */}
      <header className="gc-header">
        <button className="gc-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div className="gc-logo">
          <span className="logo-icon">🎮</span>
          <span className="logo-text">Game Changing Mode</span>
        </div>
        <div className="gc-status">
          <span className={`status-dot ${isConnected ? 'connected' : ''}`}></span>
          <span className="status-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="gc-content">
        {/* Left Panel - Connection & Controls */}
        <div className="gc-panel gc-connection-panel">
          <h3>Connection</h3>
          
          <div className="connection-controls">
            {!isConnected ? (
              <button className="gc-connect-btn" onClick={connectSerial}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Connect Arduino
              </button>
            ) : (
              <button className="gc-disconnect-btn" onClick={disconnect}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64M12 2v10"/>
                </svg>
                Disconnect
              </button>
            )}
          </div>

          <div className="game-mode-toggle">
            <h4>Game Mode</h4>
            <button 
              className={`game-toggle-btn ${gameMode ? 'active' : ''}`}
              onClick={toggleGameMode}
              disabled={!isConnected}
            >
              <span className="toggle-label">{gameMode ? 'ON' : 'OFF'}</span>
              <span className="toggle-indicator"></span>
            </button>
            <p className="toggle-hint">
              {gameMode 
                ? 'Joystick output enabled - EMG signals mapped to game controls' 
                : 'Normal EEG streaming mode'}
            </p>
          </div>
        </div>

        {/* Center Panel - Channel Configuration */}
        <div className="gc-panel gc-channels-panel">
          <h3>Channel Configuration</h3>
          <p className="panel-hint">Select signal type for each channel</p>

          <div className="channel-grid">
            {Object.entries(channelInfo).map(([ch, info]) => (
              <div key={ch} className="channel-config-card">
                <div className="channel-header">
                  <span className="channel-name">{info.name}</span>
                  <span className="channel-pin">{info.pin}</span>
                </div>
                <span className="channel-desc">{info.description}</span>
                
                <div className="mode-buttons">
                  {signalModes.map(mode => (
                    <button
                      key={mode}
                      className={`mode-btn ${channelModes[ch] === mode ? 'active' : ''} mode-${mode.toLowerCase()}`}
                      onClick={() => setChannelMode(ch.slice(2), mode)}
                      disabled={!isConnected}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mode-legend">
            <div className="legend-item">
              <span className="legend-color eeg"></span>
              <span>EEG - Brain Waves (0.5-50Hz)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color emg"></span>
              <span>EMG - Muscle Activity (20-500Hz)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color eog"></span>
              <span>EOG - Eye Movement (0.5-30Hz)</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Joystick Visualization & Log */}
        <div className="gc-panel gc-joystick-panel">
          <h3>Game Controller Output</h3>
          
          {gameMode && isConnected ? (
            <div className="joystick-display">
              <div className="joystick-visual">
                <div className={`joy-btn joy-left ${joystickData.left ? 'active' : ''}`}>
                  <span>◀</span>
                  <label>LEFT</label>
                </div>
                <div className={`joy-btn joy-right ${joystickData.right ? 'active' : ''}`}>
                  <span>▶</span>
                  <label>RIGHT</label>
                </div>
                <div className={`joy-btn joy-turbo ${joystickData.turbo ? 'active' : ''}`}>
                  <span>⚡</span>
                  <label>TURBO</label>
                </div>
                <div className={`joy-btn joy-fire ${joystickData.fire ? 'active' : ''}`}>
                  <span>🔥</span>
                  <label>FIRE</label>
                </div>
              </div>
              <p className="joystick-hint">
                Control mapping:<br/>
                CH1 &gt; 120 = LEFT | CH2 &gt; 120 = RIGHT<br/>
                CH1+CH2 = TURBO | CH0 &gt; 100 = FIRE
              </p>
            </div>
          ) : (
            <div className="joystick-inactive">
              <span className="inactive-icon">🎮</span>
              <p>{!isConnected ? 'Connect to Arduino first' : 'Enable Game Mode to see joystick output'}</p>
            </div>
          )}

          <div className="status-log">
            <h4>Status Log</h4>
            <div className="log-container">
              {statusLog.map((log, i) => (
                <div key={i} className={`log-entry ${log.type}`}>
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-msg">{log.message}</span>
                </div>
              ))}
              {statusLog.length === 0 && (
                <div className="log-empty">No activity yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="gc-footer">
        <span>Web Serial API • Arduino Communication • Real-time BCI Gaming</span>
      </footer>
    </div>
  );
};

export default GameChanger;

import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import FrequencySpectrum from './components/FrequencySpectrum';
import WaveChart from './components/WaveChart';
import DominantWave from './components/DominantWave';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(1);
  const [channelData, setChannelData] = useState({
    1: { delta: 0, theta: 0, alpha: 0, beta: 0 },
    2: { delta: 0, theta: 0, alpha: 0, beta: 0 },
    3: { delta: 0, theta: 0, alpha: 0, beta: 0 }
  });
  const [history, setHistory] = useState({
    1: { delta: [], theta: [], alpha: [], beta: [] },
    2: { delta: [], theta: [], alpha: [], beta: [] },
    3: { delta: [], theta: [], alpha: [], beta: [] }
  });
  const [dominantWaves, setDominantWaves] = useState({
    1: '', 2: '', 3: ''
  });
  const [alphaPeaks, setAlphaPeaks] = useState({
    1: false, 2: false, 3: false
  });
  const [error, setError] = useState('');
  
  const portRef = useRef(null);
  const readerRef = useRef(null);
  const maxHistoryLength = 100;

  const connectToArduino = async () => {
    try {
      // Check if Web Serial API is supported
      if (!('serial' in navigator)) {
        setError('Web Serial API not supported. Use Chrome, Edge, or Opera.');
        return;
      }

      // Request port
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });

      portRef.current = port;
      setIsConnected(true);
      setError('');

      // Read data
      readData(port);
    } catch (err) {
      setError(`Connection failed: ${err.message}`);
      console.error('Error:', err);
    }
  };

  const disconnect = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
      setIsConnected(false);
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  const readData = async (port) => {
    const textDecoder = new TextDecoderStream();
    port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader;

    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        lines.forEach(line => {
          parseLine(line.trim());
        });
      }
    } catch (err) {
      console.error('Read error:', err);
      setError(`Read error: ${err.message}`);
    } finally {
      reader.releaseLock();
    }
  };

  const parseLine = (line) => {
    // Expected format: "CH1 D:0.xxx T:0.xxx A:0.xxx B:0.xxx | CH2 D:0.xxx T:0.xxx A:0.xxx B:0.xxx | CH3 D:0.xxx T:0.xxx A:0.xxx B:0.xxx |"
    
    // Split by channel
    const channels = line.split('|').filter(ch => ch.trim());
    
    channels.forEach(channelStr => {
      const chMatch = channelStr.match(/CH(\d+)/);
      if (!chMatch) return;
      
      const chNum = parseInt(chMatch[1]);
      if (chNum < 1 || chNum > 3) return;
      
      const deltaMatch = channelStr.match(/D:([\d.]+)/);
      const thetaMatch = channelStr.match(/T:([\d.]+)/);
      const alphaMatch = channelStr.match(/A:([\d.]+)/);
      const betaMatch = channelStr.match(/B:([\d.]+)/);

      if (deltaMatch && thetaMatch && alphaMatch && betaMatch) {
        const newData = {
          delta: parseFloat(deltaMatch[1]),
          theta: parseFloat(thetaMatch[1]),
          alpha: parseFloat(alphaMatch[1]),
          beta: parseFloat(betaMatch[1])
        };

        // Update channel data
        setChannelData(prev => ({
          ...prev,
          [chNum]: newData
        }));

        // Detect dominant wave for this channel
        const max = Math.max(newData.delta, newData.theta, newData.alpha, newData.beta);
        let dominant = '';
        if (max === newData.delta) dominant = 'Delta';
        else if (max === newData.theta) dominant = 'Theta';
        else if (max === newData.alpha) dominant = 'Alpha';
        else if (max === newData.beta) dominant = 'Beta';

        setDominantWaves(prev => ({
          ...prev,
          [chNum]: dominant
        }));

        // Detect alpha peak (eyes closed)
        const hasAlphaPeak = newData.alpha > 0.25 || (newData.alpha > 0.20 && max === newData.alpha);
        setAlphaPeaks(prev => ({
          ...prev,
          [chNum]: hasAlphaPeak
        }));

        // Update history for this channel
        setHistory(prev => ({
          ...prev,
          [chNum]: {
            delta: [...prev[chNum].delta.slice(-maxHistoryLength + 1), newData.delta],
            theta: [...prev[chNum].theta.slice(-maxHistoryLength + 1), newData.theta],
            alpha: [...prev[chNum].alpha.slice(-maxHistoryLength + 1), newData.alpha],
            beta: [...prev[chNum].beta.slice(-maxHistoryLength + 1), newData.beta]
          }
        }));
      }
    });
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>⚡ 3-Channel EEG Spectrum Analyzer</h1>
        <p className="subtitle">Neural Oscillation Monitoring System - Multi-Channel</p>
      </header>

      <div className="container">
        <div className="control-panel">
          {!isConnected ? (
            <button onClick={connectToArduino} className="connect-btn">
              Connect to Arduino
            </button>
          ) : (
            <button onClick={disconnect} className="disconnect-btn">
              Disconnect
            </button>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="status">
            Status: <span className={isConnected ? 'connected' : 'disconnected'}>
              {isConnected ? '● Connected' : '○ Disconnected'}
            </span>
          </div>

          {isConnected && (
            <div className="channel-selector">
              <div className="selector-label">Select Channel:</div>
              <div className="channel-buttons">
                {[1, 2, 3].map(ch => (
                  <button 
                    key={ch}
                    className={`channel-btn ${selectedChannel === ch ? 'active' : ''}`}
                    onClick={() => setSelectedChannel(ch)}
                  >
                    Channel {ch}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {isConnected && (
          <>
            <div className="channel-info">
              <h3>Viewing Channel {selectedChannel}</h3>
              <div className="all-channels-status">
                {[1, 2, 3].map(ch => (
                  <div key={ch} className="mini-status">
                    <strong>CH{ch}:</strong> {dominantWaves[ch] || 'N/A'} 
                    {alphaPeaks[ch] && ' 👁️'}
                  </div>
                ))}
              </div>
            </div>

            <DominantWave 
              dominantWave={dominantWaves[selectedChannel]} 
              alphaPeak={alphaPeaks[selectedChannel]}
              bandPowers={channelData[selectedChannel]}
              channel={selectedChannel}
            />
            <FrequencySpectrum 
              bandPowers={channelData[selectedChannel]} 
              channel={selectedChannel}
            />
            <WaveChart 
              history={history[selectedChannel]}
              channel={selectedChannel}
            />
          </>
        )}

        {!isConnected && (
          <div className="instructions">
            <h3>Instructions:</h3>
            <ol>
              <li>Upload the 3-channel Arduino code to your board</li>
              <li>Connect EEG sensors to pins A0, A1, and A2</li>
              <li>Click "Connect to Arduino" above</li>
              <li>Select your Arduino's COM port</li>
              <li>Switch between channels to view different electrode data!</li>
            </ol>
            <p className="note">
              <strong>Note:</strong> This app requires a browser that supports Web Serial API 
              (Chrome, Edge, or Opera). Make sure to use HTTPS or localhost.
            </p>
            <div className="channel-placement">
              <h4>Recommended Electrode Placements:</h4>
              <ul>
                <li><strong>Channel 1 (A0):</strong> O1 or O2 (Occipital - back of head) - Alpha detection</li>
                <li><strong>Channel 2 (A1):</strong> Pz (Parietal - top center) - Mixed activity</li>
                <li><strong>Channel 3 (A2):</strong> Fp1 or Fp2 (Frontal - forehead) - Beta/Theta</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

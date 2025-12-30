import React, { useState, useEffect, useCallback, useRef } from 'react';
import LoadingScreen from './components/LoadingScreen';
import MainDashboard from './components/MainDashboard';
import { StockwellProcessor } from './utils/StockwellTransform';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [port, setPort] = useState(null);
  const [channelData, setChannelData] = useState({
    ch1: { raw: [], delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 },
    ch2: { raw: [], delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 },
    ch3: { raw: [], delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 }
  });
  const [selectedChannel, setSelectedChannel] = useState(1);
  const [powerMode, setPowerMode] = useState('optimized'); // 'optimized', 'performance', 'balanced'
  
  const readerRef = useRef(null);
  const processorRef = useRef(null);
  const rawBufferRef = useRef({ ch1: [], ch2: [], ch3: [] });
  const SAMPLE_RATE = 256; // Hz
  const BUFFER_SIZE = 512; // samples for Stockwell Transform

  useEffect(() => {
    // Initialize Stockwell Processor
    processorRef.current = new StockwellProcessor(SAMPLE_RATE, BUFFER_SIZE);
    
    // Loading animation duration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, []);

  const connectToArduino = useCallback(async () => {
    try {
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 115200 });
      setPort(selectedPort);
      setIsConnected(true);
      
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
              processRawData(line.trim());
            }
          }
        } catch (error) {
          console.error('Read error:', error);
        }
      };
      
      readLoop();
      
    } catch (error) {
      console.error('Connection error:', error);
    }
  }, []);

  const processRawData = useCallback((line) => {
    // Expected format: ch1,ch2,ch3 (floats)
    const parts = line.split(',');
    if (parts.length !== 3) return;
    
    const ch1Val = parseFloat(parts[0]);
    const ch2Val = parseFloat(parts[1]);
    const ch3Val = parseFloat(parts[2]);
    
    if (isNaN(ch1Val) || isNaN(ch2Val) || isNaN(ch3Val)) return;
    
    // Add to buffers
    rawBufferRef.current.ch1.push(ch1Val);
    rawBufferRef.current.ch2.push(ch2Val);
    rawBufferRef.current.ch3.push(ch3Val);
    
    // Keep buffer size limited
    if (rawBufferRef.current.ch1.length > BUFFER_SIZE) {
      rawBufferRef.current.ch1.shift();
      rawBufferRef.current.ch2.shift();
      rawBufferRef.current.ch3.shift();
    }
    
    // Process with Stockwell Transform when we have enough samples
    if (rawBufferRef.current.ch1.length >= BUFFER_SIZE && processorRef.current) {
      const results = {
        ch1: processorRef.current.analyze(rawBufferRef.current.ch1, powerMode),
        ch2: processorRef.current.analyze(rawBufferRef.current.ch2, powerMode),
        ch3: processorRef.current.analyze(rawBufferRef.current.ch3, powerMode)
      };
      
      setChannelData({
        ch1: { raw: [...rawBufferRef.current.ch1], ...results.ch1 },
        ch2: { raw: [...rawBufferRef.current.ch2], ...results.ch2 },
        ch3: { raw: [...rawBufferRef.current.ch3], ...results.ch3 }
      });
    }
  }, [powerMode]);

  const disconnect = useCallback(async () => {
    if (readerRef.current) {
      await readerRef.current.cancel();
      readerRef.current = null;
    }
    if (port) {
      await port.close();
      setPort(null);
    }
    setIsConnected(false);
  }, [port]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="app">
      <MainDashboard
        isConnected={isConnected}
        channelData={channelData}
        selectedChannel={selectedChannel}
        setSelectedChannel={setSelectedChannel}
        powerMode={powerMode}
        setPowerMode={setPowerMode}
        onConnect={connectToArduino}
        onDisconnect={disconnect}
      />
    </div>
  );
}

export default App;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import LoadingScreen from './components/LoadingScreen';
import MainDashboard from './components/MainDashboard';
import { StockwellProcessor } from './utils/StockwellTransform';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [port, setPort] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [channelData, setChannelData] = useState({
    ch1: { raw: [], delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 },
    ch2: { raw: [], delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 },
    ch3: { raw: [], delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 }
  });
  const [selectedChannel, setSelectedChannel] = useState(1);
  const [powerMode, setPowerMode] = useState('optimized');
  
  const readerRef = useRef(null);
  const processorRef = useRef(null);
  const rawBufferRef = useRef({ ch1: [], ch2: [], ch3: [] });
  const lastAnalysisTime = useRef(0);
  const SAMPLE_RATE = 256;
  const BUFFER_SIZE = 256; // Reduced from 512 for faster response
  const ANALYSIS_INTERVAL = 100; // Analyze every 100ms

  useEffect(() => {
    
    processorRef.current = new StockwellProcessor(SAMPLE_RATE, BUFFER_SIZE);
    
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }, [theme]);

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
    // Skip joystick/game mode data
    if (line.startsWith('J,')) return;
    
    const parts = line.split(',');
    // Arduino sends: sig0,sig1,sig2,t1,t2,t3,t4,t5 (8 values, we need first 3)
    if (parts.length < 3) return;
    
    const ch1Val = parseFloat(parts[0]);
    const ch2Val = parseFloat(parts[1]);
    const ch3Val = parseFloat(parts[2]);
    
    if (isNaN(ch1Val) || isNaN(ch2Val) || isNaN(ch3Val)) return;
    
    
    rawBufferRef.current.ch1.push(ch1Val);
    rawBufferRef.current.ch2.push(ch2Val);
    rawBufferRef.current.ch3.push(ch3Val);
    
    
    if (rawBufferRef.current.ch1.length > BUFFER_SIZE) {
      rawBufferRef.current.ch1.shift();
      rawBufferRef.current.ch2.shift();
      rawBufferRef.current.ch3.shift();
    }
    
    
    if (rawBufferRef.current.ch1.length >= BUFFER_SIZE && processorRef.current) {
      const now = Date.now();
      if (now - lastAnalysisTime.current < ANALYSIS_INTERVAL) return;
      lastAnalysisTime.current = now;
      
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

  const startTestMode = useCallback(() => {
    setIsConnected(true);
    const testInterval = setInterval(() => {
      const t = Date.now();
      const ch1Val = 512 + Math.sin(t * 0.01) * 50 + Math.random() * 20;
      const ch2Val = 512 + Math.cos(t * 0.008) * 45 + Math.random() * 20;
      const ch3Val = 512 + Math.sin(t * 0.012) * 40 + Math.random() * 20;
      processRawData(`${ch1Val.toFixed(2)},${ch2Val.toFixed(2)},${ch3Val.toFixed(2)}`);
    }, 1000 / SAMPLE_RATE);
    window.testInterval = testInterval;
  }, [processRawData, SAMPLE_RATE]);

  const stopTestMode = useCallback(() => {
    if (window.testInterval) {
      clearInterval(window.testInterval);
      window.testInterval = null;
    }
    setIsConnected(false);
    rawBufferRef.current = { ch1: [], ch2: [], ch3: [] };
  }, []);

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
        onDisconnect={port ? disconnect : stopTestMode}
        onTestMode={startTestMode}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </div>
  );
}

export default App;

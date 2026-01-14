import { useRef, useState, useEffect } from 'react';
import ModelViewer from './components/ModelViewer';
import ControlPanel from './components/ControlPanel';
import BioWellnessPanel from './components/BioWellnessPanel';
import BioWellnessWidget from './components/BioWellnessWidget';
import SerialManager from './utils/SerialManager';
import SimulationMode from './utils/SimulationMode';
import AnalyticsManager from './utils/AnalyticsManager';
import SignalProcessor from './utils/SignalProcessor';
import './App.css';

function App() {
  const electrodesRef = useRef();
  const [isConnected, setIsConnected] = useState(false);
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [signalData, setSignalData] = useState({ ch0: 0, ch1: 0, ch2: 0 });
  const [temperatureData, setTemperatureData] = useState({ t1: 0, t2: 0, t3: 0, t4: 0, t5: 0 });
  const [intensities, setIntensities] = useState({ ch0: 0, ch1: 0, ch2: 0 });
  const [analytics, setAnalytics] = useState({
    state: 'Unknown',
    predictions: {},
    fatigueIndex: 0,
    safety_copilot: { status: 'alert', alertness: 100 },
  });

  const lastAnalyticsUpdate = useRef(0);

  /* 
     REFS FOR ANALYTICS 
     We use refs to access the latest data inside the event listeners (which are optimized 
     to run in a closure with empty dependencies) without triggering re-renders or 
     needing to re-bind listeners constantly.
  */
  const signalDataRef = useRef(signalData);
  const temperatureDataRef = useRef(temperatureData);

  // Helper to run analytics (throttled)
  const processAnalytics = (currentSignalData) => {
    // Add new samples to Signal Processor
    SignalProcessor.addSample(
      currentSignalData.ch0,
      currentSignalData.ch1,
      currentSignalData.ch2
    );

    // Throttle analytics updates to ~10Hz (every 100ms) to prevent UI lag
    const now = Date.now();
    if (!lastAnalyticsUpdate.current || now - lastAnalyticsUpdate.current > 100) {
      // Get real brain activity from FFT (spectral power)
      const brainActivity = SignalProcessor.getBrainActivity();

      const results = AnalyticsManager.process(
        currentSignalData,
        temperatureDataRef.current, // Use ref to get latest temp without closure staleness
        brainActivity
      );

      setAnalytics(results);
      lastAnalyticsUpdate.current = now;
    }
  };

  // Handle Arduino Serial connection
  const handleConnect = async () => {
    console.log("Connecting to Arduino via Web Serial API...");
    try {
      await SerialManager.connect();
      // Connection status will be updated via event listener
    } catch (error) {
      console.error("Failed to connect to Arduino:", error);
      alert(`Connection failed: ${error.message}\n\nMake sure you're using Chrome/Edge and Arduino is connected.`);
    }
  };

  const handleDisconnect = async () => {
    await SerialManager.disconnect();
    setIsConnected(false);
  };

  // Handle testing mode toggle
  const handleTestingModeToggle = (enabled) => {
    if (enabled) {
      // Disconnect Server if connected
      if (isConnected) {
        handleDisconnect();
      }

      SimulationMode.start();
      setIsTestingMode(true);
    } else {
      SimulationMode.stop();
      setIsTestingMode(false);
    }
  };

  // Filters for signal cleaning
  const filtersRef = useRef({});

  // Initialize filters once
  useEffect(() => {
    // Dynamic import to break dependency cycle if any
    import('./utils/EEGProcessor').then(module => {
      const EEGProcessor = module.default;
      filtersRef.current = {
        ch0: new EEGProcessor(256), // Sample Rate 256Hz based on Arduino code
        ch1: new EEGProcessor(256),
        ch2: new EEGProcessor(256)
      };
    });
  }, []);

  // Setup event listeners
  useEffect(() => {
    // WebSocket Manager listeners
    const handleSignalData = (data) => {
      // 1. FILTERING STEP
      // Apply digital filters (Bandpass + Notch) to raw data
      let processedData = { ...data };
      if (filtersRef.current.ch0) {
        processedData.ch0 = filtersRef.current.ch0.process(data.ch0);
        processedData.ch1 = filtersRef.current.ch1.process(data.ch1);
        processedData.ch2 = filtersRef.current.ch2.process(data.ch2);
      }

      setSignalData(processedData);
      signalDataRef.current = processedData; // Keep ref in sync

      // Update electrode controller
      if (electrodesRef.current) {
        const electrodeController = electrodesRef.current.getElectrodeController();
        if (electrodeController) {
          electrodeController.updateSignals(processedData);
        }
      }

      // Run analytics directly from the data stream
      processAnalytics(processedData);
    };

    const handleTemperatureData = (data) => {
      setTemperatureData(data);
      temperatureDataRef.current = data; // Keep ref in sync

      // Update thermal controller
      if (electrodesRef.current) {
        const thermalController = electrodesRef.current.getThermalController();
        if (thermalController) {
          thermalController.updateTemperatures(data);
        }
      }
    };

    const handleConnectionChange = (status) => {
      setIsConnected(status.connected);
    };

    const handleErrorData = (error) => {
      console.error('Serial Error:', error.message);
    };

    // Register SerialManager listeners
    SerialManager.on('signal', handleSignalData);
    SerialManager.on('temperature', handleTemperatureData);
    SerialManager.on('connection', handleConnectionChange);
    SerialManager.on('error', handleErrorData);

    // Simulation Mode listeners
    SimulationMode.on('signal', handleSignalData);
    SimulationMode.on('temperature', handleTemperatureData);

    // Don't auto-connect - wait for user to click "Connect Arduino" button

    // Cleanup
    return () => {
      SerialManager.off('signal', handleSignalData);
      SerialManager.off('temperature', handleTemperatureData);
      SerialManager.off('connection', handleConnectionChange);
      SerialManager.off('error', handleErrorData);

      SimulationMode.off('signal', handleSignalData);
      SimulationMode.off('temperature', handleTemperatureData);

      // Reset controllers and data when both are inactive
      if (!isConnected && !isTestingMode) {
        if (electrodesRef.current?.electrodeController) {
          electrodesRef.current.electrodeController.reset();
        }
        if (electrodesRef.current?.thermalController) {
          electrodesRef.current.thermalController.reset();
        }
        // Clear signal and temperature data
        setSignalData({ ch0: 0, ch1: 0, ch2: 0 });
        setTemperatureData({ t1: 0, t2: 0, t3: 0, t4: 0, t5: 0 });
      }
    };
  }, []);

  // Reset controllers and data when both connection and testing mode are inactive
  useEffect(() => {
    if (!isConnected && !isTestingMode) {
      // Small delay to ensure cleanup happens after state updates
      const resetTimer = setTimeout(() => {
        if (electrodesRef.current?.electrodeController) {
          electrodesRef.current.electrodeController.reset();
        }
        if (electrodesRef.current?.thermalController) {
          electrodesRef.current.thermalController.reset();
        }
        // Clear signal and temperature data
        setSignalData({ ch0: 0, ch1: 0, ch2: 0 });
        setTemperatureData({ t1: 0, t2: 0, t3: 0, t4: 0, t5: 0 });
      }, 100);

      return () => clearTimeout(resetTimer);
    }
  }, [isConnected, isTestingMode]);

  // Update intensities display
  useEffect(() => {
    const interval = setInterval(() => {
      if (electrodesRef.current) {
        const electrodeController = electrodesRef.current.getElectrodeController();
        if (electrodeController) {
          setIntensities(electrodeController.getIntensities());
        }
      }
    }, 100); // Update 10 times per second

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <ModelViewer electrodesRef={electrodesRef} isConnected={isConnected || isTestingMode} />
      <ControlPanel
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onTestingModeToggle={handleTestingModeToggle}
        isConnected={isConnected}
        isTestingMode={isTestingMode}
        signalData={signalData}
        temperatureData={temperatureData}
        intensities={intensities}
        analytics={analytics}
      />

      <BioWellnessPanel
        analytics={analytics}
        isConnected={isConnected || isTestingMode}
      />

      <BioWellnessWidget 
        analytics={analytics}
        isConnected={isConnected || isTestingMode}
      />
    </div>
  );
}

export default App;

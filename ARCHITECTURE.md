# 📊 System Architecture Diagram

> **Confidentiality Note**: This diagram represents the high-level logical flow of the Project Neuro platform. Detailed schematics of the analog front-end (AFE) and the specific coefficients of the digital filter chain are proprietary and not disclosed in this repository.

## Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        HARDWARE LAYER                            │
└─────────────────────────────────────────────────────────────────┘

    Electrode CH1 (O1/O2)  →  A0  ┐
    Electrode CH2 (Pz)     →  A1  ├─→  Arduino Uno/Nano
    Electrode CH3 (Fp1/Fp2)→  A2  ┘
    
    Sample Rate: 256 Hz
    Baud Rate: 115200

                    ↓

┌─────────────────────────────────────────────────────────────────┐
│                    ARDUINO PROCESSING                            │
└─────────────────────────────────────────────────────────────────┘

    FOR EACH CHANNEL (CH1, CH2, CH3):
    
    Raw ADC Value (0-1023)
           ↓
    [PROPRIETARY PRE-PROCESSING BLOCK]
    (DC Removal + Noise Suppression + Artifact Rejection)
           ↓
    Serial Output:
    "float, float, float"

                    ↓

┌─────────────────────────────────────────────────────────────────┐
│                   WEB SERIAL API (Browser)                       │
└─────────────────────────────────────────────────────────────────┘

    Serial Port Connection (USB)
           ↓
    TextDecoderStream
           ↓
    Line Buffer (split by \n)

                    ↓

┌─────────────────────────────────────────────────────────────────┐
│                    REACT APP PARSING                             │
└─────────────────────────────────────────────────────────────────┘

    Parse Line:
    "CH1 D:0.250 T:0.200 A:0.350 B:0.200 | ..."
           ↓
    Split by "|"
           ↓
    Extract Channel Number (1, 2, or 3)
           ↓
    Regex Parse: D:xxx, T:xxx, A:xxx, B:xxx
           ↓
    Update State:
    channelData[1] = { delta, theta, alpha, beta }
    channelData[2] = { delta, theta, alpha, beta }
    channelData[3] = { delta, theta, alpha, beta }
           ↓
    Detect Dominant Wave per Channel
           ↓
    Detect Alpha Peak per Channel
           ↓
    Update History (last 100 samples)

                    ↓

┌─────────────────────────────────────────────────────────────────┐
│                      UI COMPONENTS                               │
└─────────────────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────┐
    │  Channel Selector (App.js)             │
    │  [Channel 1] [Channel 2] [Channel 3]   │
    │  User selects: selectedChannel = 1     │
    └────────────────────────────────────────┘
                    ↓
    ┌────────────────────────────────────────┐
    │  DominantWave Component                │
    │  - Shows dominant wave for selected ch │
    │  - Alpha peak indicator 👁️            │
    │  - Band power metrics                  │
    │  Input: channelData[selectedChannel]   │
    └────────────────────────────────────────┘
                    ↓
    ┌────────────────────────────────────────┐
    │  FrequencySpectrum Component           │
    │  - Bar chart of 4 bands                │
    │  - Canvas rendering with glow effects  │
    │  Input: channelData[selectedChannel]   │
    └────────────────────────────────────────┘
                    ↓
    ┌────────────────────────────────────────┐
    │  WaveChart Component                   │
    │  - Time-series line chart              │
    │  - Last 100 samples                    │
    │  Input: history[selectedChannel]       │
    └────────────────────────────────────────┘
```

## Component Hierarchy

```
App
 ├─ Header
 ├─ Control Panel
 │   ├─ Connect Button
 │   ├─ Status Display
 │   └─ Channel Selector
 │       ├─ [Channel 1 Button]
 │       ├─ [Channel 2 Button]
 │       └─ [Channel 3 Button]
 ├─ Channel Info
 │   └─ All Channels Mini-Status
 ├─ DominantWave Component
 │   ├─ Channel Badge
 │   ├─ Dominant Frequency Display
 │   ├─ Band Power Metrics Grid
 │   └─ Detection Status (Eyes Closed)
 ├─ FrequencySpectrum Component
 │   ├─ Canvas Chart (Bar Graph)
 │   └─ Spectrum Info (Sample rate, etc)
 └─ WaveChart Component
     ├─ Canvas Chart (Line Graph)
     └─ Chart Legend
```

## State Management

```javascript
// Main App State Structure

{
  // Connection Status
  isConnected: boolean,
  error: string,
  
  // Channel Selection
  selectedChannel: 1 | 2 | 3,
  
  // Current Band Powers (3 channels)
  channelData: {
    1: { delta: 0.25, theta: 0.20, alpha: 0.35, beta: 0.20 },
    2: { delta: 0.30, theta: 0.25, alpha: 0.25, beta: 0.20 },
    3: { delta: 0.15, theta: 0.20, alpha: 0.15, beta: 0.50 }
  },
  
  // Historical Data (100 samples per band per channel)
  history: {
    1: {
      delta: [0.24, 0.25, 0.26, ...],
      theta: [0.19, 0.20, 0.21, ...],
      alpha: [0.34, 0.35, 0.36, ...],
      beta: [0.19, 0.20, 0.19, ...]
    },
    2: { delta: [...], theta: [...], alpha: [...], beta: [...] },
    3: { delta: [...], theta: [...], alpha: [...], beta: [...] }
  },
  
  // Dominant Wave Detection (per channel)
  dominantWaves: {
    1: 'Alpha',
    2: 'Delta',
    3: 'Beta'
  },
  
  // Alpha Peak Detection (per channel)
  alphaPeaks: {
    1: true,   // Eyes closed detected
    2: false,
    3: false
  }
}
```

## Data Flow Timeline

```
Time: 0ms
  Arduino: Read analog pins A0, A1, A2
  
Time: 1ms
  Arduino: Process filters for all 3 channels
  
Time: 2ms
  Arduino: Send serial data (one line with all 3 channels)
  
Time: 3ms
  Browser: Receive serial data via Web Serial API
  
Time: 4ms
  React: Parse line, extract all 3 channels
  
Time: 5ms
  React: Update state for all 3 channels
  
Time: 6ms
  React: Re-render components (only for selected channel)
  
Time: 7.8ms (1/128 Hz)
  → REPEAT
```

## Filter Coefficients (Arduino)

```
Band    | Cutoff | Coefficient | Speed
─────────────────────────────────────────
Delta   | 0.5-4  | 0.01        | Slowest  ████░░░░░░
Theta   | 4-8    | 0.03, 0.01  | Slow     ████████░░
Alpha   | 8-13   | 0.07, 0.03  | Medium   ████████████░░
Beta    | 13-30  | 0.15, 0.07  | Fast     ████████████████
```

## Performance Metrics

```
Arduino Processing:
  - Analog Read: ~100 µs per channel
  - Filter Processing: ~50 µs per channel
  - Total per sample: ~500 µs (0.5 ms)
  - Sample period: 7.8 ms (128 Hz)
  - CPU usage: ~6%

Serial Communication:
  - Baud rate: 115200 bps
  - Bytes per line: ~100 bytes
  - Lines per second: 128
  - Data rate: ~12.8 KB/s

React Rendering:
  - State updates: 128 Hz
  - Component re-renders: 128 Hz (only selected channel)
  - Canvas redraws: 60 Hz (throttled by browser)
  - Memory usage: ~50 MB
```

## Channel Comparison Matrix

```
┌──────────┬─────────────┬─────────────┬─────────────┐
│ Feature  │  Channel 1  │  Channel 2  │  Channel 3  │
├──────────┼─────────────┼─────────────┼─────────────┤
│ Location │ Occipital   │ Parietal    │ Frontal     │
│ Position │ O1/O2       │ Pz          │ Fp1/Fp2     │
│ Pin      │ A0          │ A1          │ A2          │
│ Best For │ Alpha       │ Theta/Alpha │ Beta        │
│ Eyes     │ High impact │ Some impact │ Low impact  │
│ Focus    │ Low impact  │ Some impact │ High impact │
│ Sleep    │ High delta  │ High delta  │ High delta  │
└──────────┴─────────────┴─────────────┴─────────────┘
```

## Typical Band Distribution by Channel

```
EYES OPEN (Alert):

Channel 1 (Occipital):     Channel 2 (Parietal):      Channel 3 (Frontal):
Delta: 10% ████            Delta: 10% ████             Delta: 10% ████
Theta: 20% ████████        Theta: 25% ██████████      Theta: 15% ██████
Alpha: 20% ████████        Alpha: 25% ██████████      Alpha: 10% ████
Beta:  50% ████████████████Beta:  40% ████████████████Beta:  65% ██████████████████

EYES CLOSED (Relaxed):

Channel 1 (Occipital):     Channel 2 (Parietal):      Channel 3 (Frontal):
Delta: 5%  ██              Delta: 10% ████             Delta: 10% ████
Theta: 15% ██████          Theta: 20% ████████        Theta: 20% ████████
Alpha: 60% ████████████████Alpha: 50% ████████████████Alpha: 30% ████████████
Beta:  20% ████████        Beta:  20% ████████        Beta:  40% ████████████████
```

## Error Handling Flow

```
┌─────────────────────┐
│  Serial Connection  │
└─────────────────────┘
          ↓
    Connection Fails?
          ↓
    ┌─────┴─────┐
    │ YES       │ NO
    ↓           ↓
 Show Error   Connected
 Message      ↓
              Parse Data
              ↓
          Parse Fails?
              ↓
         ┌────┴────┐
         │ YES     │ NO
         ↓         ↓
    Log Error  Update State
    Continue   ↓
               Render UI
```

## Browser Compatibility Check

```javascript
// Web Serial API Detection
if ('serial' in navigator) {
  ✅ Chrome/Edge/Opera - Supported
} else {
  ❌ Firefox/Safari - Not Supported
  → Show error message
}
```

## Memory Layout (Approximate)

```
React App Memory Usage:
├─ Component State:        ~10 KB
│  ├─ channelData:         ~1 KB
│  ├─ history (3ch×100):   ~8 KB
│  └─ other state:         ~1 KB
├─ Canvas Buffers:         ~20 KB
│  ├─ FrequencySpectrum:   ~10 KB
│  └─ WaveChart:           ~10 KB
└─ React Framework:        ~20 MB
                          ────────
Total:                    ~20 MB
```

## File Size Summary

```
arduino_3channel_eeg.ino    ~4 KB
App.js                      ~6 KB
DominantWave.js            ~3 KB
FrequencySpectrum.js       ~5 KB
WaveChart.js               ~3 KB
CSS files (total)          ~8 KB
Documentation (total)     ~50 KB
                          ──────
Source code total:        ~80 KB
```

---

This diagram shows the complete architecture from hardware to UI rendering! 🚀

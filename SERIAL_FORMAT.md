# Arduino Serial Output Format

## Expected Output Format

The Arduino sends data in this exact format every sample (at 128 Hz):

```
CH1 D:0.250 T:0.200 A:0.350 B:0.200 | CH2 D:0.300 T:0.250 A:0.250 B:0.200 | CH3 D:0.150 T:0.200 A:0.150 B:0.500 | 
```

## Format Breakdown

### Structure:
```
CH[N] D:[value] T:[value] A:[value] B:[value] | 
```

Where:
- `CH[N]` = Channel number (1, 2, or 3)
- `D:` = Delta band power (normalized 0-1)
- `T:` = Theta band power (normalized 0-1)
- `A:` = Alpha band power (normalized 0-1)
- `B:` = Beta band power (normalized 0-1)
- `|` = Channel separator

### Important Notes:
- All values are normalized (sum to ~1.0 per channel)
- Values are formatted with 3 decimal places
- Each line contains all 3 channels
- Lines are separated by newline (`\n`)
- Sampling rate: 128 Hz (128 lines per second)

## Example Serial Monitor Output

```
3-Channel EEG RMS Band Power Started
CH1 D:0.245 T:0.198 A:0.367 B:0.190 | CH2 D:0.289 T:0.234 A:0.267 B:0.210 | CH3 D:0.156 T:0.189 A:0.134 B:0.521 | 
CH1 D:0.247 T:0.201 A:0.362 B:0.190 | CH2 D:0.291 T:0.236 A:0.263 B:0.210 | CH3 D:0.158 T:0.192 A:0.132 B:0.518 | 
CH1 D:0.249 T:0.203 A:0.358 B:0.190 | CH2 D:0.293 T:0.238 A:0.259 B:0.210 | CH3 D:0.160 T:0.195 A:0.130 B:0.515 | 
...
```

## Parsing in React App

The React app parses this format using regex:

```javascript
// Split by channel separator
const channels = line.split('|').filter(ch => ch.trim());

channels.forEach(channelStr => {
  // Extract channel number
  const chMatch = channelStr.match(/CH(\d+)/);
  const chNum = parseInt(chMatch[1]); // 1, 2, or 3
  
  // Extract band powers
  const deltaMatch = channelStr.match(/D:([\d.]+)/);
  const thetaMatch = channelStr.match(/T:([\d.]+)/);
  const alphaMatch = channelStr.match(/A:([\d.]+)/);
  const betaMatch = channelStr.match(/B:([\d.]+)/);
  
  // Parse as floats
  const delta = parseFloat(deltaMatch[1]);
  const theta = parseFloat(thetaMatch[1]);
  const alpha = parseFloat(alphaMatch[1]);
  const beta = parseFloat(betaMatch[1]);
});
```

## Verifying Your Arduino Output

### Open Serial Monitor:
1. Arduino IDE → Tools → Serial Monitor
2. Set baud rate to **115200**
3. You should see the format above

### Check for Issues:

❌ **Wrong Format:**
```
D:0.250 T:0.200 A:0.350 B:0.200  // Missing CH1
```

❌ **Missing Separator:**
```
CH1 D:0.250 T:0.200 A:0.350 B:0.200 CH2 ...  // Missing |
```

✅ **Correct Format:**
```
CH1 D:0.250 T:0.200 A:0.350 B:0.200 | CH2 D:0.300 T:0.250 A:0.250 B:0.200 | CH3 D:0.150 T:0.200 A:0.150 B:0.500 | 
```

## Timing

- **Sample Rate**: 128 Hz
- **Sample Period**: 7.8125 ms (1000/128)
- **Data Rate**: ~100 bytes per line × 128 Hz = ~12.8 KB/s

The Arduino uses `micros()` for precise timing:

```cpp
if (micros() - lastMicros >= 1000000 / SAMPLE_RATE) {
    lastMicros = micros();
    // Read and process all channels
}
```

## Band Power Ranges

### Normal Resting State (Eyes Open):
- Delta: 0.05 - 0.15 (5-15%)
- Theta: 0.15 - 0.30 (15-30%)
- Alpha: 0.10 - 0.25 (10-25%)
- Beta: 0.30 - 0.60 (30-60%)

### Eyes Closed (Occipital Electrode):
- Delta: 0.05 - 0.10 (5-10%)
- Theta: 0.10 - 0.25 (10-25%)
- Alpha: 0.40 - 0.70 (40-70%) ⬆️ Increases
- Beta: 0.10 - 0.30 (10-30%) ⬇️ Decreases

### Deep Meditation:
- Delta: 0.10 - 0.20 (10-20%)
- Theta: 0.40 - 0.60 (40-60%) ⬆️ Increases
- Alpha: 0.20 - 0.40 (20-40%)
- Beta: 0.05 - 0.20 (5-20%) ⬇️ Decreases

## Debugging Tips

### If Web App Not Receiving Data:

1. **Check Serial Monitor First**
   - Open Arduino Serial Monitor
   - Verify format matches exactly
   - Confirm 115200 baud rate

2. **Check Browser Console (F12)**
   - Look for parsing errors
   - Verify lines are being received

3. **Test Parse Function**
   - Copy a line from Serial Monitor
   - Use browser console to test parsing

4. **Common Issues**
   - Extra spaces in format
   - Missing pipe separators
   - Wrong channel numbers (must be 1-3)
   - Values not normalized (should sum to ~1.0)

## Filter Tuning

The filter coefficients in the Arduino code determine band separation:

```cpp
// Delta: 0.5-4 Hz (very slow)
float deltaFilter(int ch, float x) {
  deltaY[ch] += 0.01 * (x - deltaY[ch]);  // Low coefficient = slow
  return deltaY[ch];
}

// Theta: 4-8 Hz (slow)
float thetaFilter(int ch, float x) {
  thetaY1[ch] += 0.03 * (x - thetaY1[ch]);
  thetaY2[ch] += 0.01 * (thetaY1[ch] - thetaY2[ch]);
  return thetaY2[ch];
}

// Alpha: 8-13 Hz (medium)
float alphaFilter(int ch, float x) {
  alphaY1[ch] += 0.07 * (x - alphaY1[ch]);
  alphaY2[ch] += 0.03 * (alphaY1[ch] - alphaY2[ch]);
  return alphaY2[ch];
}

// Beta: 13-30 Hz (fast)
float betaFilter(int ch, float x) {
  betaY1[ch] += 0.15 * (x - betaY1[ch]);  // High coefficient = fast
  betaY2[ch] += 0.07 * (betaY1[ch] - betaY2[ch]);
  return betaY2[ch];
}
```

These are simple IIR filters optimized for speed on Arduino.

---

**Need Help?** Check the [SETUP_GUIDE.md](SETUP_GUIDE.md) for complete setup instructions.

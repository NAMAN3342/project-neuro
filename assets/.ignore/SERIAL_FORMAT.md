# Device Serial Output Format

> **Note**: The data stream described below is the output of our proprietary signal conditioning pipeline. The raw sensor data undergoes significant on-chip processing before transmission to ensure signal fidelity.

## Expected Output Format

The device sends raw filtered EEG data in CSV format every sample (at 256 Hz):

```
[ch1_float],[ch2_float],[ch3_float]
```

## Format Breakdown

- `ch1_float`: Channel 1 filtered EEG value (float)
- `ch2_float`: Channel 2 filtered EEG value (float)
- `ch3_float`: Channel 3 filtered EEG value (float)
- Separator: Comma (`,`)
- Terminator: Newline (`\n`)

### Example Serial Monitor Output

```
123.45,67.89,-12.34
125.67,65.43,-10.21
...
```

## Parsing in React App

The React app parses this format by splitting the string by comma:

```javascript
const parts = line.split(',');
const ch1Val = parseFloat(parts[0]);
const ch2Val = parseFloat(parts[1]);
const ch3Val = parseFloat(parts[2]);
```

## Configuration
- Baud Rate: 115200
- Sample Rate: 256 Hz

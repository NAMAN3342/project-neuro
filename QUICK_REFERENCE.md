# 🚀 Quick Reference Card

> **Prototype Reference**: This card provides quick commands for the **Project Neuro Prototype**. Commercial API endpoints and hardware pinouts differ.

## Start the App

```bash
npm start
```

Browser opens to: `http://localhost:3000`

## Hardware Connections

```
Input 1 → Channel 1 (Occipital - O1/O2)  ← Alpha detection
Input 2 → Channel 2 (Parietal - Pz)      ← Mixed activity  
Input 3 → Channel 3 (Frontal - Fp1/Fp2)  ← Beta/focus
```

## Expected Serial Output

```
CH1 D:0.xxx T:0.xxx A:0.xxx B:0.xxx | CH2 D:0.xxx T:0.xxx A:0.xxx B:0.xxx | CH3 D:0.xxx T:0.xxx A:0.xxx B:0.xxx |
```

## Usage Flow

1. **Flash** firmware to MCU
2. **Connect** electrodes to head
3. **Run** `npm start`
4. **Click** "Connect to Device"
5. **Select** COM port
6. **Switch** between channels with buttons
7. **Test** by closing eyes (CH1 alpha should increase)

## Quick Tests

### Test Alpha (Channel 1):
- Eyes open → Low alpha (10-25%)
- Eyes closed → High alpha (40-70%) 👁️

### Test Beta (Channel 3):
- Relaxed → Low beta (10-30%)
- Mental math → High beta (40-60%)

### Test Theta (Channel 2):
- Alert → Low theta (10-20%)
- Drowsy → High theta (40-60%)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No connection | Close Arduino Serial Monitor |
| No data | Check Serial Monitor format |
| No alpha peak | Use occipital electrode (O1/O2) |
| Beta always high | Normal for frontal electrodes |
| Channel not updating | Check Arduino pin connection |

## Brain Wave Bands

| Band | Frequency | State | Icon |
|------|-----------|-------|------|
| **Delta** | 0.5-4 Hz | Deep sleep | 🌙 |
| **Theta** | 4-8 Hz | Meditation | 🧘 |
| **Alpha** | 8-13 Hz | Relaxed | 😌 |
| **Beta** | 13-30 Hz | Active | 🧠 |

## Channel Buttons

```
┌──────────┬──────────┬──────────┐
│Channel 1 │Channel 2 │Channel 3 │
│ (Alpha)  │ (Mixed)  │  (Beta)  │
└──────────┴──────────┴──────────┘
```

## Key Files

- `arduino_3channel_eeg.ino` - Arduino code
- `UPDATE_SUMMARY.md` - What changed
- `SETUP_GUIDE.md` - Full setup instructions
- `SERIAL_FORMAT.md` - Technical specs

## Browser Support

✅ Chrome 89+
✅ Edge 89+  
✅ Opera 75+
❌ Firefox (no Web Serial API)
❌ Safari (no Web Serial API)

## Quick Electrode Guide

```
    Top View of Head
    
       FRONT
    ┌─────────┐
    │  Fp1 Fp2│ ← Frontal (CH3 - Beta)
    │         │
    │    Pz   │ ← Parietal (CH2 - Mixed)
    │         │
    │  O1  O2 │ ← Occipital (CH1 - Alpha)
    └─────────┘
       BACK
```

## Sample Rates

- **Arduino**: 128 Hz (128 samples/sec)
- **Serial**: 115200 baud
- **React**: Real-time updates

## Common Commands

```bash
# Start dev server
npm start

# Build for production
npm run build

# Test Arduino (Serial Monitor)
Ctrl+Shift+M in Arduino IDE
Set baud: 115200
```

## Safety

⚠️ Educational use only
⚠️ Not a medical device
⚠️ Consult professional for medical advice

---

**Need more help?** Read [UPDATE_SUMMARY.md](UPDATE_SUMMARY.md) or [SETUP_GUIDE.md](SETUP_GUIDE.md)

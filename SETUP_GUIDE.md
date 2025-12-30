# Quick Setup Guide - 3-Channel EEG

> **Research Prototype Notice**: This guide is intended for setting up the **Project Neuro Hardware Prototype**. The commercial version of the headband features a unified PCB design and does not require manual wiring.

## Step 1: Hardware Setup

### Materials Needed:
- Arduino board (Uno/Nano/Mega)
- 3x EEG sensors/amplifiers (Custom or Compatible Modules)
- 6x EEG electrodes (3 active + 3 reference)
- Conductive gel
- USB cable

### Connections:
```
Arduino Pin  →  EEG Sensor
─────────────────────────────
A0           →  Channel 1 (Occipital - O1/O2)
A1           →  Channel 2 (Parietal - Pz)
A2           →  Channel 3 (Frontal - Fp1/Fp2)
GND          →  All sensor grounds
```

## Step 2: Electrode Placement

### Recommended 10-20 System Positions:

**Channel 1 - Occipital (Best for Alpha):**
- Active: O1 or O2 (back of head, above neck)
- Reference: Earlobe (A1/A2) or mastoid bone
- Purpose: Detect alpha waves (eyes closed)

**Channel 2 - Parietal (Mixed Activity):**
- Active: Pz (top-center of head)
- Reference: Earlobe or mastoid
- Purpose: General brain activity, meditation

**Channel 3 - Frontal (Beta/Theta):**
- Active: Fp1 or Fp2 (forehead, above eyebrow)
- Reference: Earlobe or mastoid
- Purpose: Active thinking, focus, emotion

### Electrode Application Tips:
1. Clean skin with alcohol wipe
2. Apply small amount of conductive gel to electrode
3. Part hair (if necessary) to reach scalp
4. Press electrode firmly against skin
5. Secure with medical tape or headband
6. Check impedance - should be < 10kΩ

## Step 3: Arduino Upload

1. Open Arduino IDE
2. Load `arduino_3channel_eeg.ino`
3. Select your board type (Tools → Board)
4. Select COM port (Tools → Port)
5. Upload code (Ctrl+U or Upload button)
6. Open Serial Monitor (Ctrl+Shift+M) to verify output
7. You should see: "3-Channel EEG RMS Band Power Started"
8. Data format: `CH1 D:0.xxx T:0.xxx A:0.xxx B:0.xxx | CH2... | CH3... |`

## Step 4: Web App Setup

### First Time Setup:
```bash
cd "c:\projects\project neuro"
npm install
npm start
```

### Subsequent Runs:
```bash
npm start
```

Browser will open to `http://localhost:3000`

## Step 5: Connect & Test

1. Click **"Connect to Arduino"** button
2. Select your Arduino's COM port from popup
3. Wait for connection (status shows ● Connected)
4. You should see all 3 channels updating

### Testing Each Channel:

**Test Channel 1 (Occipital - Alpha Detection):**
1. Click "Channel 1" button
2. Keep eyes open - note beta/theta levels
3. Close eyes and relax for 10 seconds
4. Alpha should increase significantly (green bar)
5. Eyes closed indicator 👁️ should appear

**Test Channel 2 (Parietal - General Activity):**
1. Click "Channel 2" button
2. Try meditation breathing
3. Observe theta/alpha activity

**Test Channel 3 (Frontal - Beta Activity):**
1. Click "Channel 3" button
2. Do mental math (count backwards from 100 by 7s)
3. Beta should increase (pink bar)
4. Relax and beta should decrease

## Step 6: Interpret Results

### Healthy Patterns:

**Eyes Open (Alert State):**
- Low alpha (< 20%)
- Moderate to high beta (30-50%)
- Some theta (10-30%)
- Low delta (< 10%)

**Eyes Closed (Relaxed):**
- High alpha (40-60%) especially in occipital
- Lower beta (10-30%)
- Some theta (20-30%)
- Low delta (< 10%)

**Deep Relaxation/Meditation:**
- High theta (40-60%)
- Moderate alpha (20-40%)
- Low beta (< 20%)

### Understanding Channel Differences:

- **Occipital (CH1)**: Most sensitive to eyes open/closed
- **Parietal (CH2)**: General relaxation state
- **Frontal (CH3)**: Cognitive load, attention, emotion

## Troubleshooting

### Poor Signal Quality:
- ✅ Add more conductive gel
- ✅ Clean skin better (alcohol wipe)
- ✅ Check electrode-skin contact
- ✅ Reduce muscle tension (relax jaw/forehead)
- ✅ Move away from electrical interference

### Channel Not Working:
- ✅ Check Arduino wiring to that pin (A0/A1/A2)
- ✅ Verify sensor is powered
- ✅ Test electrode impedance
- ✅ Try different electrode position

### No Alpha When Closing Eyes:
- ✅ Make sure using occipital electrode (O1/O2)
- ✅ Frontal electrodes won't show much alpha
- ✅ Keep eyes closed for 10-15 seconds
- ✅ Relax completely, don't think
- ✅ Try darkening the room

### Data Too Noisy:
- ✅ Ground reference electrode properly
- ✅ Avoid 60Hz power line interference (move away from outlets)
- ✅ Relax muscles (major source of noise)
- ✅ Use shielded cables
- ✅ Ensure good skin contact

## Advanced Tips

### Optimizing Each Channel:

**For Alpha Detection (CH1 - Occipital):**
- Use O1 or O2 position
- Reference to opposite earlobe
- Close eyes in dark room
- Listen to calm music

**For Meditation Monitoring (CH2 - Parietal):**
- Use Pz or P3/P4 position
- Good for theta detection
- Monitor during meditation practice

**For Cognitive Load (CH3 - Frontal):**
- Use Fp1 or Fp2 position
- Beta increases with mental work
- Theta increases with drowsiness

### Multi-Channel Analysis:

Compare channels simultaneously:
- Occipital alpha high + Frontal beta low = Deeply relaxed
- All channels high beta = Stressed/anxious
- Frontal theta high + Occipital alpha low = Drowsy
- All balanced = Alert but calm

## Safety Notes

⚠️ **IMPORTANT:**
- This is for educational/research purposes only
- Not a medical device
- Do not use if you have epilepsy without supervision
- Do not apply electrodes near eyes
- Do not use while driving or operating machinery
- Consult a professional for medical diagnoses

## Resources

- [10-20 System Guide](https://en.wikipedia.org/wiki/10%E2%80%9320_system_(EEG))
- [EEG Band Frequencies](https://en.wikipedia.org/wiki/Electroencephalography)
- [Electrode Impedance Testing](https://www.google.com/search?q=eeg+electrode+impedance)

## Need Help?

Check the main [README.md](README.md) for more detailed information and troubleshooting.

---

**Happy Brain Hacking! 🧠⚡**

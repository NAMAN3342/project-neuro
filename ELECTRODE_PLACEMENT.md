# EEG Electrode Placement Guide

> **Prototype Note**: This guide details manual electrode placement for the **Project Neuro Hardware Prototype**. The final commercial headset features a fixed-array design that automatically aligns with these 10-20 system coordinates.

## International 10-20 System

### For Alpha Wave Detection (8-13 Hz) - Eyes Closed Response

**BEST Placements:**
1. **O1 or O2** (Occipital)
   - Location: Back of head, above the neck
   - Why: Visual cortex - strongest alpha rhythm
   - Use: Alpha detection, relaxation monitoring

2. **Pz** (Parietal Central)
   - Location: Top-back of head (middle)
   - Why: Strong alpha, good general EEG
   - Use: Multi-band monitoring

### Your Current Setup: Fp1-Fp2 (Frontal)

**Problem:** Frontal regions produce **weak alpha waves**

**What Fp1-Fp2 detects well:**
- ✅ Beta waves (13-30 Hz) - Concentration, active thinking
- ✅ Theta waves (4-8 Hz) - Drowsiness, creativity
- ✅ Delta waves (0.5-4 Hz) - Deep sleep
- ❌ Alpha waves (8-13 Hz) - WEAK in frontal region

**Why you see beta dominance:** 
- Frontal cortex is always active during waking state
- Frontal areas generate beta during:
  - Attention
  - Problem solving
  - Eye movements
  - Any cognitive activity

## Recommended Electrode Configurations

### Configuration 1: Alpha Detection (RECOMMENDED)
```
Active Electrode 1: O1 (left occipital)
Active Electrode 2: O2 (right occipital)
Reference: A1 or A2 (earlobe) or Fpz (forehead)
Ground: Fpz (forehead) or mastoid
```

### Configuration 2: General EEG Monitoring
```
Active Electrode: Pz (parietal)
Reference: A1 or A2 (earlobe)
Ground: Fpz (forehead)
```

### Configuration 3: Your Current Setup
```
Active Electrode 1: Fp1 (left frontal)
Active Electrode 2: Fp2 (right frontal)
Differential: Fp1-Fp2
```
**Best for:** Beta/Theta detection, NOT alpha

## How to Find Electrode Positions

### O1/O2 (Occipital - for ALPHA):
1. Find the inion (bony bump at base of skull)
2. Move up about 2-3 cm
3. O1 = left side, O2 = right side
4. Above hairline at back of head

### Pz (Parietal):
1. Find the middle top-back of head
2. Between top and back
3. About 7-8 cm from top of head

### Fp1/Fp2 (Frontal - your current):
1. On forehead
2. About 3-4 cm above eyebrows
3. Fp1 = left, Fp2 = right

## Expected Results

### With O1-O2 (Occipital):
- Eyes Open: Beta ~30%, Alpha ~25%, Theta ~25%, Delta ~20%
- **Eyes Closed: Alpha ~40-50%** ✅ (you'll see the peak!)

### With Fp1-Fp2 (Frontal):
- Eyes Open: Beta ~40-50%, Alpha ~15%, Theta ~20%, Delta ~15%
- **Eyes Closed: Beta ~35%, Alpha ~20-25%** ❌ (weak alpha response)

## AC Interference (50/60 Hz)

If you see constant high readings or rhythmic patterns:

**Common sources:**
- Power lines (50/60 Hz)
- Computer/laptop power supplies
- LED lights
- Poor electrode contact

**Solutions:**
1. Use shielded cables
2. Keep wires twisted together
3. Improve electrode contact (use gel)
4. Ground yourself properly
5. Move away from AC power sources
6. Battery power the Arduino if possible

## Signal Quality Checklist

✅ Good signal:
- Smooth baseline
- Clear changes when opening/closing eyes
- Values don't jump erratically
- Alpha increases by 50-100% when eyes close (if using O1/O2)

❌ Poor signal:
- Values jump randomly
- No change between eyes open/closed
- Constant 50/60 Hz oscillation visible
- One band always 80-90%

## Troubleshooting

**Problem:** Beta always dominant
- **Solution:** Move electrodes from frontal (Fp1/Fp2) to occipital (O1/O2)

**Problem:** No change when closing eyes
- **Check:** Electrode placement (should be occipital for alpha)
- **Check:** Electrode contact (use gel)
- **Check:** Reference electrode connection

**Problem:** Erratic values
- **Check:** AC interference
- **Check:** Loose connections
- **Check:** Poor skin contact

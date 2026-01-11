# EEG Electrode Placement Guide

> **Prototype Note**: This guide details manual electrode placement for the **Project Neuro Hardware Prototype**. The final commercial headset features a fixed-array design that automatically aligns with these 10-20 system coordinates.

## International 10-20 System

The 10-20 system is an internationally recognized method to describe the location of scalp electrodes.

### Standard Positions

1. **O1/O2** (Occipital)
   - Location: Back of head, above the neck
   
2. **Pz** (Parietal Central)
   - Location: Top-back of head (middle)

3. **Fp1/Fp2** (Frontal)
   - Location: Forehead, above eyebrows

## Recommended Electrode Configurations

### Configuration A: Posterior
```
Active Electrode 1: O1 (left occipital)
Active Electrode 2: O2 (right occipital)
Reference: A1 or A2 (earlobe)
Ground: Fpz (forehead)
```

### Configuration B: Central
```
Active Electrode: Pz (parietal)
Reference: A1 or A2 (earlobe)
Ground: Fpz (forehead)
```

### Configuration C: Anterior
```
Active Electrode 1: Fp1 (left frontal)
Active Electrode 2: Fp2 (right frontal)
Reference: A1 or A2 (earlobe)
Ground: Fpz (forehead)
```

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
6. Battery power the device if possible

## Signal Quality Checklist

✅ Good signal:
- Smooth baseline
- Clear changes when opening/closing eyes
- Values don't jump erratically

❌ Poor signal:
- Values jump randomly
- No change between eyes open/closed
- Constant 50/60 Hz oscillation visible

## Troubleshooting

**Problem:** No change when closing eyes
- **Check:** Electrode placement
- **Check:** Electrode contact (use gel)
- **Check:** Reference electrode connection

**Problem:** Erratic values
- **Check:** AC interference
- **Check:** Loose connections
- **Check:** Poor skin contact

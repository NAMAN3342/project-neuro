# 🎮 Project Neuro: BCI Gaming Interface (Application 1)

<div align="center">

![Gaming BCI](https://img.shields.io/badge/Application-Gaming-red?style=for-the-badge)
![Signals](https://img.shields.io/badge/Signals-EEG%20%2B%20EMG%20%2B%20EOG-orange?style=for-the-badge)
![Latency](https://img.shields.io/badge/Latency-Ultra--Low-green?style=for-the-badge)

**A revolutionary hybrid interface combining Brain (EEG), Muscle (EMG), and Eye (EOG) signals to enable hands-free control for everything from casual gaming to competitive FPS.**

</div>

---

## 🎯 Overview

The Gaming Application of Project Neuro pushes the boundaries of Human-Computer Interaction (HCI). By repositioning the 3-channel electrode array, we transform the headband into a multi-modal controller capable of detecting:
1.  **Gaze Direction (EOG)**: For camera control and aiming.
2.  **Facial Gestures (EMG)**: For triggers, jumping, and reloading.
3.  **Focus Levels (EEG)**: For dynamic difficulty adjustment and "bullet time" mechanics.

## 🛠️ Hardware Configuration

### Electrode Placement Strategy
To enable this hybrid control, the standard EEG placement is modified:
- **Channel 1 (EOG - Horizontal)**: Placed near the outer canthi of the eyes to detect lateral eye movements (aiming left/right).
- **Channel 2 (EMG - Jaw/Temporal)**: Placed over the temporalis muscle to detect jaw clenches (shooting/action).
- **Channel 3 (EEG - Frontal/Parietal)**: Placed at Fz or Pz to monitor concentration (Alpha/Beta ratio) for "Focus Mode".

### Signal Processing Pipeline
The system distinguishes these signals based on amplitude and frequency characteristics:
- **EOG**: High amplitude, low frequency (< 10Hz).
- **EMG**: High amplitude, high frequency burst (> 20Hz).
- **EEG**: Low amplitude, rhythmic (8-30Hz).

## 🕹️ Supported Gaming Modes

### 1. FPS Mode (First Person Shooter)
- **Aiming**: Head tracking (gyroscope) + Fine tuning via EOG (eye movement).
- **Shooting**: Jaw clench (EMG).
- **Reload**: Double blink (EOG).
- **Focus Ability**: High concentration (High Beta waves) triggers in-game slow-motion.

### 2. Accessibility Mode
- Full computer control for users with limited mobility.
- Mouse cursor control via eye movement.
- Clicks via facial gestures.

### 3. Immersive Horror
- Game difficulty scales with your fear level (detected via sudden Beta spikes and EMG tension).

## 🚀 Getting Started

1.  **Flash Firmware**: Upload `firmware/gaming_mode.ino` to your board.
2.  **Position Headband**: Follow the [Gaming Electrode Guide](ELECTRODE_PLACEMENT.md#gaming).
3.  **Calibrate**: Run the calibration suite to set your EOG/EMG thresholds.
4.  **Launch**: Start the Project Neuro Overlay to map signals to virtual keypresses.

## 🔮 Future Roadmap
- Direct integration with Unity/Unreal Engine SDKs.
- Machine Learning model to predict movement intent before muscle activation.

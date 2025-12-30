# 🧠 Project Neuro: Emotion & Mental Health Monitor (Application 2)

<div align="center">

![Health Monitor](https://img.shields.io/badge/Application-Mental_Health-blue?style=for-the-badge)
![AI Powered](https://img.shields.io/badge/AI-Deep_Learning-purple?style=for-the-badge)
![Sensors](https://img.shields.io/badge/Sensors-EEG%20%2B%20Thermal-red?style=for-the-badge)

**An AI-driven mental health companion that combines neural oscillations with physiological biomarkers to track stress, emotion, and sleep quality.**

</div>

---

## 🎯 Overview

This application focuses on the **quantified self** and **mental wellbeing**. By augmenting the standard EEG headband with a thermal sensor, we create a powerful tool for detecting emotional states and physiological stress. This module relies heavily on Artificial Intelligence to interpret complex biological data over time.

## 🔬 Advanced Sensing

### The Sensor Fusion Approach
We combine two distinct data streams to increase prediction accuracy:
1.  **EEG (Brainwaves)**:
    *   **Frontal Asymmetry**: Alpha wave difference between left/right hemispheres (Valence detection).
    *   **Beta/Theta Ratio**: Cognitive load and stress indicator.
2.  **Thermal Sensing (Skin Temperature)**:
    *   Peripheral skin temperature correlates inversely with stress (vasoconstriction).
    *   Circadian rhythm tracking for sleep analysis.

## 🤖 AI & Machine Learning Core

This application utilizes a dedicated AI pipeline:

### 1. Emotion Detection Engine
- **Model**: CNN-LSTM Hybrid.
- **Input**: Spectrograms of 3-channel EEG + Temperature scalar.
- **Output**: 2D Valence-Arousal mapping (Happy, Sad, Stressed, Calm).

### 2. Stress & Burnout Tracker
- Long-term tracking of Cortisol levels (inferred via chronic Beta dominance and low peripheral temp).
- Alerts user to take breaks or practice breathing exercises when thresholds are crossed.

### 3. Sleep Disorder Analysis
- **Hypnogram Generation**: Automated staging of sleep (REM, NREM, Awake).
- **Apnea Detection**: Correlating movement artifacts with oxygen desaturation patterns (if SpO2 module attached).

## � Confidentiality & Research Note

**This module utilizes proprietary AI models for emotion and stress quantification.**

The correlation between physiological biomarkers (EEG + Thermal) and psychological states is a complex, active field of research. Our "Sensor Fusion" algorithm represents a unique, low-compute approach to this problem.

To protect the integrity of our research and preventing premature commercialization of our specific methodology:
*   **Model Weights**: The pre-trained CNN-LSTM models and the specific architecture details are **confidential**.
*   **Data Pipeline**: The preprocessing steps used to clean and normalize the thermal/EEG data fusion are proprietary.
*   **Research Impact**: We are sharing the *results* and *capabilities* of this system to demonstrate the potential of AI-driven mental health monitoring on accessible hardware.

## �📊 Dashboard Features

- **Real-time "Inner Weather"**: Visual representation of current emotional state.
- **Stress Accumulation Graph**: Daily load tracking.
- **Sleep Quality Score**: Breakdown of sleep cycles and efficiency.
- **Meditation Assistant**: Biofeedback cues based on Alpha/Theta coherence.

## ⚠️ Medical Disclaimer
*This device is for research and wellness purposes only. It is not a medical device and should not be used to diagnose or treat any medical condition.*

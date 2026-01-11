# 🧠 Project Neuro: Modular BCI Headband Platform

---
> Note: This video is AI-generated for demonstration purposes.


https://github.com/user-attachments/assets/6c533493-7d1e-49d6-85fe-12a71d5d21ea


---

## Project Objective

Project Neuro is a modular Brain Computer Interface (BCI) platform that can record and process real time signals from your brain (EEG), muscles (EMG), and eyes (EOG).

Our objective is to close the gap between costly research equipment and inexpensive, subpar consumer devices. Through the use of a custom 3-channel headband and sophisticated signal processing (the Stockwell Transform) directly in a web browser, we enable users to control devices hands free for example, by blinking to scroll a webpage and visualize their mental state (such as focus or relaxation) with extreme precision. In the end, we are creating a "universal controller" for the human body.

---
> Scroll Down too see the working of this Device and Architecture

https://github.com/user-attachments/assets/7b157b8a-8b34-4283-852f-1ad7a49e62b4

---

## Innovations

**Stockwell Transform (Beyond FFT)**
We used the S-Transform, in contrast to conventional BCIs that lose time data. This enables us to precisely visualize when brain states change by capturing transient neural events (such as 200 ms Alpha bursts) with time frequency resolution.

**Zero-Install Web Architecture**
We used Web Serial to transfer the whole BCI pipeline to the browser. A clinical-grade dashboard can be accessed by simply plugging in the USB and opening a URL; no drivers, Python scripts, or complex software are needed.

**Hybrid Multi-Modal Sensing**
Our modular architecture simultaneously processes EEG (Brain), EOG (Eye), and EMG (Muscle) signals in addition to reading brain waves. Complex inputs, such as our "Auto Scroller" that separates blinks from brain activity, are made possible by this fusion.

**Real-Time DSP Chain**
Using readily available, inexpensive hardware, we designed a unique digital filter chain (DC removal, Notch, Motion damping) that achieves sub-10 ms latency and research grade signal fidelity, making it fast enough for real-time gaming.

---

## Prerequisites

Before starting Project Neuro, we required a solid baseline in three distinct fields:

* **Embedded Systems & Electronics Circuit Theory:** Understanding instrumentation amplifiers like the INA128 or AD620, differential signaling, and Common Mode Rejection Ratio (CMRR) to handle microvolt-level signals.
* **Microcontrollers:** Knowledge of ADC (Analog-to-Digital Converter) interrupts, sampling rates, and UART serial communication.
* **Full-Stack Web Development:** Modern JavaScript / React. Proficiency in React hooks such as useEffect and useRef for managing high-frequency state updates without freezing the UI.
* **Web APIs:** Understanding the Web Serial API to connect hardware and the browser.
* **Basic Neuroscience (The 10–20 System):** We needed to know where to place electrodes. We used the standard 10–20 System to identify key locations like O1/O2 (Visual Cortex) and Fp1/Fp2 (Prefrontal Cortex).

---

## Key Research & New Learnings

**S-Transforms – Advanced Time-Frequency Analysis**
Our analysis of bursty brain activity using standard FFTs was ineffective; thus, we adopted the Stockwell Transform for time localization of events while preserving all phase information. Whereas Wavelets do tend to lose phase information during processing, the Stockwell Transform preserves that information.
* **Source:** Stockwell, R.G., et al. (1996) "Localization of the Complex Spectrum: The S-Transform"

**Artifact Rejection and Signal Hygiene**
Using custom IIR Filter Chains, we have developed ways to effectively filter out biological artifacts (eye blinking and jaw clenching) from real brain signals while treating the brain as a non-stationary signal source.
* **Source:** Buzsáki, G. (2006) "Rhythms of the Brain"

**The Berger Effect (Alpha Blocking)**
In 1929, Berger found that the Alpha wave activity in the Brain (8-12 Hz) disappeared when people opened their eyes. This demonstrates that the brain produced meaningful brain signal at all times, not just electrical interference. By replicating this study, we proved the reliability of our hardware.
* **Source:** Berger, H. (1929) "Über das Elektrenkephalogramm des Menschen."

---
## Impact & Usefulness

**Accessibility & Assistive Technology**
The "Auto Scroller" feature of our system’s ability to translate biological signals into digital commands is an important benefit for people with motor disorders (e.g., ALS or spinal injuries). It is an affordable way to interact with the digital realm without the use of computer mice or keyboards.

**Democratization of Neuroscience**
We have abolished the cost of entry to brain research. By running the Stockwell Transform, which is a very advanced method, in a web browser, students and researchers can do signal analysis for a clinical-quality analysis costing thousands of dollars.

**Mental Health & BioFeedback**
The tool is able to convert subjective states of mind to objective information. It is through the real-time graphic representation of Alpha (relaxation) and Beta (stress) waves that one can instantly understand his/her mental processes. Such immediate feedback is indeed useful in conducting biofeedback training on the subject in question.

**Next Generation Interaction**
With an integration of EEG signals from brain activity, EMG signals from muscle activity, and EOG signals from eye activity, "hybrid" systems are being developed. Such an integration will open avenues for fast control systems for gaming as well as VR that can respond faster than muscle movements.

---

## Features

**The Auto Scroller**
A hands-free navigation device employing EOG signals to recognize blinks. The Auto Scroller interprets eye movement differently than brain wave activity, simulating keypresses based on blinking in order to enable users to scroll through digital documents or websites without touching any keys.

**3D Stockwell Visualization**
Moves past the traditional 2D line graphs and bar charts, instead using the Stockwell Transform to visualize brain activity in a 3D surface model that produces an intensity glow based on magnitude and occurrence in time. This allows a person to visualize transient events occurring in real time, such as sudden relaxation bursts.

**Web Serial Architecture**
Enables us to provide a "zero-install" user experience. By utilizing the Web Serial API, we have removed the need for installation drivers or Python scripts. Users simply plug in the device and can access clinical-grade signal analysis instantly via web browser.

**BCI Gaming Interface**
Hybridizes EEG Focus Metrics with EMG Muscle Triggers to create one controller for all gamer needs. Gamers will aim via concentration and will fire their weapon via a jaw clench response, resulting in faster response times than physical fingers.

**Emotion & Health Monitor**
Will merge EEG data with Thermal Sensing Technology; this will allow for an accurate record of anxiety levels and sleep quality when correlating neural stress markers (Beta waves) with physiological responses (declines in skin temperature).

---

## Device Architecture

**1. Neural Sensors (Acquisition)**
   - **Role:** High fidelity capture of raw bio potentials (EEG/Neural spikes).
   - **Output:** Low voltage analog signals.

**2. Signal Conditioning (Analog Processing)**
   - **Role:** Pre processing circuitry to amplify weak signals and filter out environmental noise (50/60Hz hum, muscle artifacts).
   - **Output:** Cleaned, high gain analog waveforms.

**3. Microcontroller (Digitization)**
   - **Role:** Performs high speed Analog to Digital Conversion (ADC) and packetizes data for transmission.
   - **Protocol:** Serial/USB communication.

**4. Web Browser (Analysis & Visualization)**
   - **Role:** Client side processing unit.
   - **Core Algo:** Implements the **Stockwell Transform** for superior time-frequency resolution compared to standard FFT.
   - **UI:** Renders real time heatmaps and waveform graphs (Chrome/Edge).

<p align="center">
  <img width="384" height="428" alt="Device Arch" src="https://github.com/user-attachments/assets/262b9afc-a967-4df7-855a-5bab5ab7ae62" />
</p>

---

## Gallery

**Web Interface**

<p align="center"> 
   <img  width="768" height="857"  alt="image" src="https://github.com/NAMAN3342/project-neuro/blob/main/assets/images/load.png" />
</p>

> The dashboard visualizing real-time brainwave activity using the Stockwell Transform.

<p align="center">
   <img  width="768" height="857" alt="image" src="https://github.com/NAMAN3342/project-neuro/blob/main/assets/images/main.png" />
</p>

---

## 🎥 Video Demonstrations

### 1. Device Operation & Live Monitoring
This video demonstrates the device in action. You can observe live values changing in real-time on the accompanying website (link available in the repository "About" section).

https://github.com/user-attachments/assets/3436feb3-7939-400d-9610-36bbdde0e7f0

### 2. ECG Signal Analysis
This demonstration visualizes EEG signals captured from the Alpha, Beta, and Gamma nodes, highlighting the origin points of dominant signals.

https://github.com/user-attachments/assets/04b397a4-25dd-42b2-9fbd-30b4e03bb134

**Screen Recording (High Clarity):**
A direct screen capture of the EEG analysis shown above.

https://github.com/user-attachments/assets/b12f72ad-fc01-4af5-9376-a0f5f2028cb8

### 3. Real-Time BCI (EEG)
This video demonstrates the Brain-Computer Interface (BCI) operating in real-time using EEG signals captured from the brain.

https://github.com/user-attachments/assets/7464af5f-77b9-47da-a742-9f56f031784c

**Screen Recording (High Clarity):**
A direct screen capture of the BCI demonstration shown above.

https://github.com/user-attachments/assets/5d752ffa-3619-4fb9-814c-f33a6bdb1ef8

---

## Conclusion

Project Neuro stands as a testament to the democratization of neuroscience. By bridging the gap between expensive clinical equipment and accessible consumer electronics, we have successfully created a platform that effectively acts as a "Universal Controller" for the human body.

Through the novel application of the **Stockwell Transform** in a browser-based environment, we have proven that high-fidelity signal analysis does not require proprietary drivers or massive computing rigs—just a USB connection and a web link. By hybridizing EEG, EMG, and EOG signals, we have moved beyond simple data visualization to create actionable, real-time control systems for assistive technology and gaming.

This project is a stepping stone toward a future where human-computer interaction is seamless, intuitive, and bound only by the limits of the mind. We invite developers, researchers, and hobbyists to explore the repository, improve the signal processing chains, and help us push the boundaries of what is possible with open-source BCI technology.


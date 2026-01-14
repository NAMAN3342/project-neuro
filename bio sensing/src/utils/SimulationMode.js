/**
 * SimulationMode - Generates realistic test data for BioAmp signals and temperature sensors
 */

class SimulationMode {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.sampleRate = 125; // Hz - matches Arduino
        this.time = 0;
        this.listeners = {
            signal: [],
            temperature: []
        };
    }

    /**
     * Start simulation
     */
    start() {
        if (this.isRunning) return;

        console.log('[SimulationMode] Starting simulation with realistic EEG/Temperature data...');
        this.isRunning = true;
        this.time = 0;

        // Run at 250 Hz to match SignalProcessor default and provide smoother signals
        // This ensures FFT analysis matches the generated frequencies (e.g. 10Hz Alpha is detected as 10Hz)
        this.sampleRate = 250;
        const intervalMs = 1000 / this.sampleRate;

        this.intervalId = setInterval(() => {
            this.generateData();
            this.time += intervalMs / 1000; // Convert to seconds
        }, intervalMs);

        console.log('[SimulationMode] Simulation started at', this.sampleRate, 'Hz');
    }

    /**
     * Stop simulation
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        this.time = 0;
    }

    /**
     * Generate simulated BioAmp signals and temperature data
     */
    generateData() {
        const now = Date.now();
        const t = this.time;

        // Generate realistic EEG signals using proper signal generators
        // Ch0: Fp1, Fp2 - Frontal cortex (EEG with some EMG artifacts)
        const ch0 = this.generateEEGSignal(t, 0) + this.generateEMGSignal(t, 0) * 0.3;

        // Ch1: C3, C4 - Motor cortex (EEG with occasional bursts)
        const ch1 = this.generateEEGSignal(t, Math.PI / 3) + this.generateEMGSignal(t, Math.PI / 3) * 0.2;

        // Ch2: O1, O2 - Occipital/Visual cortex (EEG with some EOG)
        const ch2 = this.generateEEGSignal(t, 2 * Math.PI / 3) + this.generateEOGSignal(t, 0) * 0.2;

        const signalData = {
            ch0: ch0,
            ch1: ch1,
            ch2: ch2,
            timestamp: now
        };

        // Generate simulated temperatures with realistic variations over time
        // Convert to raw format (400-700) for UI compatibility
        const toRaw = (celsius) => ((celsius - 35) / 3 * 300 + 400);

        // Base temperature that slowly varies over time (simulating natural body temperature fluctuation)
        const baseCelsius = 36.0;
        // Very slow variation
        const slowVariation = Math.sin(t * 0.1) * 0.5;

        // Calculate Celsius values for each sensor with unique characteristics
        const t1c = baseCelsius + slowVariation + Math.sin(t * 0.5) * 0.3 + Math.random() * 0.2;
        const t2c = baseCelsius + 0.2 + slowVariation + Math.sin(t * 0.3 + 1) * 0.4 + Math.random() * 0.2;
        const t3c = baseCelsius + 0.5 + slowVariation + Math.random() * 0.1;
        const t4c = baseCelsius + 0.8 + slowVariation + Math.sin(t * 0.2 + 2) * 0.3 + Math.random() * 0.15;
        const t5c = baseCelsius + 0.3 + slowVariation + Math.sin(t * 0.4 + 3) * 0.25 + Math.random() * 0.15;

        const temperatureData = {
            t1: toRaw(t1c),
            t2: toRaw(t2c),
            t3: toRaw(t3c),
            t4: toRaw(t4c),
            t5: toRaw(t5c),
            celsius: {
                t1: t1c,
                t2: t2c,
                t3: t3c,
                t4: t4c,
                t5: t5c
            },
            timestamp: now
        };

        // Emit signal data
        this.emit('signal', signalData);

        // Emit temperature data
        this.emit('temperature', temperatureData);
    }

    /**
     * Generate EEG-like signal (alpha waves 8-13 Hz with noise)
     */
    generateEEGSignal(t, channelOffset) {
        const baseFreq = 10; // 10 Hz alpha wave
        const amplitude = 50 + Math.random() * 30; // Variable amplitude

        // Main alpha wave
        let signal = amplitude * Math.sin(2 * Math.PI * baseFreq * t + channelOffset);

        // Add some beta waves (13-30 Hz)
        signal += (amplitude * 0.3) * Math.sin(2 * Math.PI * 20 * t + channelOffset * 0.5);

        // Add noise
        signal += (Math.random() - 0.5) * 20;

        // Occasional bursts (simulate mental activity)
        if (Math.random() < 0.05) {
            signal += (Math.random() - 0.5) * 100;
        }

        return signal;
    }

    /**
     * Generate EMG-like signal (muscle activity - random bursts)
     */
    generateEMGSignal(t, channelOffset) {
        let signal = (Math.random() - 0.5) * 30; // Base noise

        // Random muscle activation bursts
        const burstFreq = 0.5; // Bursts every ~2 seconds
        const burstPhase = Math.sin(2 * Math.PI * burstFreq * t + channelOffset);

        if (burstPhase > 0.7) {
            // During burst - high frequency, high amplitude
            const muscleFreq = 50 + Math.random() * 100; // 50-150 Hz
            signal += 150 * Math.sin(2 * Math.PI * muscleFreq * t);
            signal += (Math.random() - 0.5) * 100;
        }

        return signal;
    }

    /**
     * Generate EOG-like signal (eye movement - slower patterns)
     */
    generateEOGSignal(t, channelOffset) {
        const eyeMovementFreq = 0.3; // Slow eye movements
        const amplitude = 80;

        // Slow sinusoidal pattern (eye movements)
        let signal = amplitude * Math.sin(2 * Math.PI * eyeMovementFreq * t + channelOffset);

        // Add occasional saccades (quick eye movements)
        if (Math.random() < 0.02) {
            signal += (Math.random() - 0.5) * 200;
        }

        // Low frequency noise
        signal += (Math.random() - 0.5) * 15;

        return signal;
    }

    /**
     * Generate temperature sensor readings
     * Simulates body temperature variations (36-38°C range)
     * Returns ADC values (0-1023)
     */
    generateTemperatures(t) {
        const temps = [];

        for (let i = 0; i < 5; i++) {
            // Base temperature in Celsius (36-37.5°C)
            const baseTemp = 36.5 + Math.sin(2 * Math.PI * 0.1 * t + i) * 0.5;

            // Add small random variations
            const temp = baseTemp + (Math.random() - 0.5) * 0.3;

            // Convert to ADC value (simplified thermistor model)
            // Assuming linear mapping: 35°C = 400, 38°C = 700
            const adcValue = 400 + ((temp - 35) / 3) * 300;

            temps.push(Math.round(adcValue));
        }

        return temps;
    }

    /**
     * Event listener system
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Get simulation status
     */
    getStatus() {
        return {
            running: this.isRunning,
            sampleRate: this.sampleRate,
            time: this.time.toFixed(2)
        };
    }
}

export default new SimulationMode();

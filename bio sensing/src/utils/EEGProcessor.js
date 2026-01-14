import Fili from 'fili';

/**
 * EEGProcessor - Handles real-time signal filtering.
 * Implements IIR Bandpass (0.5-50Hz) and Notch (50/60Hz) filters.
 * 
 * Usage:
 * const processor = new EEGProcessor(125); // Sample rate 125Hz
 * const cleanValue = processor.process(rawValue);
 */
class EEGProcessor {
    constructor(sampleRate = 125) {
        this.sampleRate = sampleRate;
        this.isReady = false;

        try {
            const iirCalculator = new Fili.IirFilter();

            // 1. Bandpass Filter (0.5 - 50 Hz)
            // Removes DC drift (<0.5Hz) and high-freq noise (>50Hz)
            this.bandpassFilter = iirCalculator.bandpass({
                order: 4,
                characteristic: 'butterworth',
                Fs: sampleRate,
                Fc1: 0.5,
                Fc2: 50
            });

            // 2. Notch Filter (50 Hz - Mains Hum)
            // Change Fc1/Fc2 to 58/62 for 60Hz countries (US/Can)
            this.notchFilter = iirCalculator.bandstop({
                order: 4,
                characteristic: 'butterworth',
                Fs: sampleRate,
                Fc1: 48,
                Fc2: 52
            });

            this.isReady = true;
            console.log(`[EEGProcessor] Initialized at ${sampleRate}Hz`);
        } catch (e) {
            console.error('[EEGProcessor] Failed to initialize filters:', e);
        }
    }

    process(sample) {
        if (!this.isReady || isNaN(sample)) return sample;

        // Apply filters in sequence
        // Note: 'multiStep' handles state preservation between samples
        let filtered = this.bandpassFilter.singleStep(sample);
        filtered = this.notchFilter.singleStep(filtered);

        return filtered;
    }

    // reset() if needed for discontinuities
}

export default EEGProcessor;

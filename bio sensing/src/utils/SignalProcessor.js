/**
 * SignalProcessor - Real-time EEG signal processing in the browser
 * Implements FFT to extract spectral power from raw time-series data.
 */

class SignalProcessor {
    constructor(sampleRate = 125, bufferSize = 256) {
        this.sampleRate = sampleRate;
        this.bufferSize = bufferSize;

        // Circular buffers for each channel
        this.buffers = {
            ch0: new Float32Array(bufferSize),
            ch1: new Float32Array(bufferSize),
            ch2: new Float32Array(bufferSize)
        };

        this.indices = {
            ch0: 0, ch1: 0, ch2: 0
        };

        // Window function (Hanning) to reduce spectral leakage
        this.window = new Float32Array(bufferSize);
        for (let i = 0; i < bufferSize; i++) {
            this.window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (bufferSize - 1)));
        }
    }

    /**
     * Add a new sample to the buffers
     */
    addSample(ch0, ch1, ch2) {
        this.pushToBuffer('ch0', ch0);
        this.pushToBuffer('ch1', ch1);
        this.pushToBuffer('ch2', ch2);
    }

    pushToBuffer(channel, value) {
        const idx = this.indices[channel];
        this.buffers[channel][idx] = value;
        this.indices[channel] = (idx + 1) % this.bufferSize;
    }

    /**
     * Get ordered buffer data (oldest to newest)
     */
    getOrderedBuffer(channel) {
        const buffer = this.buffers[channel];
        const idx = this.indices[channel];
        const ordered = new Float32Array(this.bufferSize);

        // Copy oldest part (from idx to end)
        let k = 0;
        for (let i = idx; i < this.bufferSize; i++) {
            ordered[k++] = buffer[i];
        }
        // Copy newest part (from 0 to idx)
        for (let i = 0; i < idx; i++) {
            ordered[k++] = buffer[i];
        }

        return ordered;
    }

    /**
     * computePower - Calculate power in specific frequency bands
     */
    computePower(channel) {
        const data = this.getOrderedBuffer(channel);

        // Apply window function and remove DC offset
        let sum = 0;
        for (let i = 0; i < this.bufferSize; i++) sum += data[i];
        const mean = sum / this.bufferSize;

        const windowed = new Float32Array(this.bufferSize);
        for (let i = 0; i < this.bufferSize; i++) {
            windowed[i] = (data[i] - mean) * this.window[i];
        }

        // Compute FFT
        const spectrum = this.fft(windowed);

        // Calculate band powers
        return {
            delta: this.getBandPower(spectrum, 0.5, 4),
            theta: this.getBandPower(spectrum, 4, 8),
            alpha: this.getBandPower(spectrum, 8, 12),
            beta: this.getBandPower(spectrum, 13, 30),
            gamma: this.getBandPower(spectrum, 30, 60)
        };
    }

    getBandPower(spectrum, minFreq, maxFreq) {
        const freqRes = this.sampleRate / this.bufferSize;
        const minIdx = Math.floor(minFreq / freqRes);
        const maxIdx = Math.ceil(maxFreq / freqRes);

        let power = 0;
        for (let i = minIdx; i <= maxIdx && i < spectrum.length; i++) {
            power += spectrum[i];
        }

        // Normalize (rough scaling for display 0-1)
        return Math.min(power / 1000, 1);
    }

    /**
     * Simple Radix-2 FFT implementation
     * Returns magnitude spectrum
     */
    fft(input) {
        const N = input.length;
        if (N <= 1) return [input[0] || 0];

        // Verify power of 2
        if ((N & (N - 1)) !== 0) return new Float32Array(N / 2).fill(0);

        const real = new Float32Array(input);
        const imag = new Float32Array(N).fill(0);

        // Bit reversal permutation
        let j = 0;
        for (let i = 0; i < N - 1; i++) {
            if (i < j) {
                [real[i], real[j]] = [real[j], real[i]];
                [imag[i], imag[j]] = [imag[j], imag[i]];
            }
            let k = N >> 1;
            while (k <= j) {
                j -= k;
                k >>= 1;
            }
            j += k;
        }

        // Butterfly operations
        for (let size = 2; size <= N; size <<= 1) {
            const halfSize = size >> 1;
            const angleStep = -2 * Math.PI / size;

            for (let i = 0; i < N; i += size) {
                for (let k = 0; k < halfSize; k++) {
                    const angle = k * angleStep;
                    const cosA = Math.cos(angle);
                    const sinA = Math.sin(angle);

                    const idx = i + k;
                    const idx2 = idx + halfSize;

                    const tReal = cosA * real[idx2] - sinA * imag[idx2];
                    const tImag = sinA * real[idx2] + cosA * imag[idx2];

                    real[idx2] = real[idx] - tReal;
                    imag[idx2] = imag[idx] - tImag;
                    real[idx] += tReal;
                    imag[idx] += tImag;
                }
            }
        }

        // Compute magnitude
        const magnitude = new Float32Array(N / 2);
        for (let i = 0; i < N / 2; i++) {
            magnitude[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
        }
        return magnitude;
    }

    getBrainActivity() {
        return {
            ch0: this.computePower('ch0'),
            ch1: this.computePower('ch1'),
            ch2: this.computePower('ch2')
        };
    }
}

export default new SignalProcessor();

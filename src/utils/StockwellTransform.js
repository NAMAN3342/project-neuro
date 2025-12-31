
export class StockwellProcessor {
  constructor(sampleRate = 256, bufferSize = 512) {
    this.sampleRate = sampleRate;
    this.bufferSize = bufferSize;
    
    this.bands = {
      delta: { min: 0.5, max: 4, color: '#ff6b6b' },
      theta: { min: 4, max: 8, color: '#ffd93d' },
      alpha: { min: 8, max: 13, color: '#6bcb77' },
      beta: { min: 13, max: 30, color: '#4d96ff' },
      gamma: { min: 30, max: 50, color: '#9b59b6' }
    };
    
    this.freqResolution = sampleRate / bufferSize;
  }

  fft(signal) {
    const n = signal.length;
    if (n <= 1) return { real: signal, imag: new Float32Array(n) };
    
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    
    for (let i = 0; i < n; i++) {
      real[i] = signal[i] || 0;
      imag[i] = 0;
    }
    
    let j = 0;
    for (let i = 0; i < n - 1; i++) {
      if (i < j) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
      let k = n >> 1;
      while (k <= j) {
        j -= k;
        k >>= 1;
      }
      j += k;
    }
    
    for (let len = 2; len <= n; len <<= 1) {
      const halfLen = len >> 1;
      const angle = -2 * Math.PI / len;
      
      for (let i = 0; i < n; i += len) {
        for (let k = 0; k < halfLen; k++) {
          const theta = angle * k;
          const twRe = Math.cos(theta);
          const twIm = Math.sin(theta);
          
          const evenIdx = i + k;
          const oddIdx = i + k + halfLen;
          
          const tRe = twRe * real[oddIdx] - twIm * imag[oddIdx];
          const tIm = twRe * imag[oddIdx] + twIm * real[oddIdx];
          
          real[oddIdx] = real[evenIdx] - tRe;
          imag[oddIdx] = imag[evenIdx] - tIm;
          real[evenIdx] = real[evenIdx] + tRe;
          imag[evenIdx] = imag[evenIdx] + tIm;
        }
      }
    }
    
    return { real, imag };
  }

  simpleSpectrogram(signal) {
    const n = signal.length;
    const windowSize = 128;
    const hop = 32;
    const numWindows = Math.floor((n - windowSize) / hop) + 1;
    
    const spectrogram = [];
    const frequencies = [];
    
    const maxFreq = 50;
    const numFreqs = Math.floor(maxFreq / this.freqResolution);
    
    for (let i = 0; i <= numFreqs; i++) {
      frequencies.push(i * this.freqResolution);
    }
    
    for (let freqIdx = 0; freqIdx <= numFreqs; freqIdx++) {
      const timeSeries = new Float32Array(numWindows);
      
      for (let w = 0; w < numWindows; w++) {
        const start = w * hop;
        const windowData = new Float32Array(windowSize);
        
        for (let i = 0; i < windowSize; i++) {
          if (start + i < n) {
            const hannWindow = 0.5 * (1 - Math.cos(2 * Math.PI * i / windowSize));
            windowData[i] = signal[start + i] * hannWindow;
          }
        }
        
        const fftResult = this.fft(windowData);
        
        if (freqIdx < windowSize / 2) {
          timeSeries[w] = Math.sqrt(
            fftResult.real[freqIdx] * fftResult.real[freqIdx] + 
            fftResult.imag[freqIdx] * fftResult.imag[freqIdx]
          );
        }
      }
      
      spectrogram.push(timeSeries);
    }
    
    return { spectrogram, frequencies };
  }

  extractBandPowersFFT(signal) {
    const bandPowers = {};
    
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const processedSignal = new Float32Array(signal.length);
    for (let i = 0; i < signal.length; i++) {
      processedSignal[i] = signal[i] - mean;
    }
    
    for (let i = 0; i < processedSignal.length; i++) {
      const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / processedSignal.length));
      processedSignal[i] *= window;
    }
    
    const fftResult = this.fft(processedSignal);
    
    Object.keys(this.bands).forEach(bandName => {
      const band = this.bands[bandName];
      const minBin = Math.floor(band.min / this.freqResolution);
      const maxBin = Math.ceil(band.max / this.freqResolution);
      
      let power = 0;
      for (let i = minBin; i <= maxBin && i < fftResult.real.length; i++) {
        const mag = Math.sqrt(
          fftResult.real[i] * fftResult.real[i] + 
          fftResult.imag[i] * fftResult.imag[i]
        );
        power += mag * mag;
      }
      
      bandPowers[bandName] = Math.sqrt(power / (maxBin - minBin + 1));
    });
    
    const total = Object.values(bandPowers).reduce((a, b) => a + b, 0) + 0.0001;
    Object.keys(bandPowers).forEach(band => {
      bandPowers[band] = (bandPowers[band] / total) * 100;
    });
    
    return bandPowers;
  }

  analyze(rawSignal, powerMode = 'optimized') {
    const signal = new Float32Array(rawSignal);
    const bandPowers = this.extractBandPowersFFT(signal);
    const { spectrogram, frequencies } = this.simpleSpectrogram(signal);
    
    return {
      delta: bandPowers.delta || 0,
      theta: bandPowers.theta || 0,
      alpha: bandPowers.alpha || 0,
      beta: bandPowers.beta || 0,
      gamma: bandPowers.gamma || 0,
      spectrogram,
      frequencies
    };
  }
}

export default StockwellProcessor;

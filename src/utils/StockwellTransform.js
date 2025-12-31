
export class StockwellProcessor {
  constructor(sampleRate = 256, bufferSize = 512) {
    this.sampleRate = sampleRate;
    this.bufferSize = bufferSize;
    this.frequencyBins = bufferSize / 2;
    
    this.bands = {
      delta: { min: 0.5, max: 4, color: '#ff6b6b' },
      theta: { min: 4, max: 8, color: '#ffd93d' },
      alpha: { min: 8, max: 13, color: '#6bcb77' },
      beta: { min: 13, max: 30, color: '#4d96ff' },
      gamma: { min: 30, max: 100, color: '#9b59b6' }
    };
    
    this.gaussianWindows = this.precomputeGaussianWindows();
    
    this.twiddleFactors = this.precomputeTwiddleFactors();
  }

  precomputeGaussianWindows() {
    const windows = {};
    const frequencies = this.getAnalysisFrequencies();
    
    frequencies.forEach(f => {
      if (f > 0) {
        const sigma = 1 / (2 * Math.PI * f);
        const windowSize = Math.min(this.bufferSize, Math.ceil(6 * sigma * this.sampleRate));
        const window = new Float32Array(windowSize);
        
        for (let i = 0; i < windowSize; i++) {
          const t = (i - windowSize / 2) / this.sampleRate;
          window[i] = Math.abs(f) / Math.sqrt(2 * Math.PI) * 
                      Math.exp(-0.5 * Math.pow(t * f, 2));
        }
        
        const sum = window.reduce((a, b) => a + b, 0);
        for (let i = 0; i < windowSize; i++) {
          window[i] /= sum;
        }
        
        windows[f] = window;
      }
    });
    
    return windows;
  }

  precomputeTwiddleFactors() {
    const factors = new Float32Array(this.bufferSize * 2);
    for (let i = 0; i < this.bufferSize; i++) {
      const angle = -2 * Math.PI * i / this.bufferSize;
      factors[i * 2] = Math.cos(angle);
      factors[i * 2 + 1] = Math.sin(angle);
    }
    return factors;
  }

  getAnalysisFrequencies() {
    const frequencies = [];
    const nyquist = this.sampleRate / 2;
    const freqResolution = this.sampleRate / this.bufferSize;
    
    for (let i = 0; i <= this.frequencyBins; i++) {
      const freq = i * freqResolution;
      if (freq <= nyquist && freq <= 100) {
        frequencies.push(freq);
      }
    }
    
    return frequencies;
  }

  fft(signal) {
    const n = signal.length;
    if (n <= 1) return signal;
    
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    
    for (let i = 0; i < n; i++) {
      real[i] = signal[i];
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
      const step = n / len;
      
      for (let i = 0; i < n; i += len) {
        let tw = 0;
        for (let k = 0; k < halfLen; k++) {
          const twRe = this.twiddleFactors[tw * 2] || Math.cos(-2 * Math.PI * tw / n);
          const twIm = this.twiddleFactors[tw * 2 + 1] || Math.sin(-2 * Math.PI * tw / n);
          
          const evenIdx = i + k;
          const oddIdx = i + k + halfLen;
          
          const tRe = twRe * real[oddIdx] - twIm * imag[oddIdx];
          const tIm = twRe * imag[oddIdx] + twIm * real[oddIdx];
          
          real[oddIdx] = real[evenIdx] - tRe;
          imag[oddIdx] = imag[evenIdx] - tIm;
          real[evenIdx] = real[evenIdx] + tRe;
          imag[evenIdx] = imag[evenIdx] + tIm;
          
          tw += step;
        }
      }
    }
    
    return { real, imag };
  }

  magnitude(fftResult) {
    const n = fftResult.real.length;
    const mag = new Float32Array(n / 2 + 1);
    
    for (let i = 0; i <= n / 2; i++) {
      mag[i] = Math.sqrt(
        fftResult.real[i] * fftResult.real[i] + 
        fftResult.imag[i] * fftResult.imag[i]
      );
    }
    
    return mag;
  }

  stockwellTransform(signal, powerMode = 'optimized') {
    const n = signal.length;
    
    
    let freqStep;
    switch (powerMode) {
      case 'optimized':
        freqStep = 1;
        break;
      case 'performance':
        freqStep = 0.5;
        break;
      case 'balanced':
      default:
        freqStep = 0.75;
    }
    
    const mean = signal.reduce((a, b) => a + b, 0) / n;
    const processedSignal = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      processedSignal[i] = signal[i] - mean;
    }
    
    const signalFFT = this.fft(processedSignal);
    
    const frequencies = this.getAnalysisFrequencies();
    const spectrogram = [];
    
    frequencies.forEach(freq => {
      if (freq === 0) {
        spectrogram.push(new Float32Array(n).fill(Math.abs(mean)));
        return;
      }
      
      const window = this.gaussianWindows[freq];
      if (!window) return;
      
      const voiceFFT = {
        real: new Float32Array(n),
        imag: new Float32Array(n)
      };
      
      const freqIndex = Math.round(freq * n / this.sampleRate);
      
      for (let i = 0; i < n; i++) {
        const shiftedIndex = (i + freqIndex) % n;
        
        const gaussWeight = Math.exp(-2 * Math.PI * Math.PI * 
          Math.pow((i - n / 2) / n, 2) / Math.pow(freq, 2));
        
        voiceFFT.real[i] = signalFFT.real[shiftedIndex] * gaussWeight;
        voiceFFT.imag[i] = signalFFT.imag[shiftedIndex] * gaussWeight;
      }
      
      const voice = this.ifft(voiceFFT);
      
      const voiceMag = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        voiceMag[i] = Math.sqrt(voice.real[i] ** 2 + voice.imag[i] ** 2);
      }
      
      spectrogram.push(voiceMag);
    });
    
    return { spectrogram, frequencies };
  }

  ifft(fftResult) {
    const n = fftResult.real.length;
    
    const conjImag = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      conjImag[i] = -fftResult.imag[i];
    }
    
    const result = this.fft(fftResult.real.map((r, i) => r)); // Clone
    
    const outReal = new Float32Array(n);
    const outImag = new Float32Array(n);
    
    for (let i = 0; i < n; i++) {
      outReal[i] = fftResult.real[i];
      outImag[i] = fftResult.imag[i];
    }
    
    for (let i = 0; i < n; i++) {
      outReal[i] /= n;
      outImag[i] /= n;
    }
    
    return { real: outReal, imag: outImag };
  }

  extractBandPowers(spectrogram, frequencies) {
    const bandPowers = {};
    const freqResolution = this.sampleRate / this.bufferSize;
    
    Object.keys(this.bands).forEach(bandName => {
      const band = this.bands[bandName];
      let power = 0;
      let count = 0;
      
      frequencies.forEach((freq, i) => {
        if (freq >= band.min && freq <= band.max && spectrogram[i]) {
          
          const avgPower = spectrogram[i].reduce((a, b) => a + b, 0) / spectrogram[i].length;
          power += avgPower * avgPower;
          count++;
        }
      });
      
      bandPowers[bandName] = count > 0 ? Math.sqrt(power / count) : 0;
    });
    
    const total = Object.values(bandPowers).reduce((a, b) => a + b, 0) + 0.0001;
    Object.keys(bandPowers).forEach(band => {
      bandPowers[band] = (bandPowers[band] / total) * 100;
    });
    
    return bandPowers;
  }

  analyze(rawSignal, powerMode = 'optimized') {
    const signal = new Float32Array(rawSignal);
    const { spectrogram, frequencies } = this.stockwellTransform(signal, powerMode);
    const bandPowers = this.extractBandPowers(spectrogram, frequencies);
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

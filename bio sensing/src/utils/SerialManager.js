/**
 * SerialManager - Handles Web Serial API communication with Arduino
 * Parses incoming data: sig0,sig1,sig2,t1,t2,t3,t4,t5
 */

class SerialManager {
  constructor() {
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.isConnected = false;
    this.listeners = {
      signal: [],
      temperature: [],
      connection: [],
      error: []
    };
    this.buffer = '';
  }

  /**
   * Check if Web Serial API is supported
   */
  isSupported() {
    return 'serial' in navigator;
  }

  /**
   * Connect to Arduino via serial port
   */
  async connect() {
    if (!this.isSupported()) {
      throw new Error('Web Serial API is not supported in this browser');
    }

    try {
      // Request port from user
      this.port = await navigator.serial.requestPort();

      // Open port with Arduino settings
      await this.port.open({
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });

      this.isConnected = true;
      this.emit('connection', { connected: true });

      // Start reading data
      this.startReading();

      return true;
    } catch (error) {
      this.emit('error', { message: error.message, type: 'connection' });
      throw error;
    }
  }

  /**
   * Disconnect from serial port
   */
  async disconnect() {
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader = null;
      }

      if (this.port) {
        await this.port.close();
        this.port = null;
      }

      this.isConnected = false;
      this.emit('connection', { connected: false });
    } catch (error) {
      this.emit('error', { message: error.message, type: 'disconnection' });
    }
  }

  /**
   * Start reading data from serial port
   */
  async startReading() {
    if (!this.port) return;

    try {
      const textDecoder = new TextDecoderStream();
      this.port.readable.pipeTo(textDecoder.writable);
      this.reader = textDecoder.readable.getReader();

      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;

        // Add to buffer and process lines
        this.buffer += value;
        this.processBuffer();
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.emit('error', { message: error.message, type: 'reading' });
      }
    }
  }

  /**
   * Process buffered data line by line
   */
  processBuffer() {
    const lines = this.buffer.split('\n');

    // Keep the last incomplete line in buffer
    this.buffer = lines.pop() || '';

    lines.forEach(line => {
      line = line.trim();
      if (line) {
        this.parseLine(line);
      }
    });
  }

  /**
   * Parse a single line of data
   * Expected format: sig0,sig1,sig2,t1,t2,t3,t4,t5
   * Where temperatures are RAW ADC values (0-1023)
   */
  parseLine(line) {
    console.log('[SerialManager] Received line:', line);

    // Ignore game mode joystick commands
    if (line.startsWith('J,')) {
      console.log('[SerialManager] Ignoring joystick command');
      return;
    }

    const values = line.split(',').map(v => parseFloat(v.trim()));
    // console.log('[SerialManager] Parsed values:', values);

    // Validate we have 8 values
    if (values.length === 8 && values.every(v => !isNaN(v))) {
      const [sig0, sig1, sig2, rawT1, rawT2, rawT3, rawT4, rawT5] = values;

      console.log('[SerialManager] Emitting signals:', { sig0, sig1, sig2 });

      // Emit signal data (3 BioAmp channels)
      this.emit('signal', {
        ch0: sig0,
        ch1: sig1,
        ch2: sig2,
        timestamp: Date.now()
      });

      // Convert raw ADC to Celsius (LM35: 10mV/°C, 5V reference)
      const adcToCelsius = (adc) => Math.round((adc * 5.0 / 1024.0) * 100 * 10) / 10;

      // Convert to raw format (400-700) for compatibility with existing UI heatmap
      const toRaw = (celsius) => ((celsius - 35) / 3 * 300 + 400);

      const t1 = adcToCelsius(rawT1);
      const t2 = adcToCelsius(rawT2);
      const t3 = adcToCelsius(rawT3);
      const t4 = adcToCelsius(rawT4);
      const t5 = adcToCelsius(rawT5);

      // Filter out noise/floating pin values (e.g. > 60°C or < 10°C)
      // If user hasn't connected sensors, these pins float and produce "fake" high values.
      const isValidTemp = (t) => t > 10 && t < 60;

      const cleanT1 = isValidTemp(t1) ? t1 : 0;
      const cleanT2 = isValidTemp(t2) ? t2 : 0;
      const cleanT3 = isValidTemp(t3) ? t3 : 0;
      const cleanT4 = isValidTemp(t4) ? t4 : 0;
      const cleanT5 = isValidTemp(t5) ? t5 : 0;

      // console.log('[SerialManager] Emitting temperatures (°C):', { t1: cleanT1, t2: cleanT2, t3: cleanT3, t4: cleanT4, t5: cleanT5 });

      this.emit('temperature', {
        t1: cleanT1 > 0 ? toRaw(cleanT1) : 0,
        t2: cleanT2 > 0 ? toRaw(cleanT2) : 0,
        t3: cleanT3 > 0 ? toRaw(cleanT3) : 0,
        t4: cleanT4 > 0 ? toRaw(cleanT4) : 0,
        t5: cleanT5 > 0 ? toRaw(cleanT5) : 0,
        celsius: { t1: cleanT1, t2: cleanT2, t3: cleanT3, t4: cleanT4, t5: cleanT5 },
        timestamp: Date.now()
      });
    } else {
      console.warn('[SerialManager] Invalid data format. Expected 8 values, got:', values.length, 'values:', values);
    }
  }

  /**
   * Send command to Arduino
   */
  async sendCommand(command) {
    if (!this.port || !this.isConnected) {
      throw new Error('Not connected to serial port');
    }

    try {
      if (!this.writer) {
        this.writer = this.port.writable.getWriter();
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(command + '\n');
      await this.writer.write(data);
      this.writer.releaseLock();
      this.writer = null;
    } catch (error) {
      this.emit('error', { message: error.message, type: 'writing' });
      throw error;
    }
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
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      supported: this.isSupported()
    };
  }
}

export default new SerialManager();

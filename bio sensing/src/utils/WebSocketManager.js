/**
 * WebSocketManager - Handles communication with Python backend
 */
class WebSocketManager {
    constructor() {
        this.ws = null;
        this.listeners = {
            signal: [],
            temperature: [],
            connection: [],
            status: []
        };
        this.url = 'ws://localhost:8765/ws';
        this.reconnectInterval = 2000;
    }

    connect() {
        try {
            if (this.ws) return; // Already connected or connecting

            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('Connected to BioAmp Server');
                this.emit('connection', { connected: true });
            };

            this.ws.onclose = () => {
                console.log('Disconnected from BioAmp Server');
                this.emit('connection', { connected: false });
                this.ws = null;
                // Auto reconnect
                setTimeout(() => this.connect(), this.reconnectInterval);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.processMessage(data);
                } catch (e) {
                    console.error('Failed to parse WebSocket message:', e);
                }
            };
        } catch (error) {
            console.error('WebSocket connection failed:', error);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.onclose = null; // Disable auto-reconnect logic
            this.ws.close();
            this.ws = null;
        }
        this.emit('connection', { connected: false });
    }

    processMessage(data) {
        // Handle different message types
        if (data.type === 'enhanced_data') {
            // Signals
            if (data.signals) {
                this.emit('signal', data.signals);
            }

            // Temperatures
            if (data.temperatures) {
                // Add raw values if missing for heatmap compatibility
                const toRaw = (celsius) => ((celsius - 35) / 3 * 300 + 400);

                const temps = {
                    t1: toRaw(data.heatmap?.t1 || data.temperatures.t1),
                    t2: toRaw(data.heatmap?.t2 || data.temperatures.t2),
                    t3: toRaw(data.heatmap?.t3 || data.temperatures.t3),
                    t4: toRaw(data.heatmap?.t4 || data.temperatures.t4),
                    t5: toRaw(data.heatmap?.t5 || data.temperatures.t5),
                    celsius: data.temperatures,
                    timestamp: Date.now()
                };

                this.emit('temperature', temps);
            }

            // Analytics/Status
            if (data.analytics) {
                this.emit('status', data.analytics);
            }
        } else if (data.type === 'status') {
            // Initial connection status
            console.log('Server Status:', data.message);
        }
    }

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
}

export default new WebSocketManager();

/**
 * ThermalController - Manages temperature sensor visualization with color gradients
 */

import * as THREE from 'three';

class ThermalController {
    constructor() {
        this.sensors = new Map();
        this.temperatureData = {
            t1: 0,
            t2: 0,
            t3: 0,
            t4: 0,
            t5: 0
        };
    }

    /**
     * Register a thermal sensor with its mesh
     * @param {string} name - Sensor name (e.g., 'T1', 'T2')
     * @param {THREE.Mesh} mesh - The sensor mesh
     */
    registerSensor(name, mesh) {
        this.sensors.set(name, {
            mesh,
            baseColor: mesh.material.color.clone()
        });
    }

    /**
     * Update with new temperature data
     * @param {Object} tempData - { t1, t2, t3, t4, t5 } (ADC values 0-1023)
     */
    updateTemperatures(tempData) {
        this.temperatureData = { ...tempData };

        // Update each sensor
        this.sensors.forEach((sensor, name) => {
            const sensorNum = parseInt(name.substring(1)); // Extract number from 'T1', 'T2', etc.
            const adcValue = tempData[`t${sensorNum}`];

            if (adcValue !== undefined) {
                const color = this.getTemperatureColor(adcValue);
                sensor.mesh.material.color.copy(color);
                sensor.mesh.material.emissive.copy(color);

                // Adjust emissive intensity based on temperature
                const intensity = this.getEmissiveIntensity(adcValue);
                sensor.mesh.material.emissiveIntensity = intensity;
            }
        });
    }

    /**
     * Convert ADC value to temperature color
     * Blue (cold) → Cyan → Green → Yellow → Red (hot)
     * @param {number} adcValue - ADC reading (0-1023)
     * @returns {THREE.Color}
     */
    getTemperatureColor(adcValue) {
        // Map ADC to temperature range
        // Assuming: 400 ADC ≈ 35°C, 700 ADC ≈ 38°C
        const minADC = 400;
        const maxADC = 700;

        // Normalize to 0-1
        let normalized = (adcValue - minADC) / (maxADC - minADC);
        normalized = Math.max(0, Math.min(1, normalized)); // Clamp

        // Create color gradient
        const color = new THREE.Color();

        if (normalized < 0.25) {
            // Blue to Cyan (cold)
            const t = normalized / 0.25;
            color.setRGB(0, t, 1);
        } else if (normalized < 0.5) {
            // Cyan to Green
            const t = (normalized - 0.25) / 0.25;
            color.setRGB(0, 1, 1 - t);
        } else if (normalized < 0.75) {
            // Green to Yellow
            const t = (normalized - 0.5) / 0.25;
            color.setRGB(t, 1, 0);
        } else {
            // Yellow to Red (hot)
            const t = (normalized - 0.75) / 0.25;
            color.setRGB(1, 1 - t, 0);
        }

        return color;
    }

    /**
     * Get emissive intensity based on temperature
     */
    getEmissiveIntensity(adcValue) {
        const minADC = 400;
        const maxADC = 700;

        let normalized = (adcValue - minADC) / (maxADC - minADC);
        normalized = Math.max(0, Math.min(1, normalized));

        // Higher temperature = higher glow
        return 0.6 + (normalized * 0.8);
    }

    /**
     * Convert ADC to Celsius (simplified thermistor model)
     * Adjust this based on your actual temperature sensors
     */
    adcToCelsius(adcValue) {
        // Linear approximation: 400 ADC = 35°C, 700 ADC = 38°C
        const minADC = 400;
        const maxADC = 700;
        const minTemp = 35;
        const maxTemp = 38;

        return minTemp + ((adcValue - minADC) / (maxADC - minADC)) * (maxTemp - minTemp);
    }

    /**
     * Get current temperatures in Celsius
     */
    getTemperaturesInCelsius() {
        return {
            t1: this.adcToCelsius(this.temperatureData.t1),
            t2: this.adcToCelsius(this.temperatureData.t2),
            t3: this.adcToCelsius(this.temperatureData.t3),
            t4: this.adcToCelsius(this.temperatureData.t4),
            t5: this.adcToCelsius(this.temperatureData.t5)
        };
    }

    /**
     * Reset all sensors to base state
     */
    reset() {
        this.temperatureData = { t1: 0, t2: 0, t3: 0, t4: 0, t5: 0 };

        this.sensors.forEach((sensor) => {
            sensor.mesh.material.color.copy(sensor.baseColor);
            sensor.mesh.material.emissive.copy(sensor.baseColor);
            sensor.mesh.material.emissiveIntensity = 0.6;
        });
    }
}

export default new ThermalController();

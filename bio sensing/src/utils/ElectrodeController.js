/**
 * ElectrodeController - Manages electrode visual effects based on BioAmp signals
 */

import * as THREE from 'three';

class ElectrodeController {
    constructor() {
        this.electrodes = new Map();
        this.signalHistory = {
            ch0: [],
            ch1: [],
            ch2: []
        };
        this.historyLength = 10; // Keep last 10 samples for smoothing
        this.glowIntensity = {
            ch0: 0,
            ch1: 0,
            ch2: 0
        };
        this.targetIntensity = {
            ch0: 0,
            ch1: 0,
            ch2: 0
        };
    }

    /**
     * Register an electrode with its mesh and channel
     * @param {string} name - Electrode name (e.g., 'F2', 'Fp1')
     * @param {THREE.Mesh} mesh - The electrode mesh
     * @param {number} channel - Channel number (0, 1, or 2)
     */
    registerElectrode(name, mesh, channel) {
        this.electrodes.set(name, {
            mesh,
            channel,
            baseColor: mesh.material.color.clone(),
            baseEmissive: mesh.material.emissive.clone(),
            baseEmissiveIntensity: mesh.material.emissiveIntensity || 0.4
        });
    }

    /**
     * Update with new signal data
     * @param {Object} signalData - { ch0, ch1, ch2 }
     */
    updateSignals(signalData) {
        // Add to history
        this.signalHistory.ch0.push(Math.abs(signalData.ch0));
        this.signalHistory.ch1.push(Math.abs(signalData.ch1));
        this.signalHistory.ch2.push(Math.abs(signalData.ch2));

        // Keep only recent history
        if (this.signalHistory.ch0.length > this.historyLength) {
            this.signalHistory.ch0.shift();
            this.signalHistory.ch1.shift();
            this.signalHistory.ch2.shift();
        }

        // Calculate average signal strength for each channel
        const avg0 = this.average(this.signalHistory.ch0);
        const avg1 = this.average(this.signalHistory.ch1);
        const avg2 = this.average(this.signalHistory.ch2);

        // Map signal amplitude to glow intensity (0.0 - 1.0)
        // Assuming signal range is roughly 0-200 after filtering
        this.targetIntensity.ch0 = this.mapSignalToIntensity(avg0);
        this.targetIntensity.ch1 = this.mapSignalToIntensity(avg1);
        this.targetIntensity.ch2 = this.mapSignalToIntensity(avg2);
    }

    /**
     * Map signal amplitude to glow intensity
     */
    mapSignalToIntensity(signal) {
        const minSignal = 20; // Threshold to start glowing
        const maxSignal = 150; // Maximum expected signal

        if (signal < minSignal) return 0;

        const normalized = (signal - minSignal) / (maxSignal - minSignal);
        return Math.min(Math.max(normalized, 0), 1);
    }

    /**
     * Calculate average of array
     */
    average(arr) {
        if (arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    /**
     * Update electrode visuals (call this in animation loop)
     */
    update(deltaTime = 0.016) {
        // Smooth transition to target intensity
        const lerpFactor = 1 - Math.pow(0.1, deltaTime);

        this.glowIntensity.ch0 += (this.targetIntensity.ch0 - this.glowIntensity.ch0) * lerpFactor;
        this.glowIntensity.ch1 += (this.targetIntensity.ch1 - this.glowIntensity.ch1) * lerpFactor;
        this.glowIntensity.ch2 += (this.targetIntensity.ch2 - this.glowIntensity.ch2) * lerpFactor;

        // Update each electrode
        this.electrodes.forEach((electrode, name) => {
            const { mesh, channel, baseEmissive, baseEmissiveIntensity } = electrode;
            const intensity = this.glowIntensity[`ch${channel}`];

            // Update emissive intensity for glow effect
            // Keep max low to preserve color - high values wash out to white
            const maxIntensity = 1.5;
            mesh.material.emissiveIntensity = baseEmissiveIntensity + (intensity * maxIntensity);

            // Optional: Add pulsing effect for high activity
            if (intensity > 0.7) {
                const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
                mesh.material.emissiveIntensity *= pulse;
            }
        });
    }

    /**
     * Reset all electrodes to base state
     */
    reset() {
        this.signalHistory = { ch0: [], ch1: [], ch2: [] };
        this.glowIntensity = { ch0: 0, ch1: 0, ch2: 0 };
        this.targetIntensity = { ch0: 0, ch1: 0, ch2: 0 };

        this.electrodes.forEach((electrode) => {
            const { mesh, baseEmissiveIntensity } = electrode;
            mesh.material.emissiveIntensity = baseEmissiveIntensity;
        });
    }

    /**
     * Get current intensity values
     */
    getIntensities() {
        return {
            ch0: this.glowIntensity.ch0,
            ch1: this.glowIntensity.ch1,
            ch2: this.glowIntensity.ch2
        };
    }
}

export default new ElectrodeController();

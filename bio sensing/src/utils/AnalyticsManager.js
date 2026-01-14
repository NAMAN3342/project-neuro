/**
 * AnalyticsManager - Frontend logic for state detection and thermal prediction
 * Ported from the Python AnalyticsEngine for consistent behavior across modes.
 */

class AnalyticsManager {
    constructor(historyLength = 60) {
        this.historyLength = historyLength;
        this.tempHistory = {
            t1: [], t2: [], t3: [], t4: [], t5: []
        };
        this.stateHistory = [];
        this.DANGER_TEMP = 39.0; // In raw units (approx mapping) or Celsius?
        // Note: Frontend UI uses "raw" 400-700 units for compatibility.
        // We need to keep this in mind.
    }

    process(signals, temperatures, brainActivity) {
        // Update history
        Object.keys(temperatures).forEach(tid => {
            // Only process known sensors (t1-t5)
            if (this.tempHistory[tid]) {
                this.tempHistory[tid].push(temperatures[tid]);
                if (this.tempHistory[tid].length > this.historyLength) {
                    this.tempHistory[tid].shift();
                }
            }
        });

        const currentState = this.detectCognitiveState(brainActivity);
        this.stateHistory.push(currentState);
        if (this.stateHistory.length > 10) this.stateHistory.shift();

        const metrics = this.getRecentMetrics(brainActivity);

        return {
            state: this.getSmoothedState(),
            predictions: this.predictThermalTrends(),
            fatigueIndex: metrics.energy, // Map energy to fatigue prop for backward compat if needed
            metrics: metrics, // The full suite: focus, stress, relax, energy
            anomalies: this.detectAnomalies(temperatures)
        };
    }

    detectCognitiveState(brainActivity) {
        // Map 3 physical channels to 6 virtual regions for the algorithms
        // Ch0 -> Frontal (Fp1, Fp2)
        // Ch1 -> Central (C3, C4)
        // Ch2 -> Occipital (O1, O2)

        if (!brainActivity || !brainActivity.ch0) return "Initializing...";

        const fp1 = brainActivity.ch0; // Frontal Left
        const fp2 = brainActivity.ch0; // Frontal Right (duplicated)
        const c3 = brainActivity.ch1; // Central Left
        const c4 = brainActivity.ch1; // Central Right
        const o1 = brainActivity.ch2; // Occipital Left
        const o2 = brainActivity.ch2; // Occipital Right

        // 1. FOCUS (Low Theta, High Beta)
        // Theta/Beta Ratio (Inverse Focus)
        // Lower is better. Typical range 2.0 (good) to 6.0 (poor)
        const avgTheta = (fp1.theta + fp2.theta + c3.theta + c4.theta) / 4;
        const avgBeta = (fp1.beta + fp2.beta + c3.beta + c4.beta) / 4;
        const thetaBeta = avgTheta / (avgBeta + 0.0001);
        // Normalize: (6 - ratio) / 4 * 100 -> clamped 0-100
        const focusScore = Math.max(0, Math.min(100, ((3.0 - thetaBeta) / 2.0) * 100)); // Adjusted scale for active BCI

        // 2. STRESS (High Beta/Alpha in Frontal)
        const betaAlpha = fp1.beta / (fp1.alpha + 0.0001);
        // Range 0.5 (calm) to 2.0 (stressed)
        const stressScore = Math.max(0, Math.min(100, ((betaAlpha - 0.5) / 1.5) * 100));

        // 3. RELAXATION (High Alpha in Occipital)
        // Alpha/Beta ratio
        const oAlpha = (o1.alpha + o2.alpha) / 2;
        const oBeta = (o1.beta + o2.beta) / 2;
        const relaxRatio = oAlpha / (oBeta + 0.0001);
        const relaxScore = Math.max(0, Math.min(100, (relaxRatio / 2.0) * 100));

        // 4. ENERGY / FATIGUE (High Theta+Delta)
        const fatigueIndex = (avgTheta + fp1.delta) / (avgBeta + 0.0001);
        // Inverse for Energy
        const energyScore = Math.max(0, Math.min(100, 100 - (fatigueIndex * 20)));

        // Determine State Label
        if (stressScore > 70) return "High Stress";
        if (focusScore > 60) return "Deep Focus";
        if (relaxScore > 60) return "Relaxed";
        if (energyScore < 30) return "Fatigued";
        return "Balanced";
    }

    getSmoothedState() {
        if (this.stateHistory.length === 0) return "Unknown";
        // Simple mode (most frequent state)
        const counts = {};
        for (const s of this.stateHistory) {
            counts[s] = (counts[s] || 0) + 1;
        }
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    // Helper to return the numeric scores for the UI
    getRecentMetrics(brainActivity) {
        // Re-run calculation or cache it. 
        // For simplicity, re-running the core logic used in detectState
        if (!brainActivity || !brainActivity.ch0) return { focus: 0, stress: 0, relax: 0, energy: 0 };

        const fp1 = brainActivity.ch0;
        const c3 = brainActivity.ch1;
        const o1 = brainActivity.ch2;

        const avgTheta = (fp1.theta + c3.theta) / 2;
        const avgBeta = (fp1.beta + c3.beta) / 2;
        const thetaBeta = avgTheta / (avgBeta + 0.0001);
        const focus = Math.max(0, Math.min(100, ((3.0 - thetaBeta) / 2.0) * 100));

        const betaAlpha = fp1.beta / (fp1.alpha + 0.0001);
        const stress = Math.max(0, Math.min(100, ((betaAlpha - 0.5) / 1.5) * 100));

        const relaxRatio = o1.alpha / (o1.beta + 0.0001);
        const relax = Math.max(0, Math.min(100, (relaxRatio / 2.0) * 100));

        const fatigue = (avgTheta + fp1.delta) / (avgBeta + 0.0001);
        const energy = Math.max(0, Math.min(100, 100 - (fatigue * 20)));

        return { focus, stress, relax, energy };
    }

    calculateFatigue(brainActivity) {
        // Redundant with new getRecentMetrics, keeping for compatibility if called elsewhere
        return 0; // Handled in getRecentMetrics now
    }

    predictThermalTrends() {
        const predictions = {};
        Object.keys(this.tempHistory).forEach(tid => {
            const history = this.tempHistory[tid];
            if (history.length < 10) {
                predictions[tid] = { status: "stable", trend: 0 };
                return;
            }

            // Simple slope calculation (last 10 vs first 10 of window)
            const recent = history.slice(-10).reduce((a, b) => a + b) / 10;
            const older = history.slice(0, 10).reduce((a, b) => a + b) / 10;
            const slope = (recent - older) / history.length;

            let status = "stable";
            if (slope > 0.5) status = "rising";
            if (slope < -0.5) status = "falling";

            predictions[tid] = {
                status,
                trend: slope,
                isWarning: recent > 650 // Raw units threshold
            };
        });
        return predictions;
    }

    detectAnomalies(temperatures) {
        const anomalies = [];
        Object.keys(temperatures).forEach(tid => {
            const val = temperatures[tid];
            if (val > 680) { // Approx 38.5C in raw units
                anomalies.push({ sensor: tid, type: "High Temperature", val });
            }
        });
        return anomalies;
    }

    reset() {
        Object.keys(this.tempHistory).forEach(tid => this.tempHistory[tid] = []);
        this.stateHistory = [];
    }
}

export default new AnalyticsManager();

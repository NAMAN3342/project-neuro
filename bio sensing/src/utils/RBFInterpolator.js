/**
 * RBF (Radial Basis Function) Interpolator
 * Fast matrix-based interpolation for thermal heatmap
 * Pre-computes weight matrix for O(1) interpolation
 */

// Sensor positions (normalized -1 to 1)
// Front is UP (Y=-1), Back is DOWN (Y=1)
const SENSOR_COORDS = [
    [-0.3, -0.8], // T1: Front Left (Fp1)
    [0.3, -0.8], // T2: Front Right (Fp2)
    [-0.6, 0.0], // T3: Center Left (C3)
    [0.6, 0.0], // T4: Center Right (C4)
    [0.0, 0.8]  // T5: Back (Occipital)
];

class RBFInterpolator {
    constructor(resolution = 64) {
        this.resolution = resolution;
        this.weightMatrix = null;
        this.gridCoords = [];

        this.precomputeWeights();
    }

    /**
     * Pre-compute interpolation weight matrix
     * This is the heavy math done once at initialization
     */
    precomputeWeights() {
        const res = this.resolution;
        const numSensors = SENSOR_COORDS.length;

        // 1. Generate target grid coordinates
        this.gridCoords = [];
        for (let y = 0; y < res; y++) {
            for (let x = 0; x < res; x++) {
                const nx = (x / (res - 1)) * 2 - 1; // Map to -1..1
                const ny = (y / (res - 1)) * 2 - 1;
                this.gridCoords.push([nx, ny]);
            }
        }

        // 2. Compute distance matrices
        // Distance between sensors (5x5 matrix)
        const sensorDist = this.computeDistanceMatrix(SENSOR_COORDS, SENSOR_COORDS);

        // Apply Gaussian kernel
        const phiSensors = this.applyGaussianKernel(sensorDist);

        // Add regularization to prevent singular matrix
        for (let i = 0; i < numSensors; i++) {
            phiSensors[i][i] += 1e-6;
        }

        // Distance between grid points and sensors (4096x5 matrix)
        const gridDist = this.computeDistanceMatrix(this.gridCoords, SENSOR_COORDS);
        const phiGrid = this.applyGaussianKernel(gridDist);

        // 3. Solve for weights: W = inv(phiSensors) * phiGrid^T
        const phiSensorsInv = this.matrixInverse(phiSensors);
        this.weightMatrix = this.matrixMultiply(phiGrid, phiSensorsInv);
    }

    /**
     * Compute Euclidean distance matrix
     */
    computeDistanceMatrix(points1, points2) {
        const matrix = [];
        for (let i = 0; i < points1.length; i++) {
            const row = [];
            for (let j = 0; j < points2.length; j++) {
                const dx = points1[i][0] - points2[j][0];
                const dy = points1[i][1] - points2[j][1];
                const dist = Math.sqrt(dx * dx + dy * dy);
                row.push(dist);
            }
            matrix.push(row);
        }
        return matrix;
    }

    /**
     * Apply Gaussian RBF kernel: exp(-0.5 * d^2)
     */
    applyGaussianKernel(distMatrix) {
        return distMatrix.map(row =>
            row.map(d => Math.exp(-0.5 * d * d))
        );
    }

    /**
     * Matrix multiplication: A * B
     */
    matrixMultiply(A, B) {
        const result = [];
        for (let i = 0; i < A.length; i++) {
            const row = [];
            for (let j = 0; j < B[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < B.length; k++) {
                    sum += A[i][k] * B[k][j];
                }
                row.push(sum);
            }
            result.push(row);
        }
        return result;
    }

    /**
     * Matrix inversion using Gauss-Jordan elimination
     * For small 5x5 matrix
     */
    matrixInverse(matrix) {
        const n = matrix.length;
        const augmented = matrix.map((row, i) => [
            ...row,
            ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))
        ]);

        // Forward elimination
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = k;
                }
            }
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

            // Make diagonal 1
            const divisor = augmented[i][i];
            for (let j = 0; j < 2 * n; j++) {
                augmented[i][j] /= divisor;
            }

            // Eliminate column
            for (let k = 0; k < n; k++) {
                if (k !== i) {
                    const factor = augmented[k][i];
                    for (let j = 0; j < 2 * n; j++) {
                        augmented[k][j] -= factor * augmented[i][j];
                    }
                }
            }
        }

        // Extract inverse from augmented matrix
        return augmented.map(row => row.slice(n));
    }

    /**
     * Interpolate temperature values to full grid with distance-based falloff
     * @param {Array} sensorValues - Array of 5 temperature values (can be null)
     * @returns {Array} 2D array of interpolated values with falloff, or null if no valid data
     */
    interpolate(sensorValues) {
        if (sensorValues.length !== 5) {
            console.error('Expected 5 sensor values');
            return null;
        }

        // Check if we have any valid sensor data
        const validValues = sensorValues.filter(v => v !== null && v > 0);
        if (validValues.length === 0) {
            // No valid data, return null grid
            return null;
        }

        // Replace null values with average of valid values for interpolation
        const avgTemp = validValues.reduce((a, b) => a + b, 0) / validValues.length;
        const processedValues = sensorValues.map(v => (v === null || v <= 0) ? avgTemp : v);

        // Matrix multiplication: gridValues = weightMatrix * sensorValues
        const gridValues = this.weightMatrix.map(row =>
            row.reduce((sum, weight, i) => sum + weight * processedValues[i], 0)
        );

        // Reshape to 2D grid with distance-based falloff
        const grid = [];
        const falloffRadius = 0.4; // Only show heatmap within this radius of sensors (normalized)

        for (let y = 0; y < this.resolution; y++) {
            const row = [];
            for (let x = 0; x < this.resolution; x++) {
                const gridCoord = this.gridCoords[y * this.resolution + x];

                // Calculate minimum distance to any VALID sensor
                let minDist = Infinity;
                for (let i = 0; i < SENSOR_COORDS.length; i++) {
                    // Only consider distance to sensors with valid data
                    if (sensorValues[i] !== null && sensorValues[i] > 0) {
                        const dx = gridCoord[0] - SENSOR_COORDS[i][0];
                        const dy = gridCoord[1] - SENSOR_COORDS[i][1];
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        minDist = Math.min(minDist, dist);
                    }
                }

                // Apply falloff: if too far from any sensor, set to null (transparent)
                let value;
                if (minDist > falloffRadius) {
                    value = null; // No data - will be transparent
                } else {
                    // Smooth falloff using cosine interpolation
                    const falloff = Math.cos((minDist / falloffRadius) * Math.PI * 0.5);
                    value = gridValues[y * this.resolution + x] * falloff;
                }

                row.push(value);
            }
            grid.push(row);
        }

        return grid;
    }

    /**
     * Get sensor coordinates for overlay
     */
    getSensorCoords() {
        return SENSOR_COORDS;
    }
}

export default RBFInterpolator;

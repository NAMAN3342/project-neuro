import WaveformPlot from './WaveformPlot';
import HeatmapCanvas from './HeatmapCanvas';

export default function ControlPanel({
    onConnect,
    onDisconnect,
    onTestingModeToggle,
    isConnected,
    isTestingMode,
    signalData,
    temperatureData,
    analytics
}) {
    return (
        <>
            {/* Top Menu Bar */}
            <div className="top-menu-bar">
                <div className="menu-left">
                    <h2><strong>🧠 BIO SENSING</strong></h2>
                    <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                        <div className="status-dot"></div>
                        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                </div>

                <div className="menu-center">
                    {!isConnected ? (
                        <button className="btn-primary btn-connect" onClick={onConnect}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                            Connect Arduino
                        </button>
                    ) : (
                        <button className="btn-secondary btn-disconnect" onClick={onDisconnect}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            Disconnect
                        </button>
                    )}
                </div>

                <div className="menu-right">
                    <div className="toggle-group-horizontal">
                        <label className="toggle-label">
                            <span>Testing Mode</span>
                        </label>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={isTestingMode}
                                onChange={(e) => onTestingModeToggle(e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Left Side Panel - Waveforms and Temperatures */}
            <div className="left-side-panel">
                {/* Signal Waveforms */}
                <div className="waveforms-section">
                    <h3>Signal Waveforms</h3>

                    <div className="waveform-item">
                        <div className="waveform-header">
                            <span className="waveform-label">Channel 0 - Fp1, Fp2</span>
                            <span className="waveform-value">{signalData?.ch0?.toFixed(1) || '0.0'}</span>
                        </div>
                        <WaveformPlot
                            signalData={signalData?.ch0}
                            channelName="Channel 0"
                            baseColor="#3b82f6"
                            isActive={isConnected || isTestingMode}
                            width={320}
                            height={70}
                        />
                    </div>

                    <div className="waveform-item">
                        <div className="waveform-header">
                            <span className="waveform-label">Channel 1 - C3, C4</span>
                            <span className="waveform-value">{signalData?.ch1?.toFixed(1) || '0.0'}</span>
                        </div>
                        <WaveformPlot
                            signalData={signalData?.ch1}
                            channelName="Channel 1"
                            baseColor="#fbbf24"
                            isActive={isConnected || isTestingMode}
                            width={320}
                            height={70}
                        />
                    </div>

                    <div className="waveform-item">
                        <div className="waveform-header">
                            <span className="waveform-label">Channel 2 - O1, O2</span>
                            <span className="waveform-value">{signalData?.ch2?.toFixed(1) || '0.0'}</span>
                        </div>
                        <WaveformPlot
                            signalData={signalData?.ch2}
                            channelName="Channel 2"
                            baseColor="#a78bfa"
                            isActive={isConnected || isTestingMode}
                            width={320}
                            height={70}
                        />
                    </div>
                </div>

                {/* Temperature Sensors */}
                <div className="temperatures-section">
                    <h3>Temperature Sensors</h3>
                    <div className="temp-grid">
                        {temperatureData && Object.entries(temperatureData)
                            .filter(([key]) => key.startsWith('t') && /^t[1-5]$/.test(key)) // Only show t1-t5
                            .map(([key, value]) => {
                                const sensorNum = key.replace('t', '');
                                // Use direct celsius value if available (from SerialManager update), else fallback
                                const celsiusVal = temperatureData.celsius ? temperatureData.celsius[key] : ((value - 400) / 300 * 3 + 35);

                                const displayStr = celsiusVal > 0 ? `${celsiusVal.toFixed(1)}°C` : 'OFF';

                                let color = '#334155'; // Default slate (off)
                                if (celsiusVal > 0) {
                                    color = '#3b82f6'; // Blue
                                    if (celsiusVal > 36) color = '#10b981'; // Green
                                    if (value > 600 || celsiusVal > 38) color = '#fbbf24'; // Yellow
                                    if (value > 650 || celsiusVal > 40) color = '#ef4444'; // Red
                                }

                                return (
                                    <div key={key} className="temp-card">
                                        <div className="temp-indicator" style={{ backgroundColor: color }}></div>
                                        <div className="temp-info">
                                            <span className="temp-label">T{sensorNum}</span>
                                            <span className="temp-value">{displayStr}</span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* Detection & Insights */}
                <div className="insights-section">
                    <h3>Detection & Insights</h3>

                    <div className="state-card">
                        <span className="state-label">Cognitive State</span>
                        <div className="state-value-container">
                            <div className="pulse-dot"></div>
                            <span className="state-value">{analytics?.state || 'Analyzing...'}</span>
                        </div>
                        <div className="fatigue-bar-container">
                            <span className="fatigue-label">Fatigue Index</span>
                            <div className="fatigue-track">
                                <div className="fatigue-fill" style={{ width: `${(analytics?.fatigueIndex || 0) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="predictions-summary">
                        {analytics?.predictions && Object.entries(analytics.predictions).some(([_, p]) => p.status !== 'stable') && (
                            <div className="trend-alert">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M13 3h8v8" /><path d="M10 21l11-11" /><path d="M3 21l8-8" />
                                </svg>
                                <span>Thermal Activity Detected</span>
                            </div>
                        )}
                        {analytics?.anomalies?.length > 0 && (
                            <div className="anomaly-alert">
                                <span className="blink">⚠️ {analytics.anomalies[0].type}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* System Info */}
                <div className="system-info">
                    <div className="info-row">
                        <span>Sample Rate</span>
                        <span>125 Hz</span>
                    </div>
                    <div className="info-row">
                        <span>Baud Rate</span>
                        <span>115200</span>
                    </div>
                </div>
            </div>

            {/* Bottom Right Heatmap */}
            <div className="heatmap-container-bottom-right">
                <h3>Thermal Distribution</h3>
                <HeatmapCanvas
                    temperatures={{
                        t1: temperatureData?.celsius?.t1 || 0,
                        t2: temperatureData?.celsius?.t2 || 0,
                        t3: temperatureData?.celsius?.t3 || 0,
                        t4: temperatureData?.celsius?.t4 || 0,
                        t5: temperatureData?.celsius?.t5 || 0,
                    }}
                    width={400}
                    height={400}
                />
            </div>
        </>
    );
}

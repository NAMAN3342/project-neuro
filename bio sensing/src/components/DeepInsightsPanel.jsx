import { useState } from 'react';

/**
 * DeepInsightsPanel - Advanced health monitoring dashboard
 * Displays Burnout Shield, Safety Co-Pilot, and Meditation Coach
 */
export default function DeepInsightsPanel({ analytics, isVisible }) {
    if (!isVisible) return null;

    const burnout = analytics?.burnout_shield || { status: 'analyzing' };
    const safety = analytics?.safety_copilot || { status: 'alert', alertness: 100 };
    const meditation = analytics?.meditation_coach || { score: 0, depth: 'unknown' };

    return (
        <div className="deep-insights-panel">
            <div className="deep-insights-header">
                <h2>🧠 HEALTH MONITORING</h2>
            </div>

            {/* Health Status Cards */}
            <div className="health-cards-grid">
                {/* Burnout Shield */}
                <div className={`health-card burnout-${burnout.status}`}>
                    <div className="health-card-header">
                        <span className="health-icon">🛡️</span>
                        <span className="health-title">Burnout Shield</span>
                    </div>
                    <div className="health-status">
                        {burnout.status === 'flow' && <span className="status-badge flow">FLOW STATE</span>}
                        {burnout.status === 'stress' && <span className="status-badge stress">STRESS DETECTED</span>}
                        {burnout.status === 'normal' && <span className="status-badge normal">NORMAL</span>}
                        {burnout.status === 'analyzing' && <span className="status-badge analyzing">ANALYZING...</span>}
                    </div>
                    {burnout.message && (
                        <div className="health-message">{burnout.message}</div>
                    )}
                    {burnout.recommendation && (
                        <div className="health-recommendation">💡 {burnout.recommendation}</div>
                    )}
                </div>

                {/* Safety Co-Pilot */}
                <div className={`health-card safety-${safety.status}`}>
                    <div className="health-card-header">
                        <span className="health-icon">🚨</span>
                        <span className="health-title">Safety Co-Pilot</span>
                    </div>
                    <div className="health-status">
                        {safety.status === 'danger' && <span className="status-badge danger blink">⚠️ DANGER</span>}
                        {safety.status === 'warning' && <span className="status-badge warning">WARNING</span>}
                        {safety.status === 'alert' && <span className="status-badge safe">ALERT</span>}
                    </div>
                    <div className="alertness-container">
                        <span className="alertness-label">Alertness</span>
                        <div className="alertness-bar">
                            <div
                                className="alertness-fill"
                                style={{ width: `${safety.alertness || 0}%` }}
                            />
                        </div>
                        <span className="alertness-value">{Math.round(safety.alertness || 0)}%</span>
                    </div>
                    {safety.message && (
                        <div className="health-message">{safety.message}</div>
                    )}
                </div>

                {/* Meditation Coach */}
                <div className={`health-card meditation-${meditation.depth}`}>
                    <div className="health-card-header">
                        <span className="health-icon">🧘</span>
                        <span className="health-title">Meditation Coach</span>
                    </div>
                    <div className="health-status">
                        {meditation.depth === 'deep' && <span className="status-badge deep">DEEP</span>}
                        {meditation.depth === 'relaxed' && <span className="status-badge relaxed">RELAXED</span>}
                        {meditation.depth === 'distracted' && <span className="status-badge distracted">DISTRACTED</span>}
                    </div>
                    <div className="meditation-score">
                        <div className="score-circle" style={{
                            background: `conic-gradient(var(--accent-cyan) ${(meditation.score || 0) * 360}deg, rgba(255,255,255,0.1) 0deg)`
                        }}>
                            <div className="score-inner">
                                <span className="score-value">{Math.round((meditation.score || 0) * 100)}</span>
                                <span className="score-label">Quality</span>
                            </div>
                        </div>
                    </div>
                    {meditation.message && (
                        <div className="health-message">{meditation.message}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

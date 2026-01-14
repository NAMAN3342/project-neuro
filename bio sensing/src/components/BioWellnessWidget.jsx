import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity, 
  Brain, 
  Zap, 
  Leaf, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Wifi, 
  WifiOff, 
  Loader2
} from 'lucide-react';

// ==========================================
// 10-SECOND AVERAGING SIGNAL PROCESSOR
// ==========================================
const use10SecondAveraging = (analytics, isConnected) => {
  const [averagedMetrics, setAveragedMetrics] = useState({
    focus: 0,
    stress: 0,
    relax: 0,
    energy: 0
  });
  
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [sampleCount, setSampleCount] = useState(0);
  const samplesBuffer = useRef([]); // Samples collected in current 10s window
  const historyBuffer = useRef([]); // History of averaged values for AI
  const AVERAGING_WINDOW = 10000; // 10 seconds in milliseconds

  // Collect samples when analytics change
  useEffect(() => {
    if (!isConnected || !analytics?.metrics) return;

    const now = Date.now();
    const sample = {
      focus: analytics.metrics.focus || 0,
      stress: analytics.metrics.stress || 0,
      relax: analytics.metrics.relax || 0,
      energy: analytics.metrics.energy || 0,
      timestamp: now
    };

    // Add sample to buffer
    samplesBuffer.current.push(sample);

    // Remove samples older than 10 seconds
    const cutoff = now - AVERAGING_WINDOW;
    samplesBuffer.current = samplesBuffer.current.filter(s => s.timestamp >= cutoff);
    
    // Update sample count for UI
    setSampleCount(samplesBuffer.current.length);

  }, [analytics, isConnected]);

  // Calculate and update averages every 10 seconds
  useEffect(() => {
    if (!isConnected) {
      setAveragedMetrics({ focus: 0, stress: 0, relax: 0, energy: 0 });
      samplesBuffer.current = [];
      return;
    }

    const intervalId = setInterval(() => {
      const samples = samplesBuffer.current;
      
      if (samples.length === 0) return;

      // Calculate averages
      const avg = {
        focus: samples.reduce((sum, s) => sum + s.focus, 0) / samples.length,
        stress: samples.reduce((sum, s) => sum + s.stress, 0) / samples.length,
        relax: samples.reduce((sum, s) => sum + s.relax, 0) / samples.length,
        energy: samples.reduce((sum, s) => sum + s.energy, 0) / samples.length
      };

      setAveragedMetrics(avg);
      setLastUpdateTime(Date.now());

      // Store in history for AI (keep last 6 averages = 1 minute of data)
      historyBuffer.current.push({ ...avg, timestamp: Date.now(), sampleCount: samples.length });
      if (historyBuffer.current.length > 6) historyBuffer.current.shift();

      console.log(`[Bio-Wellness] 10s Average (${samples.length} samples):`, 
        `Focus: ${avg.focus.toFixed(1)}%`, 
        `Stress: ${avg.stress.toFixed(1)}%`,
        `Relax: ${avg.relax.toFixed(1)}%`,
        `Energy: ${avg.energy.toFixed(1)}%`
      );

    }, AVERAGING_WINDOW); // Update every 10 seconds

    return () => clearInterval(intervalId);
  }, [isConnected]);

  // Reset when disconnected
  useEffect(() => {
    if (!isConnected) {
      samplesBuffer.current = [];
      historyBuffer.current = [];
    }
  }, [isConnected]);

  return { 
    metrics: averagedMetrics, 
    historyBuffer, 
    lastUpdateTime,
    sampleCount 
  };
};

// Color mappings
const colors = {
  blue: { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', gradient: 'linear-gradient(to right, #2563eb, #60a5fa)' },
  amber: { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24', gradient: 'linear-gradient(to right, #d97706, #fbbf24)' },
  emerald: { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399', gradient: 'linear-gradient(to right, #059669, #34d399)' },
  indigo: { bg: 'rgba(99, 102, 241, 0.1)', text: '#818cf8', gradient: 'linear-gradient(to right, #4f46e5, #818cf8)' }
};

// ==========================================
// COMPACT UI COMPONENTS
// ==========================================

const CompactMetricRow = ({ label, value, type, icon: Icon, color }) => {
  let statusColor = '#94a3b8';
  
  if (type === 'stress') {
    statusColor = value < 30 ? '#34d399' : value < 60 ? '#fbbf24' : '#fb7185';
  } else {
    statusColor = value < 30 ? '#fb7185' : value < 70 ? '#93c5fd' : '#34d399';
  }

  const colorSet = colors[color] || colors.blue;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
      <div style={{ 
        padding: '6px', 
        borderRadius: '8px', 
        backgroundColor: colorSet.bg,
        color: colorSet.text
      }}>
        <Icon size={14} />
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#cbd5e1' }}>{label}</span>
          <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: statusColor }}>{Math.round(value)}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '9999px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              background: colorSet.gradient,
              transition: 'width 0.3s ease',
              width: `${Math.max(0, Math.min(100, value))}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
};

const CompactAI = ({ metrics, historyBuffer }) => {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Gemini API configuration
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const handleAnalyze = async () => {
    setLoading(true);
    setInsight(null);
    setError(null);

    // Use averaged metrics directly
    const currentMetrics = metrics || { focus: 0, stress: 0, relax: 0, energy: 0 };

    // Check if API key is configured
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      setLoading(false);
      // Fallback to local analysis if no API key
      if (currentMetrics.stress > 70) {
        setInsight("⚠️ High stress detected. Recommend deep breathing exercises.");
      } else if (currentMetrics.focus > 70) {
        setInsight("🎯 Excellent focus state! Optimal for complex tasks.");
      } else if (currentMetrics.relax > 70) {
        setInsight("😌 Relaxed state - great for creative work.");
      } else if (currentMetrics.energy < 30) {
        setInsight("⚡ Low energy. Consider a short break.");
      } else {
        setInsight(`Bio-metrics stable. Keep monitoring your state.`);
      }
      return;
    }

    // Calculate trends from history
    const getTrend = (key) => {
      if (historyBuffer.current.length < 3) return 'stable';
      const recent = historyBuffer.current.slice(-5);
      const first = recent[0]?.[key] || 0;
      const last = recent[recent.length - 1]?.[key] || 0;
      const diff = last - first;
      if (diff > 10) return 'rising';
      if (diff < -10) return 'falling';
      return 'stable';
    };

    // Build prompt for Gemini (aggregated data only, no raw EEG)
    const systemPrompt = `You are a neurofeedback wellness advisor analyzing EEG-derived biometrics. 
Provide a brief, actionable insight (2-3 sentences max) based on the data. 
Be encouraging and practical. Focus on wellness recommendations.`;

    const historyInfo = historyBuffer.current.length > 1 
      ? `\nHistory (${historyBuffer.current.length} x 10-second averages): ${historyBuffer.current.map(h => 
          `Focus:${Math.round(h.focus)}% Stress:${Math.round(h.stress)}%`).join(' → ')}`
      : '';

    const userPrompt = `10-Second Averaged Metrics (Neurofeedback Standard):
- Focus/Cognitive Load: ${Math.round(currentMetrics.focus)}% (${getTrend('focus')})
- Stress Level: ${Math.round(currentMetrics.stress)}% (${getTrend('stress')})
- Relaxation (Alpha): ${Math.round(currentMetrics.relax)}% (${getTrend('relax')})
- Mental Energy: ${Math.round(currentMetrics.energy)}% (${getTrend('energy')})
${historyInfo}

Provide a personalized wellness insight based on these readings.`;

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API Error ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (aiText) {
        console.log('[Gemini API] Success:', aiText);
        setInsight(aiText.trim());
      } else {
        throw new Error('No response from Gemini');
      }
    } catch (err) {
      console.error('[Gemini API] Error:', err);
      setError(err.message);
      // Fallback insight
      if (currentMetrics.stress > 50) {
        setInsight("Elevated stress detected. Try deep breathing for 2 minutes.");
      } else {
        setInsight(`Bio-metrics stable. Keep monitoring your wellness state.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(30, 41, 59, 0.5)' }}>
      {!insight && !loading && (
        <button 
          onClick={handleAnalyze}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            color: '#a5b4fc',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.2)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'}
        >
          <Sparkles size={12} />
          GET AI INSIGHT
        </button>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', fontSize: '10px', color: '#818cf8' }}>
          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          ANALYZING WITH GEMINI AI...
        </div>
      )}

      {error && !insight && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '8px',
          padding: '8px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '10px', color: '#fca5a5' }}>API Error: {error}</span>
        </div>
      )}

      {insight && (
        <div style={{
          backgroundColor: 'rgba(30, 27, 75, 0.4)',
          borderRadius: '8px',
          padding: '10px',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Neuro-Core Insight</span>
            <button 
              onClick={() => { setInsight(null); setError(null); }} 
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
            >
              <ChevronUp size={10}/>
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.4, margin: 0 }}>{insight}</p>
          
          {/* Dismiss button to analyze again */}
          <button 
            onClick={() => { setInsight(null); setError(null); }}
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: 'rgba(100, 116, 139, 0.1)',
              color: '#94a3b8',
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              border: '1px solid rgba(100, 116, 139, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.2)'; e.currentTarget.style.color = '#e2e8f0'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.1)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            DISMISS & ANALYZE AGAIN
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN WIDGET COMPONENT - Uses 10-Second Averaged Arduino Data
// ==========================================

const BioWellnessWidget = ({ analytics, isConnected }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Use 10-second averaged metrics from Arduino
  const { metrics, historyBuffer, lastUpdateTime, sampleCount } = use10SecondAveraging(analytics, isConnected);
  const state = analytics?.state || 'Unknown';

  // Format last update time
  const getTimeSinceUpdate = () => {
    if (!lastUpdateTime) return 'Collecting...';
    const seconds = Math.floor((Date.now() - lastUpdateTime) / 1000);
    return `Updated ${seconds}s ago`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: '90px',
      right: '20px',
      width: '280px',
      zIndex: 1001,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.4; }
          }
        `}
      </style>
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(71, 85, 105, 0.5)'}`,
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        
        {/* HEADER */}
        <div 
          style={{
            padding: '12px',
            borderBottom: '1px solid rgba(30, 41, 59, 0.5)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            backgroundColor: isHovered ? 'rgba(30, 41, 59, 0.3)' : 'transparent',
            transition: 'background-color 0.2s'
          }}
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: isConnected ? '#10b981' : '#f59e0b',
                filter: 'blur(8px)',
                opacity: 0.2,
                animation: 'pulse 2s infinite'
              }}></span>
              <Activity 
                size={16} 
                style={{ 
                  color: isConnected ? '#34d399' : '#94a3b8',
                  position: 'relative',
                  zIndex: 10
                }} 
              />
            </div>
            <div>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'white', margin: 0, letterSpacing: '0.05em' }}>BIO-WELLNESS</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                 {isConnected ? 
                   <Wifi size={8} style={{ color: '#10b981' }} /> : 
                   <WifiOff size={8} style={{ color: '#64748b' }} />
                 }
                 <span style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace' }}>
                   {isConnected ? `10s AVG` : 'NO DATA'}
                 </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isConnected && (
              <span style={{ 
                fontSize: '9px', 
                color: '#60a5fa', 
                backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                padding: '2px 6px', 
                borderRadius: '4px',
                fontWeight: 600
              }}>
                {state}
              </span>
            )}
            <div style={{ color: '#64748b' }}>
              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {isOpen && (
          <div style={{ padding: '12px' }}>
            {!isConnected ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#64748b',
                fontSize: '12px'
              }}>
                <WifiOff size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>Connect Arduino or enable Testing Mode to see real biometric data</p>
              </div>
            ) : (
              <>
                {/* 10-Second Progress Indicator */}
                <div style={{
                  marginBottom: '8px',
                  padding: '6px 10px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(59, 130, 246, 0.1))',
                  borderRadius: '6px',
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '10px', color: '#6366f1', fontWeight: '600' }}>
                      📊 Collecting Samples
                    </span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      {sampleCount} / ~100 samples
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '3px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(100, (sampleCount / 100) * 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1, #3b82f6)',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ 
                    fontSize: '9px', 
                    color: '#94a3b8', 
                    marginTop: '3px',
                    textAlign: 'center'
                  }}>
                    Last update: {lastUpdateTime ? new Date(lastUpdateTime).toLocaleTimeString() : 'Waiting for first 10s cycle...'}
                  </div>
                </div>

                <div>
                  <CompactMetricRow 
                    label="Cognitive Load (Focus)" 
                    value={metrics.focus} 
                    type="focus" 
                    color="blue" 
                    icon={Brain} 
                  />
                  <CompactMetricRow 
                    label="Stress Level" 
                    value={metrics.stress} 
                    type="stress" 
                    color="amber" 
                    icon={Activity} 
                  />
                  <CompactMetricRow 
                    label="Relaxation (Alpha)" 
                    value={metrics.relax} 
                    type="energy" 
                    color="emerald" 
                    icon={Leaf} 
                  />
                  <CompactMetricRow 
                    label="Mental Energy" 
                    value={metrics.energy} 
                    type="energy" 
                    color="indigo" 
                    icon={Zap} 
                  />
                </div>

                <CompactAI metrics={metrics} historyBuffer={historyBuffer} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BioWellnessWidget;

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Minus, X, Clock, Coffee, Zap, Settings, Monitor, Timer as TimerIcon } from 'lucide-react';

const FocusTimer = () => {
  // Store timer state for each mode separately
  const [timerStates, setTimerStates] = useState({
    focus: { timeLeft: 25 * 60, totalTime: 25 * 60, isRunning: false },
    shortBreak: { timeLeft: 5 * 60, totalTime: 5 * 60, isRunning: false },
    longBreak: { timeLeft: 15 * 60, totalTime: 15 * 60, isRunning: false }
  });
  
  const [selectedMode, setSelectedMode] = useState('focus');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    screenGlowEnabled: true,
    glowInterval: 10, // seconds
    overlayTimerEnabled: true,
    lastGlowTime: 0
  });
  const [shouldGlow, setShouldGlow] = useState(false);

  const modes = {
    focus: { duration: 25 * 60, label: 'Focus', icon: Zap, gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
    shortBreak: { duration: 5 * 60, label: 'Short Break', icon: Coffee, gradient: 'linear-gradient(135deg, #10b981, #0d9488)' },
    longBreak: { duration: 15 * 60, label: 'Long Break', icon: Clock, gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current mode's state
  const currentState = timerStates[selectedMode];
  const progress = currentState.totalTime > 0 ? ((currentState.totalTime - currentState.timeLeft) / currentState.totalTime) * 100 : 0;
  const currentMode = modes[selectedMode];

  // Timer effect with glow trigger
  useEffect(() => {
    let interval = null;
    
    if (currentState.isRunning && currentState.timeLeft > 0) {
      interval = setInterval(() => {
        const currentTime = Date.now();
        
        setTimerStates(prev => {
          const newStates = { ...prev };
          if (newStates[selectedMode].timeLeft > 0) {
            newStates[selectedMode] = {
              ...newStates[selectedMode],
              timeLeft: newStates[selectedMode].timeLeft - 1
            };
          } else {
            // Timer completed
            newStates[selectedMode] = {
              ...newStates[selectedMode],
              isRunning: false
            };
            // Show completion notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Timer Complete!', {
                body: `Your ${currentMode.label} session is complete!`,
              });
            }
          }
          return newStates;
        });

        // Check if we should trigger glow effect
        if (settings.screenGlowEnabled && 
            currentTime - settings.lastGlowTime >= settings.glowInterval * 1000) {
          setShouldGlow(true);
          setSettings(prev => ({ ...prev, lastGlowTime: currentTime }));
          
          // Reset glow after 2 seconds
          setTimeout(() => setShouldGlow(false), 2000);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentState.isRunning, currentState.timeLeft, selectedMode, currentMode.label, settings.screenGlowEnabled, settings.glowInterval, settings.lastGlowTime]);

  const handleStart = () => {
    setTimerStates(prev => ({
      ...prev,
      [selectedMode]: {
        ...prev[selectedMode],
        isRunning: true
      }
    }));
    setSettings(prev => ({ ...prev, lastGlowTime: Date.now() }));
  };

  const handlePause = () => {
    setTimerStates(prev => ({
      ...prev,
      [selectedMode]: {
        ...prev[selectedMode],
        isRunning: false
      }
    }));
  };

  const handleReset = () => {
    const originalDuration = modes[selectedMode].duration;
    setTimerStates(prev => ({
      ...prev,
      [selectedMode]: {
        timeLeft: originalDuration,
        totalTime: originalDuration,
        isRunning: false
      }
    }));
  };

  const handleModeChange = (mode) => {
    if (currentState.isRunning) {
      setTimerStates(prev => ({
        ...prev,
        [selectedMode]: {
          ...prev[selectedMode],
          isRunning: false
        }
      }));
    }
    setSelectedMode(mode);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    if (window.electronAPI) {
      window.electronAPI.minimize();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.close();
    }
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Minimized overlay component
  const MinimizedOverlay = () => (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '280px',
      height: '60px',
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      gap: '12px',
      zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: currentMode.gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <currentMode.icon size={18} color="white" />
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{
          color: 'white',
          fontSize: '18px',
          fontFamily: '"Courier New", monospace',
          fontWeight: 'bold',
          marginBottom: '2px'
        }}>
          {formatTime(currentState.timeLeft)}
        </div>
        <div style={{
          width: '100%',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: currentMode.gradient,
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
      
      <button
        onClick={() => setIsMinimized(false)}
        style={{
          width: '32px',
          height: '32px',
          border: 'none',
          borderRadius: '6px',
          background: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <Monitor size={16} />
      </button>
    </div>
  );

  // Settings panel component
  const SettingsPanel = () => (
    <div style={{
      position: 'absolute',
      top: '60px',
      right: '16px',
      width: '300px',
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      padding: '20px',
      zIndex: 1000,
      color: 'white'
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Settings</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.screenGlowEnabled}
            onChange={(e) => updateSetting('screenGlowEnabled', e.target.checked)}
            style={{ margin: 0 }}
          />
          <span style={{ fontSize: '14px' }}>Screen Glow Effect</span>
        </label>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>
          Glow Interval: {settings.glowInterval}s
        </label>
        <input
          type="range"
          min="5"
          max="300"
          step="5"
          value={settings.glowInterval}
          onChange={(e) => updateSetting('glowInterval', parseInt(e.target.value))}
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            outline: 'none'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
          <span>5s</span>
          <span>5min</span>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.overlayTimerEnabled}
            onChange={(e) => updateSetting('overlayTimerEnabled', e.target.checked)}
            style={{ margin: 0 }}
          />
          <span style={{ fontSize: '14px' }}>Minimized Overlay Timer</span>
        </label>
      </div>

      <div style={{
        padding: '12px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: '1.4'
      }}>
        <strong>Note:</strong> Full screen glow and system overlay features require Electron integration for system-level access.
      </div>
    </div>
  );

  if (isMinimized && settings.overlayTimerEnabled) {
    return <MinimizedOverlay />;
  }

  return (
    <div style={{
      height: '100vh',
      width: '100%',
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(24px)',
      borderRadius: '16px',
      overflow: 'hidden',
      border: shouldGlow && settings.screenGlowEnabled ? '3px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: shouldGlow && settings.screenGlowEnabled 
        ? '0 0 30px rgba(59, 130, 246, 0.8), 0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
        : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      transition: 'all 0.3s ease',
      position: 'relative'
    }}>
      {/* Title Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1))',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            animation: 'pulse 2s infinite'
          }} />
          <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', fontWeight: '500' }}>
            Focus Timer
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleSettings}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: showSettings ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.6)',
              transition: 'all 0.2s ease'
            }}
          >
            <Settings size={12} />
          </button>
          <button
            onClick={handleMinimize}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.6)',
              transition: 'all 0.2s ease'
            }}
          >
            <Minus size={12} />
          </button>
          <button
            onClick={handleClose}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && <SettingsPanel />}

      {/* Mode Selection */}
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '4px'
        }}>
          {Object.entries(modes).map(([key, mode]) => {
            const Icon = mode.icon;
            const isActive = selectedMode === key;
            const hasProgress = timerStates[key].timeLeft < timerStates[key].totalTime;
            
            return (
              <button
                key={key}
                onClick={() => handleModeChange(key)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? mode.gradient : 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: isActive ? '0 4px 14px rgba(0, 0, 0, 0.25)' : 'none',
                  position: 'relative',
                  opacity: hasProgress && !isActive ? 0.7 : 1
                }}
              >
                <Icon size={16} />
                <span>{mode.label}</span>
                {hasProgress && !isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: mode.gradient
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timer Display */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 32px 48px'
      }}>
        {/* Progress Circle */}
        <div style={{ position: 'relative', width: '192px', height: '192px', marginBottom: '32px' }}>
          <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={`url(#gradient-${selectedMode})`}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              style={{
                transition: 'all 0.3s ease-out',
                filter: currentState.isRunning ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' : 'none'
              }}
            />
            <defs>
              <linearGradient id="gradient-focus" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="gradient-shortBreak" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>
              <linearGradient id="gradient-longBreak" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Time display */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '36px',
                fontFamily: '"Courier New", monospace',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: 'white',
                textShadow: currentState.isRunning ? '0 0 20px rgba(59, 130, 246, 0.3)' : 'none'
              }}>
                {formatTime(currentState.timeLeft)}
              </div>
              <div style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {currentMode.label}
              </div>
            </div>
          </div>

          {/* Glow effect */}
          {currentState.isRunning && (
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: currentMode.gradient,
              opacity: 0.2,
              filter: 'blur(24px)',
              animation: 'pulse 2s infinite'
            }} />
          )}
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <button
            onClick={handleReset}
            style={{
              width: '48px',
              height: '48px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.6)'
            }}
          >
            <RotateCcw size={20} />
          </button>
          
          <button
            onClick={currentState.isRunning ? handlePause : handleStart}
            style={{
              width: '64px',
              height: '64px',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              background: currentMode.gradient,
              boxShadow: currentState.isRunning ? '0 0 30px rgba(59, 130, 246, 0.4)' : '0 10px 25px rgba(0,0,0,0.3)'
            }}
          >
            {currentState.isRunning ? (
              <Pause size={24} />
            ) : (
              <Play size={24} style={{ marginLeft: '2px' }} />
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', maxWidth: '300px' }}>
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: currentMode.gradient,
              borderRadius: '2px',
              transition: 'all 0.3s ease-out',
              boxShadow: currentState.isRunning ? '0 0 10px rgba(59, 130, 246, 0.6)' : 'none'
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.4)'
          }}>
            <span>0:00</span>
            <span>{formatTime(currentState.totalTime)}</span>
          </div>
        </div>
      </div>  
    </div>
  );
};

export default FocusTimer;
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Minus, X, Clock, Coffee, Zap, Settings, Monitor } from 'lucide-react';

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
    overlayTimerEnabled: true
  });
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editedTime, setEditedTime] = useState('');

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

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Timer effect with screen glow trigger
  useEffect(() => {
    let interval = null;
    
    if (currentState.isRunning) {
      interval = setInterval(() => {
        setTimerStates(prev => {
          const newStates = { ...prev };
          const currentModeState = newStates[selectedMode];
          
          if (currentModeState.timeLeft > 0) {
            // Decrement timer
            newStates[selectedMode] = {
              ...currentModeState,
              timeLeft: currentModeState.timeLeft - 1
            };
          } else {
            // Timer completed - stop it and reset
            newStates[selectedMode] = {
              ...currentModeState,
              isRunning: false,
              timeLeft: modes[selectedMode].duration,
              totalTime: modes[selectedMode].duration
            };
            
            // Show completion notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`⏰ ${currentMode.label} Complete!`, {
                body: `Great job! Your ${currentMode.label} session is complete!`,
              });
            }
          }
          return newStates;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentState.isRunning, currentState.timeLeft, selectedMode, currentMode.label, modes]);

  const handleStart = () => {
    setTimerStates(prev => ({
      ...prev,
      [selectedMode]: {
        ...prev[selectedMode],
        isRunning: true
      }
    }));
    setSettings(prev => ({ ...prev, lastGlowTime: Date.now() }));
    setIsEditingTime(false);
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
    setIsEditingTime(false);
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

  // Bottom rectangular timer overlay - Compact size with better acrylic effect
  const BottomTimerOverlay = () => (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '280px', // Reduced from 400px
      height: '60px', // Reduced from 80px
      background: 'rgba(20, 20, 30, 0.85)', // Less transparent with slight blue tint
      backdropFilter: 'blur(60px) saturate(150%)', // Enhanced acrylic effect
      WebkitBackdropFilter: 'blur(60px) saturate(150%)', // Safari support
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '30px', // More rounded for compact look
      display: 'flex',
      alignItems: 'center',
      padding: '0',
      zIndex: 99999,
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      overflow: 'hidden'
    }}>
      {/* Progress fill background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: '100%',
        background: currentMode.gradient,
        opacity: 0.25,
        transition: 'width 0.3s ease',
        borderRadius: '30px'
      }} />
      
      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: '0 16px', // Reduced padding
        gap: '12px' // Reduced gap
      }}>
        <div style={{
          width: '36px', // Reduced from 48px
          height: '36px',
          borderRadius: '18px',
          background: currentMode.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}>
          <currentMode.icon size={18} color="white" />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{
            color: 'white',
            fontSize: '18px', // Reduced from 24px
            fontFamily: '"Courier New", monospace',
            fontWeight: 'bold',
            marginBottom: '1px'
          }}>
            {formatTime(currentState.timeLeft)}
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '10px', // Reduced from 12px
            fontWeight: '500'
          }}>
            {currentMode.label} • {Math.round(progress)}%
          </div>
        </div>
        
        <button
          onClick={currentState.isRunning ? handlePause : handleStart}
          style={{
            width: '32px', // Reduced from 40px
            height: '32px',
            border: 'none',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
        >
          {currentState.isRunning ? <Pause size={14} /> : <Play size={14} />}
        </button>
        
        <button
          onClick={() => setIsMinimized(false)}
          style={{
            width: '32px',
            height: '32px',
            border: 'none',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
        >
          <Monitor size={14} />
        </button>
      </div>
    </div>
  );

  // Settings panel component
  const SettingsPanel = () => (
    <div style={{
      position: 'absolute',
      top: '60px',
      right: '16px',
      width: '280px',
      background: 'rgba(30, 30, 40, 0.95)',
      backdropFilter: 'blur(40px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '14px',
      padding: '24px',
      zIndex: 1000,
      color: 'white',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      transition: 'all 0.3s ease'
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        fontSize: '16px',
        fontWeight: '600',
        letterSpacing: '0.5px'
      }}>
        Settings
      </h3>

      <div style={{
        marginBottom: '24px',
        padding: '16px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px'
            }}>
              Bottom Timer Overlay
            </span>
            <span style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.6)'
            }}>
              Show compact timer when minimized
            </span>
          </div>
          <div style={{
            width: '40px',
            height: '20px',
            borderRadius: '10px',
            background: settings.overlayTimerEnabled
              ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
              : 'rgba(255,255,255,0.1)',
            position: 'relative',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              position: 'absolute',
              top: '2px',
              left: settings.overlayTimerEnabled ? '22px' : '2px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease'
            }} />
          </div>
          <input
            type="checkbox"
            checked={settings.overlayTimerEnabled}
            onChange={(e) => updateSetting('overlayTimerEnabled', e.target.checked)}
            style={{
              position: 'absolute',
              opacity: 0,
              width: 0,
              height: 0
            }}
          />
        </label>
      </div>
    </div>
  );

  if (isMinimized && settings.overlayTimerEnabled) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none', // Allow clicks to pass through
        zIndex: 99998
      }}>
        <div style={{ pointerEvents: 'auto' }}> {/* Only the timer itself can be clicked */}
          <BottomTimerOverlay />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      width: '100%',
      background: 'rgba(15, 15, 25, 0.85)', // Less transparent with dark blue tint
      backdropFilter: 'blur(80px) saturate(180%) brightness(120%)', // Enhanced acrylic effect
      WebkitBackdropFilter: 'blur(80px) saturate(180%) brightness(120%)', // Safari support
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      transition: 'all 0.3s ease',
      position: 'relative',
      isolation: 'isolate' // Create new stacking context to block background content
    }}>
      {/* Title Bar with acrylic effect */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        background: 'rgba(255, 255, 255, 0.08)', // Slightly more opaque
        backdropFilter: 'blur(40px) saturate(150%)', // Enhanced acrylic
        WebkitBackdropFilter: 'blur(40px) saturate(150%)', // Safari support
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        WebkitAppRegion: 'drag', // Make title bar draggable
        position: 'relative',
        zIndex: 10 // Ensure it's above any background content
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', WebkitAppRegion: 'no-drag' }}>
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

      {/* Settings Panel with click outside to close */}
      {showSettings && (
        <>
          <div
            onClick={() => setShowSettings(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 999
            }}
          />
          <SettingsPanel />
        </>
      )}

      {/* Mode Selection */}
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          padding: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
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
              <div
                onClick={() => !currentState.isRunning && setIsEditingTime(true)}
                style={{
                  fontSize: '36px',
                  fontFamily: '"Courier New", monospace',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: 'white',
                  textShadow: currentState.isRunning ? '0 0 20px rgba(59, 130, 246, 0.3)' : 'none',
                  cursor: currentState.isRunning ? 'default' : 'pointer'
                }}
              >
                {isEditingTime ? (
                  <input
                    type="text"
                    value={editedTime}
                    onChange={(e) => setEditedTime(e.target.value)}
                    onBlur={() => {
                      const minutes = parseInt(editedTime.split(':')[0]) || 0;
                      const seconds = parseInt(editedTime.split(':')[1]) || 0;
                      const totalSeconds = minutes * 60 + seconds;
                      
                      if (totalSeconds > 0) {
                        setTimerStates(prev => ({
                          ...prev,
                          [selectedMode]: {
                            ...prev[selectedMode],
                            timeLeft: totalSeconds,
                            totalTime: totalSeconds
                          }
                        }));
                        modes[selectedMode].duration = totalSeconds;
                      }
                      
                      setIsEditingTime(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.target.blur();
                      }
                    }}
                    autoFocus
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '2px solid rgba(255,255,255,0.5)',
                      color: 'white',
                      fontSize: '36px',
                      fontFamily: '"Courier New", monospace',
                      fontWeight: 'bold',
                      width: '120px',
                      textAlign: 'center',
                      outline: 'none'
                    }}
                  />
                ) : (
                  formatTime(currentState.timeLeft)
                )}
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

          {/* Subtle glow effect for running timer */}
          {currentState.isRunning && (
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: currentMode.gradient,
              opacity: 0.00005,
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
              backdropFilter: 'blur(20px)',
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

      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.05; }
        }
      `}</style>
    </div>
  );
};

export default FocusTimer;
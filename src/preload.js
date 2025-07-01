// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  close: () => ipcRenderer.invoke('window-close'),
  
  // Timer controls
  startTimer: (duration) => ipcRenderer.invoke('timer-start', duration),
  pauseTimer: () => ipcRenderer.invoke('timer-pause'),
  resetTimer: () => ipcRenderer.invoke('timer-reset'),
  getTimerState: () => ipcRenderer.invoke('get-timer-state'),
  
  // Timer events
  onTimerTick: (callback) => ipcRenderer.on('timer-tick', callback),
  onTimerComplete: (callback) => ipcRenderer.on('timer-complete', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
// For screen border glow
const { screen } = require('electron');
const screenBounds = screen.getPrimaryDisplay().bounds;
// Create borderless overlay window covering entire screen


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;


// For system-wide overlay
const overlayWindow = new BrowserWindow({
  frame: false,
  alwaysOnTop: true,
  skipTaskbar: true,
  // Position above taskbar
});

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    minWidth: 350,
    minHeight: 450,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// App event listeners
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.handle('window-close', () => {
  mainWindow.close();
});

ipcMain.handle('window-drag', () => {
  // This will be handled by CSS drag region
});

// Timer state management
let timerState = {
  isRunning: false,
  timeLeft: 25 * 60, // 25 minutes default
  totalTime: 25 * 60
};

ipcMain.handle('timer-start', (event, duration) => {
  timerState.isRunning = true;
  timerState.totalTime = duration;
  timerState.timeLeft = duration;
  
  const timer = setInterval(() => {
    if (!timerState.isRunning) {
      clearInterval(timer);
      return;
    }
    
    timerState.timeLeft--;
    mainWindow.webContents.send('timer-tick', timerState);
    
    if (timerState.timeLeft <= 0) {
      timerState.isRunning = false;
      clearInterval(timer);
      mainWindow.webContents.send('timer-complete');
    }
  }, 1000);
});

ipcMain.handle('timer-pause', () => {
  timerState.isRunning = false;
});

ipcMain.handle('timer-reset', () => {
  timerState.isRunning = false;
  timerState.timeLeft = timerState.totalTime;
  mainWindow.webContents.send('timer-tick', timerState);
});

ipcMain.handle('get-timer-state', () => {
  return timerState;
});
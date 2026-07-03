const { app, BrowserWindow, Menu, shell, screen } = require('electron');
const path = require('path');

let splashWindow;
let mainWindow;
let createWindowTimer = null;

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 600,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.destroy();
    splashWindow = null;
  }
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: screenWidth,
    height: screenHeight,
    minWidth: 1024,
    minHeight: 700,
    title: 'InvPos - Point of Sale',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Maximize window to use full screen
  mainWindow.maximize();

  // Load the built React app
  const isDev = process.env.ELECTRON_IS_DEV === '1' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:3021');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // When the main window is ready, close splash and show main
  mainWindow.once('ready-to-show', () => {
    closeSplash();
    mainWindow.show();
    mainWindow.focus();
  });

  // If main window fails to load, close splash and quit
  mainWindow.webContents.on('did-fail-load', () => {
    closeSplash();
    app.quit();
  });

  // Open external links in browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Remove menu bar for POS-style kiosk feel
  Menu.setApplicationMenu(null);

  // Clean up timer reference
  if (createWindowTimer) {
    clearTimeout(createWindowTimer);
    createWindowTimer = null;
  }
}

app.whenReady().then(() => {
  createSplash();

  // Show splash for 2.5 seconds then create main window
  createWindowTimer = setTimeout(() => {
    createWindow();
  }, 2500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Ensure all windows are destroyed before quitting
app.on('window-all-closed', () => {
  closeSplash();
  if (createWindowTimer) {
    clearTimeout(createWindowTimer);
    createWindowTimer = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Force quit if something prevents normal shutdown
app.on('before-quit', () => {
  closeSplash();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy();
  }
});

const { app, BrowserWindow, session } = require('electron');
const path = require('path');

// Keep a global reference so the window isn't garbage-collected
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 480,
    minHeight: 360,
    title: 'Streamview',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Allow HTTP streams from an HTTPS-rendered page — the main reason
      // a browser-based player breaks on real IPTV streams
      allowRunningInsecureContent: true,
      webSecurity: false,       // removes CORS enforcement for renderer
    },
  });

  // Remove the default menu bar (File/Edit/View/…)
  win.setMenuBarVisibility(false);

  win.loadFile('index.html');

  win.on('closed', () => { win = null; });
}

app.whenReady().then(() => {
  // Allow all CORS requests so playlists and stream URLs load without a proxy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin':  ['*'],
        'Access-Control-Allow-Headers': ['*'],
        'Access-Control-Allow-Methods': ['GET, POST, OPTIONS, HEAD'],
      },
    });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

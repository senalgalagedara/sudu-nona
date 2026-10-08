const { app, BrowserWindow, shell, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Identify as the stock Chromium this app is built on (no "Electron/x" token).
const plat = process.platform === 'darwin' ? 'Macintosh; Intel Mac OS X 10_15_7'
  : process.platform === 'win32' ? 'Windows NT 10.0; Win64; x64' : 'X11; Linux x86_64';
app.userAgentFallback = `Mozilla/5.0 (${plat}) AppleWebKit/537.36 (KHTML, like Gecko) ` +
  `Chrome/${process.versions.chrome.split('.')[0]}.0.0.0 Safari/537.36`;

// Sites allowed inside the app (the three chats + their sign-in providers).
const ALLOWED = ['claude.ai', 'anthropic.com', 'chatgpt.com', 'openai.com', 'google.com',
  'gstatic.com', 'youtube.com', 'apple.com', 'microsoftonline.com', 'live.com', 'microsoft.com'];
const okHost = u => {
  try {
    const { protocol, hostname: h } = new URL(u);
    return protocol === 'https:' && ALLOWED.some(d => h === d || h.endsWith('.' + d));
  } catch { return false; }
};
const external = u => { if (/^https?:/i.test(u)) shell.openExternal(u); };

app.on('web-contents-created', (_e, wc) => {
  // Sign-in popups stay in-app (same profile session); everything else opens in your browser.
  wc.setWindowOpenHandler(({ url }) => {
    if (okHost(url)) return { action: 'allow', overrideBrowserWindowOptions: { width: 520, height: 720, autoHideMenuBar: true } };
    external(url);
    return { action: 'deny' };
  });
  wc.on('will-navigate', (e, url) => {
    if (wc.getType() === 'webview' && !okHost(url)) { e.preventDefault(); external(url); }
  });
  wc.on('will-attach-webview', (e, prefs, params) => {
    delete prefs.preload;
    prefs.nodeIntegration = false;
    prefs.contextIsolation = true;
    if (!String(params.partition || '').startsWith('persist:sn-') || !okHost(params.src)) e.preventDefault();
  });
});

ipcMain.handle('clear-profile', async (_e, id) => {
  if (!/^[\w-]+$/.test(String(id))) return false;
  const s = session.fromPartition('persist:sn-' + id);
  await s.clearStorageData();
  await s.clearCache();
  return true;
});

function createWindow() {
  const logoJfif = path.join(__dirname, 'logo.jfif');
  const localLogo = path.join(__dirname, 'logo.jpg');
  const uploadedLogo = path.join(app.getPath('home'), '.gemini', 'antigravity-ide', 'brain', '75ca78da-6e1e-42a2-9a73-a703f729daff', '.user_uploaded', 'media_1791442412692.jpg');
  const logoFile = fs.existsSync(logoJfif) ? logoJfif : (fs.existsSync(localLogo) ? localLogo : (fs.existsSync(uploadedLogo) ? uploadedLogo : undefined));

  const win = new BrowserWindow({
    width: 1500, height: 920, minWidth: 960, minHeight: 600,
    title: 'Sudu Nona', autoHideMenuBar: true, backgroundColor: '#303030',
    icon: logoFile,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true, contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

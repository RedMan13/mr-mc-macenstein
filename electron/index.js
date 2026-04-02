const { app, screen, BrowserWindow } = require('electron');
const path = require('path');

/** @type {BrowserWindow} */
let window;
const createOverlayWindow = async () => {
    app.setAppUserModelId('net.godslayerakp.mister-mc-macenstein');
    // Making the overlay window fullscreen breaks some apps that also want to be in fullscreen.
    // The taskbar will stay visible inside of games if we use real fullscreen.
    const display = screen.getPrimaryDisplay();
    const { x, y, width, height } = display.workArea;
    const win = new BrowserWindow({
        icon: path.join(__dirname, '../../assets/icon_o.png'),
        width,
        height,
        sandbox: false,
        transparent: true,
        resizable: false,
        frame: false,
        webPreferences: {
            preload: require.resolve('./preload.js'),
            nodeIntegration: true,
            webSecurity: false
        }
    });

    await win.loadFile(path.join(__dirname, './player.html'));
    win.setIgnoreMouseEvents(true);
    win.setAlwaysOnTop(true, "screen-saver");
    win.setPosition(x, y, false);
    win.blur();
    win.on("close", () => {});

    window = win;
};

app.whenReady().then(() => {
    createOverlayWindow();
    const server = require('express')();
    server.use((req,res,next) => {
        res.header('Access-Control-Allow-Origin', '*');
        next();
    })
    server.get('/cancel', (req,res) => {
        window.webContents.send('cancel', req.query.id);
        res.send('Gaa');
    });
    server.get('/update', (req, res) => {
        window.webContents.send('update', req.query.id, req.query.playing !== 'false', req.query.x, req.query.y, req.query.w, req.query.h);
        res.send(req.query.id ?? 'Goo');
    });
    server.get(/^(?<file>\/.*)/, (req, res) => {
        if (!window) return res.send('Not Yet');
        let file = req.params.file.replace(/^\/?~/, process.env.HOME);
        if (/^\/https?:\/\//i.test(file)) file = file.slice(1);
        console.log('Loading', file);
        if ((req.query.x || req.query.y || req.query.w || req.query.h) && !req.query.id)
            req.query.id = (req.query.x || 0) + (req.query.y || 0) + Math.random();
        window.webContents.send('play', file, req.query.id, req.query.x, req.query.y, req.query.w, req.query.h, req.query.loop === 'true');
        res.send(req.query.id ?? 'Goo');
    });
    server.listen(8080);
});
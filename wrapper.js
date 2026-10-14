// for any future usage of this utility, edit this to reference the correct name and file if package.json is missing or invalid
const package = require('./package.json');
const main = {
    name: package.name,
    spawn: require.resolve('.'),
    args: [],
    options: {
        cwd: __dirname,
        restarts: true
    }
};

const child = require('child_process');
const bodyParser = require('body-parser');
const { WebSocketExpress } = require('websocket-express');
const { getFile, releaseFiles } = require('./statics/log-manager');
const path = require('path');
const usage = require('pidusage');
const fs = require('fs/promises');
let electron;
try {
    electron = require('electron');
} catch (err) { console.warn('No electron!'); }

process.on('uncaughtException', err => {
    // wrapper can not crash under ANY CIRCUMSTANCE
    console.error(err);
    // if an error was thrown, it could have affected the startup of the main process
});

/** @type {{ [key: name]: child.ChildProcessWithoutNullStreams }} */
const spawned = {};
const spawnProc = (name, spawn, args, options) => { args ??= []; options ??= {};
    if (spawned[name]) {
        spawned[name].allowStop = true;
        spawned[name].kill();
    }
    const log = getFile(name);
    log.write(`file: ${spawn}, arguments: ${args}, options: ${JSON.stringify(options)}\n`);
    const sister = /\.[mc]?js$/i.test(spawn) 
        ? child.fork(spawn, Object.assign(options, { stdio: 'pipe', env: { LOG_FILE: log.path } }))
        : child.spawn(spawn, args, Object.assign(options, { stdio: 'pipe', env: { LOG_FILE: log.path } }));
    sister.allowStop = false;
    sister.stdout.pipe(log);
    sister.stderr.pipe(log);
    // sister.stdout.pipe(process.stdout);
    // sister.stderr.pipe(process.stderr);
    sister.spawnOptions = options;
    sister.spawnFile = spawn;
    sister.logFile = log;
    spawned[name] = sister;
    sister.on('message', msg => {
        if (msg.spawn) spawnProc(msg.name, msg.spawn, msg.args, msg.options);
        if (msg.kill) spawned[msg.name].kill();
        if (msg.stop) sister.allowStop = true;
        if (msg.pull) child.exec('git pull', { cwd: __dirname }, (err, stdout, stderr) => {
            stdout += stderr;
            if (stdout.includes('Already up to date.')) return sister.send({ noChanges: true });
            const lines = stdout.split(/\r?\n\r?/g);
            const errors = lines.filter(line => line.startsWith('error:'));
            if (err || stdout.includes('error:')) return sister.send({ couldntMerge: err || stderr || errors });
            const idx = lines.findIndex(line => /files? changed/.test(line));
            const length = parseInt(lines[idx].split(' ')[1]);
            const files = lines.slice(idx - length, idx)
                .map(line => line.split(' | ')[0].trim());
            if (files.some(file => !file.startsWith('commands'))) return sister.send({ restartNeeded: true, updated: files });
            sister.send({ updated: files });
        });
    })
    sister.on('exit', code => {
        if (!(name in spawned)) return;
        delete spawned[name];
        // log.write(`\n Closed because ${code}`);
        releaseFiles(name); 
        if (sister.allowStop && name === 'mister-mc-macenstein') {
            for (const sister of Object.values(spawned)) sister.kill();
            process.exit();
        }
        if (sister.allowStop) return;
        spawnProc(name, spawn, args, options);
    });

    return sister;
}
spawnProc(main.name, main.spawn, main.args, main.options);

const app = new WebSocketExpress();
app.use(bodyParser.json({ type: () => true }));
app.get('/executables', async (req, res) => {
    const allFiles = await fs.readdir(__dirname, { recursive: true, withFileTypes: true });
    const executables = process.platform === 'win32'
        ? process.env.PATHEXT.replaceAll(';', '|').replaceAll('.', '\\.')
        : '\\.appimage|\\.sh|\\/[^.]+';
    const filter = new RegExp(`(?:\\.[mc]?js|${executables})$`, 'i');
    const filtered = allFiles
        .filter(dirent => dirent.isFile())
        .map(dirent => path.relative(__dirname, path.resolve(dirent.parentPath, dirent.name)))
        .filter(name => filter.test(name));
    
    res.send({
        allFiles: filtered,
        defaults: [
            main,
            { name: 'mister-mc-macentstein', spawn: './index.js', options: { restarts: true } },
            { name: 'overlay-manager', spawn: electron, args: ['./electron/index.js'], options: { restarts: true } }
        ]
    })
});
app.get('/spawned', async (req, res) => {
    const report = [];
    for (const [name, sister] of Object.entries(spawned)) {
        const info = await usage(sister.pid);
        report.push({
            name,
            spawn: path.relative(__dirname, sister.spawnFile),
            args: sister.spawnargs,
            options: sister.spawnOptions,
            usage: info.cpu,
            memory: info.memory
        });
    }

    res.json(report);
});
app.put('/spawned/:name', async (req, res) => {
    const msg = req.body;
    const sister = spawnProc(req.params.name, path.resolve(__dirname, msg.spawn), msg.args, msg.options);
    const info = await usage(sister.pid);
    res.json({
        name: req.params.name,
        spawn: path.relative(__dirname, sister.spawnFile),
        args: sister.spawnargs,
        options: sister.spawnOptions,
        usage: info.cpu,
        memory: info.memory
    });
});
app.delete('/spawned/:name', (req, res) => {
    if (!(req.params.name in spawned)) {
        res.status(410); // GONE; the process doesnt exist anymore, and this specific instance will never exist again.
        res.send();
        return;
    }
    spawned[req.params.name].kill();
});
app.get('/logs/:name', async (req, res) => {
    const sister = spawned[req.params.name];
    res.sendFile(sister.logFile.path);
});
app.ws('/logs/:name', async (req, res) => {
    if (!(req.params.name in spawned)) {
        res.status(410); // GONE; the process doesnt exist anymore, and this specific instance will never exist again.
        res.send();
        return;
    }
    const socket = await res.accept();
    const sister = spawned[req.params.name];
    const pipeSocket = data => socket.send(data.toString());
    const exit = () => {
        sister.stdout.off('data', pipeSocket);
        sister.stderr.off('data', pipeSocket);
        socket.close();
    }
    sister.stdout.on('data', pipeSocket);
    sister.stderr.on('data', pipeSocket);
    sister.on('exit', exit);
    socket.onclose = () => {
        sister.stdout.off('data', pipeSocket);
        sister.stderr.off('data', pipeSocket);
        sister.off('exit', exit);
    }
})
app.useHTTP((req, res) => {
    let name = req.path.slice(1);
    if (req.path === '/') name = './panel.html';
    res.sendFile(path.resolve(__dirname, 'assets', name))
});

let port = 2000;
function listen() {
    app.listen(port, error => {
        if (port >= 3000) {
            console.log('Could not get a port open the dashboard.');
            console.error(error);
            return;
        }
        if (error) {
            console.log(`Failed to lock in ${port}`);
            listen(port++);
            return;
        }
        console.log(`Dashboard open to http://localhost:${port}`)
    });
}; listen();
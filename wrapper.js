const child = require('child_process');
const bodyParser = require('body-parser');
const { WebSocketExpress } = require('websocket-express');
const { getFile, releaseFiles } = require('./statics/log-manager');
const path = require('path');
const usage = require('pidusage');
const fs = require('fs/promises');

/** @type {{ [key: name]: child.ChildProcessWithoutNullStreams }} */
const spawned = {};
const spawnProc = (name, spawn, args, options) => { args ??= []; options ??= {};
    if (spawned[name]) spawned[name].kill();
    let allowStop = false;
    const sister = /\.[mc]?js$/i.test(spawn) 
        ? child.fork(spawn, Object.assign(options, { stdio: 'pipe' }))
        : child.spawn(spawn, args, Object.assign(options, { stdio: 'pipe' }));
    const log = getFile(name);
    sister.stdout.pipe(log);
    sister.stderr.pipe(log);
    sister.stdout.pipe(process.stdout);
    sister.stderr.pipe(process.stderr);
    sister.spawnOptions = options;
    sister.spawnFile = spawn;
    spawned[name] = sister;
    sister.on('message', msg => {
        if (msg.spawn) spawnProc(msg.name, msg.spawn, msg.args, msg.options);
        if (msg.kill) spawned[msg.name].kill();
        if (msg.stop) allowStop = true;
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
        log.write(`\n${name} closed with exit code ` + code);
        log.close();
        releaseFiles(name);
        if (!options.restarts) return delete spawned[name];
        if (allowStop && name === 'mister-mc-macenstein') process.exit();
        if (allowStop) return;
        spawnProc(name, spawn, args);
    });

    return sister;
}
spawnProc('mister-mc-macenstein', require.resolve('./index.js'), null, { cwd: __dirname, restarts: true });

const app = new WebSocketExpress();
app.use(bodyParser.json({ type: () => true }));
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
    const dirs = await fs.readdir(path.resolve(__dirname, 'logs', req.params.name)).catch(() => {});
    if (!dirs) {
        res.status(404);
        res.send();
        return;
    }
    res.sendFile(path.resolve(__dirname, 'logs', req.params.name, dirs.at(-1)));
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
    sister.stdout.on('data', pipeSocket);
    sister.stderr.on('data', pipeSocket);
    socket.onclose = () => {
        sister.stdout.off('data', pipeSocket);
        sister.stderr.off('data', pipeSocket);
    }
})
app.useHTTP((req, res) => {
    let name = req.path.slice(1);
    if (req.path === '/') name = './panel.html';
    res.sendFile(path.resolve(__dirname, 'assets', name))
});
app.listen(2000, () => { console.log('Dashboard open to http://localhost:2000') });
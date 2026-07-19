const child = require('child_process');
const fs = require('fs');
const path = require('path');
const { getFile, releaseFiles } = require('./statics/log-manager');

/** @type {{ [key: name]: child.ChildProcessWithoutNullStreams }} */
const spawned = {};

const spawn = () => {
    let allowStop = false;
    const bot = child.fork(require.resolve('./index.js'), { cwd: __dirname, stdio: 'pipe' });
    const mainLog = getFile('mister-mc-macenstein');
    bot.stdout.pipe(mainLog);
    bot.stderr.pipe(mainLog);
    bot.stdout.pipe(process.stdout);
    bot.stderr.pipe(process.stderr);
    bot.on('message', msg => {
        if (msg.spawn) {
            if (spawned[msg.name]) spawned[msg.name].kill();
            const sister = /\.[mc]?js$/i.test(msg.spawn) 
                ? child.fork(msg.spawn, Object.assign(msg.options ?? {}, { stdio: 'pipe' }))
                : child.spawn(msg.spawn, msg.args ?? [], msg, Object.assign(msg.options ?? {}, { stdio: 'pipe' }));
            const log = getFile(msg.name);
            sister.stdout.pipe(log);
            sister.stderr.pipe(log);
            sister.stdout.pipe(process.stdout);
            sister.stderr.pipe(process.stderr);
            sister.on('exit', code => {
                log.write('\nSister closed with exit code ' + code);
                log.close();
            })
            spawned[msg.name] = sister;
        }
        if (msg.kill) spawned[msg.name].kill();
        if (msg.stop) allowStop = true;
        if (msg.pull) child.exec('git pull', (err, stdout, stderr) => {
            stdout += stderr;
            if (stdout.includes('Already up to date.')) return bot.send({ noChanges: true });
            const lines = stdout.split(/\r?\n\r?/g);
            const errors = lines.filter(line => line.startsWith('error:'));
            if (err || stdout.includes('error:')) return bot.send({ couldntMerge: err || stderr || errors });
            const idx = lines.findIndex(line => /files? changed/.test(line));
            const length = parseInt(lines[idx].split(' ')[1]);
            const files = lines.slice(idx - length, idx)
                .map(line => line.split(' | ')[0].trim());
            if (files.some(file => !file.startsWith('commands'))) return bot.send({ restartNeeded: true, updated: files });
            bot.send({ updated: files });
        });
    })
    bot.on('exit', code => {
        mainLog.write('\nBot closed with exit code ' + code);
        mainLog.close();
        releaseFiles('mister-mc-macenstein');
        if (allowStop) process.exit();
        spawn();
    });
}
spawn();
const child = require('child_process');

const spawn = () => {
    let allowStop = false;
    const bot = child.fork(require.resolve('./index.js'));
    bot.on('message', msg => {
        if (msg.stop) allowStop = true;
        if (msg.pull) child.exec('git pull', (err, stdout, stderr) => {
            if (stdout.includes('Already up to date.')) return process.send({ noChanges: true });
            if (err || stderr || stdout.includes('error:')) return process.send({ couldntMerge: true });
            const lines = stdout.split(/\r?\n\r?/g);
            const idx = lines.findIndex(line => /files? changed/.test(line));
            const length = parseInt(lines[idx].split(' ')[1]);
            const files = lines.slice(idx - length, idx)
                .map(line => line.split(' | ')[0].trim());
        });
    })
    bot.on('exit', () => {
        if (allowStop) process.exit();
        spawn();
    });
}
spawn();
const fs = require('fs');
const path = require('path');
const logDir = path.resolve(__dirname, '../logs');
const expires = 2 * 24 * 60 * 60 * 1000; // two days

fs.mkdirSync(logDir, { recursive: true });
const logs = fs.readdirSync(logDir, { recursive: true });

// prune old logs
function pruneLogs() {
    for (const file of logs) {
        if (!file.endsWith('.log')) continue;
        const { name } = path.parse(file);
        const dated = new Date(name);
        if (dated.toString() === 'Invalid Date') continue;
        if ((Date.now() - dated) < expires) continue;
        fs.rm(path.resolve(logDir, file), () => {});
    }
}
pruneLogs() // but what if we restart before this ever runs
setInterval(pruneLogs, 24 * 60 * 60 * 1000); // every day

const open = {};

function getFile(identity) {
    const now = new Date().toISOString();
    const identDir = path.resolve(logDir, identity);
    fs.mkdirSync(identDir, { recursive: true });
    const stream = fs.createWriteStream(path.resolve(identDir, now + '.log'));

    open[identity] ??= [];
    open[identity].push(stream);
    return stream;
}
function releaseFiles(identity) {
    for (const stream of open[identity])
        stream.close();
    open[identity] = [];
}

module.exports = { getFile, releaseFiles }
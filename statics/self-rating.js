const os = require('os');

let lastCpus = os.cpus().map(cpu => Object.entries(cpu.times));
module.exports = function rate(initiator, describe = false) {
    const ratings = [];

    // if this particular 
    const parrel = os.availableParallelism();
    ratings.push(['Cores', Math.min((parrel / 16) * 3, 3)]);

    // if the currently present cpus are over tasked, try to evade using this particular host
    const cpus = os.cpus().map(cpu => Object.entries(cpu.times));
    const usages = [];
    if (cpus.length > 0) { // what, why can there be no cpus listed
        for (let i = 0; i < cpus.length; i++) {
            const diffs = [];
            for (let j = 0; j < cpus[i].length; j++)
                diffs.push([cpus[i][j][0], cpus[i][j][1] - lastCpus[i][j][1]]);
            const total = diffs.reduce((c,v) => c + v[1], 0);
            usages.push(Object.fromEntries(diffs.map(([n,v]) => [n, (v / total) * 100])));
        }
        lastCpus = cpus;
        const taxed = usages.filter(cpu => cpu.user > 75);
        ratings.push(['CPU Usage', Math.min(Math.max((1- (taxed.length / 4)) * 3, 1), 3)]);
        if (taxed.length > 5) ratings.splice(0, ratings.length, ['CPU Usage', 0]);
    }

    // memory rating, 1 = perfect, 0 = unusable
    const freeMem = os.freemem();
    ratings.push(['Memory', Math.min(freeMem / (1024 ** 3), 1) * 3]);
    if (freeMem <= 0.15) ratings.splice(0, ratings.length, ['Memory', 0]); // adding zero isnt enough, if we dont have enough memory we need to simply never use this host

    // piss poor ping will disqualify this particular host
    const ping = Date.now() - initiator;
    if (ping > 4000) ratings.splice(0, ratings.length, ['Ping', 1]);
    if (ping > 20000) ratings.splice(0, ratings.length, ['Ping', 0]);

    const available = ratings.reduce((c,v) => c + v[1], 0) * (1 / ratings.length);
    console.log('Device rated at', available, 'because', ratings);
    const rating = { available, ping, commands: Object.keys(dbs.commands) }
    if (describe) Object.assign(rating, { ratings, freeMem, cores: parrel, usages });
    return rating;
}
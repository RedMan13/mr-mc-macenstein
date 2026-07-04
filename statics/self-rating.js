let lastCpus = os.cpus().map(cpu => Object.entries(cpu.times));
module.exports = function rate(initiator) {
    const ratings = [];

    // if this particular 
    const parrel = os.availableParallelism();
    ratings.push(Math.min((parrel / 16) * 3, 3));

    // if the currently present cpus are over tasked, try to evade using this particular host
    const cpus = os.cpus().map(cpu => Object.entries(cpu.times));
    if (cpus.length > 0) { // what, why can there be no cpus listed
        const usages = [];
        for (let i = 0; i < cpus.length; i++) {
            const diffs = [];
            for (let j = 0; j < cpus[i].length; j++)
                diffs.push([cpus[i][j][0], cpus[i][j][1] - lastCpus[i][j][1]]);
            const total = diffs.reduce((c,v) => c + v[1], 0);
            usages.push(Object.fromEntries(diffs.map(([n,v]) => [n, (v / total) * 100])));
        }
        lastCpus = cpus;
        const taxed = usages.filter(cpu => cpu.user > 75);
        ratings.push(Math.min(Math.max((1- (taxed.length / 4)) * 3, 1), 3));
        if (taxed.length > 5) ratings.splice(0, ratings.length, 0);
    }

    // memory rating, 1 = perfect, 0 = unusable
    const freeMem = os.freemem();
    ratings.push(Math.min(freeMem / (1024 ** 3), 1) * 3);
    if (freeMem <= 0.15) ratings.splice(0, ratings.length, 0); // adding zero isnt enough, if we dont have enough memory we need to simply never use this host

    // piss poor ping will disqualify this particular host
    const ping = Date.now() - initiator;
    if (ping > 4000) ratings.splice(0, ratings.length, 1);
    if (ping > 20000) ratings.splice(0, ratings.length, 0);

    const available = ratings.reduce((c,v) => c + v, 0) * (1 / ratings.length);
    return { available, ping, commands: Object.entries(dbs.commands).filter(([n, command]) => command.work >= available).map(v => v[0]) };
}
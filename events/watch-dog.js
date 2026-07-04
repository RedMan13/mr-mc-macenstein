const os = require('os');

const id = Date.now();
let lastCpus = os.cpus().map(cpu => Object.entries(cpu.times));
function rate(initiator) {
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

    console.log(ratings);
    return { available: ratings.reduce((c,v) => c + v, 0) * (1 / ratings.length), ping, commands: Object.keys(dbs.commands) };
}

const rated = [];
let handleRated = null;
let time = null;
let lost = false;
module.exports = {
    name: 'messageCreate',
    once: false,
    global: false,
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (message.channelId !== dbs.channels.watchDog.id) return;
        if (message.author.id === imports.client.user.id) {
            const jsonStart = message.content.indexOf('{');
            rated.push(JSON.parse(message.slice(jsonStart)));
            clearTimeout(handleRated);
            handleRated = setTimeout(() => {
                const usable = rated
                    .filter(host => host.rating.available > 0)
                    .sort((a,b) => a.rating.ping - b.rating.ping)
                    .sort((a,b) => b.rating.available - a.rating.available);
                dbs.major = rated.length <= 1 || rated[0].id === id;
                for (const command in dbs.commands) {
                    const bestId = usable.find(host => host.rating.commands.includes(command))?.id;
                    // if no one else is capable (i.e. no one else exists) then we must bear the given iregardless of capacity
                    dbs.commands[command].enabled = bestId === id || !bestId;
                }
            }, 30000);
        }
        if (message.author.id !== '1455453433565020306') return; // ddededodediamantes gabriel
        if (time) clearTimeout(time);
        if (lost) {
            lost = false;
            console.log('Watch-dog signal reappeared!');
        }

        const rating = rate(message.createdTimestamp);
        message.reply(`Hello gabriel! i am ${JSON.stringify({ id, rating })}`);
        rated.splice(0, rated.length);

        time = setTimeout(() => {
            message.reply('Gabriel? you there?');
            console.log('Lost watch-dog signal.');
            lost = true;
        }, ((5 * 60) * 60) * 1000);
    }
};


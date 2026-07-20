const { EmbedBuilder } = require('discord.js');
const os = require('os');
const rate = require('../statics/self-rating.js');

function makeVerbose(rawSeconds) {
    const seconds = Math.floor(rawSeconds % 60);
    const minutes = Math.floor((rawSeconds / 60) % 60);
    const hours = Math.floor(((rawSeconds / 60) / 60) % 24);
    const days = Math.floor((((rawSeconds / 60) / 60) / 24) % 7);
    const weeks = Math.floor(((((rawSeconds / 60) / 60) / 24) / 7) % 52.071428571);
    const years = Math.floor(((((rawSeconds / 60) / 60) / 24) / 7) / 52.071428571);

    let out = '';
    if (years > 0) out += years + (years > 1 ? ' years' : ' year') + ', ';
    if (weeks > 0) out += weeks + (weeks > 1 ? ' weeks' : ' week') + ', ';
    if (days > 0) out += days + (days > 1 ? ' days' : ' day') + ', ';
    if (hours > 0) out += hours + (hours > 1 ? ' hours' : ' hour') + ', ';
    if (minutes > 0) out += minutes + (minutes > 1 ? ' minutes' : ' minute') + ', ';
    out += seconds + (seconds > 1 ? ' seconds' : ' second');
    
    return out;
}
function makeMega(bytes) {
    const kilo = bytes / 1000;
    const mega = bytes / 1000_000;
    const giga = bytes / 1000_000_000;
    const tera = bytes / 1000_000_000_000;

    if (tera >= 1) return tera.toFixed(2) + 'TB';
    if (giga >= 1) return giga.toFixed(2) + 'GB';
    if (mega >= 1) return mega.toFixed(2) + 'MB';
    if (kilo >= 1) return kilo.toFixed(2) + 'KB';
    return bytes + 'B';
}

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'stats',
    category: 'operator',
    sDesc: 'lists the current statistics',
    lDesc: 'lists out various nuggets, like how long the bot has been running.',
    work: 0,
    args: [],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const rating = rate(message.createdTimestamp, true);
        message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Uptime statistics')
                    .addFields([
                        { name: 'Computer', value: makeVerbose(os.uptime()) },
                        { name: 'Bot', value: makeVerbose((Date.now() - dbs.startedAt) / 1000) }
                    ]),
                new EmbedBuilder()
                    .setTitle('Capacities')
                    .addFields([
                        { name: 'Watch dog presence', value: dbs.lost ? 'Missing' : 'Live' },
                        { name: 'Ping', value: String(rating.ping) },
                        { name: 'Max parallel', value: String(rating.cores) },
                        { name: 'CPU Usages', value: String(rating.usages.map(v => `${v.user.toFixed(0)}%`).join(', ')) },
                        { name: 'Free memory', value: makeMega(rating.freeMem) },
                        { name: 'Rating', value: `${['N/A', 'Terrible', 'Meh', 'Perfect'][Math.floor(rating.available)]} (${rating.available}) (${rating.ratings.map(v => `${v[0]}: ${v[1]}`).join(', ')})` },
                        { name: 'Commands', value: rating.commands.join(',') }
                    ])
            ]
        })
    },
};

const { EmbedBuilder } = require('discord.js');
const os = require('os');
const rate = require('../statics/self-rating.js');
const getBatteryInfo = require('../statics/analyze-battery.js');

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
    aliases: ['ping'],
    category: 'info',
    sDesc: 'lists the current statistics',
    lDesc: 'lists out various nuggets, like how long the bot has been running.',
    work: 'all',
    args: [
        {
            type: 'string',
            desc: 'Which field of info to return.',
            lBraket: '`',
            rBraket: '`',
            name: 'field',
            required: false,
        },
        {
            type: 'any',
            name: 'id',
            desc: 'The bot id to get from.',
            required: false
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if ('id' in message.arguments && message.arguments.id !== dbs.id && message.arguments.id !== dbs.alias)
            return; 
        const fieldFilter = message.arguments.field?.toLowerCase?.() ?? '';
        const rating = rate(message.createdTimestamp, true);
        const battery = await getBatteryInfo();
        const start = Date.now();
        const fields = [
            { name: 'Computer Uptime', value: makeVerbose(os.uptime()) },
            { name: 'Bot Uptime', value: makeVerbose((Date.now() - dbs.startedAt) / 1000) },
            { name: 'Watch Dog Presence', value: dbs.lost ? 'Missing' : 'Live' },
            { name: 'Battery', value: (battery.hasBattery ? battery.percentage + '%' : 'None') +
                (battery.charging ? ' (Plugged)' : ' (Unplugged)') + (battery.diesAt ? (battery.isDying ? ' Dies' : ' Charged') + ' <t:' + battery.diesAt + ':R>' : '') },
            { name: 'Recieve Ping', value: `${rating.ping}ms` },
            { name: 'Send Ping', value: 'N/A' },
            { name: 'Max Parallel', value: String(rating.cores) },
            { name: 'CPU Usages', value: String(rating.usages.map(v => `${v.user.toFixed(0)}%`).join(', ')) },
            { name: 'Free Memory', value: makeMega(rating.freeMem) },
            { name: 'Rating', value: `${['N/A', 'Terrible', 'Meh', 'Perfect'][Math.floor(rating.available)]} (${rating.available}) (${rating.ratings.map(v => `${v[0]}: ${v[1]}`).join(', ')})` },
            { name: 'Commands', value: rating.commands
                .filter(name => !('aliasFor' in dbs.commands[name]))
                .sort((a,b) => dbs.commands[b].enabled - dbs.commands[a].enabled)
                .map(v => dbs.commands[v].enabled ? `**${v}**` : `~~${v}~~`)
                .join(',') }
        ]
            .filter(field => field.name.toLowerCase().includes(fieldFilter));
        const embed = new EmbedBuilder()
            .setTitle('Statistics')
            .setThumbnail({
                aix: 'https://cdn.discordapp.com/attachments/983516228691824641/1528856243781767288/aix.png',
                android: 'https://cdn.discordapp.com/attachments/983516228691824641/1528856244063043674/android.png',
                darwin: 'https://cdn.discordapp.com/attachments/983516228691824641/1528856244352454676/darwin.png',
                freebsd: 'https://cdn.discordapp.com/attachments/983516228691824641/1528856244616433796/freebsd.png',
                linux: 'https://cdn.discordapp.com/attachments/983516228691824641/1528856244956430356/linux.png',
                openbsd: 'https://cdn.discordapp.com/attachments/983516228691824641/1528856245237453041/openbsd.png',
                sunos: 'https://cdn.discordapp.com/attachments/983516228691824641/1528856245593706548/sunos.png',
                win32: 'https://cdn.discordapp.com/attachments/983516228691824641/1528856245858078730/win32.png'
            }[process.platform])
            .addFields(fields)
            .setFooter({ text: 'Bot id: ' + dbs.id + '; Alias: ' + dbs.alias })
        const sent = await message.reply({ embeds: [embed] });

        const pingField = fields.find(field => field.name === 'Send Ping');
        if (pingField) {
            pingField.value = `${Date.now() - start}ms`;
            embed.spliceFields(0, fields.length);
            embed.addFields(fields);
            sent.edit({ embeds: [embed] });
        }
    },
};

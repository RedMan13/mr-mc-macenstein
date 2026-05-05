const { EmbedBuilder } = require('discord.js');
const os = require('os');

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
/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'uptime',
    category: 'operator',
    sDesc: 'lists the current uptime',
    lDesc: 'lists out how long the bot has been running and how long my computer has been running.',
    args: [],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Uptime statistics')
                    .addFields([
                        { name: 'Computer', value: makeVerbose(os.uptime()) },
                        { name: 'Bot', value: makeVerbose((Date.now() - dbs.startedAt) / 1000) }
                    ])
            ]
        })
    },
};

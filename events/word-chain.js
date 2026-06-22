const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const words = fs.readFileSync(path.resolve(__dirname, '../assets/words.txt'), 'utf8');

/**
 * @param {import('discord.js').Message} message
 */
function fail(message, reason) {
    dbs.channels.wordErrors.send(`${message.author} ${reason}`);
    message.delete();
}

module.exports = {
    name: 'messageCreate',
    once: false,
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (!dbs.channelsLoaded) return; // no prefix, not loaded yet
        if (message.channel.id !== dbs.channels.wordChain.id) return;
        const messageChannel = dbs.database.channel(dbs.channels.wordChain.id);
        const filtered = message.content.replaceAll(/[^0-9a-z\-']+/gi, '-').toLowerCase();
        
        if (messageChannel.get('lastUser') === message.author.id) return fail(message, `You are not allowed to submit back to back!`);

        const used = messageChannel.get('words') ?? '';
        if (used.length && used.at(-1) !== filtered[0]) return fail(message, `\`${filtered}\` does not start with \`${used.at(-1)}\`!`);

        const locator = new RegExp(`(?:^|,)${filtered}(?:$|,)`);
        if (locator.test(used)) return fail(message, `\`${filtered}\` has already been used!`);

        if (!locator.test(words)) return fail(message, `\`${filtered}\` is not a word!`);

        messageChannel.set('words', used + ',' + filtered);
        messageChannel.set('lastUser', message.author.id);
        message.react('<:yes:1164828602609717248>')
    }
};


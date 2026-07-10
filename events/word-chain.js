const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const words = fs.readFileSync(path.resolve(__dirname, '../assets/words.txt'), 'utf8');

/**
 * @param {import('discord.js').Message} message
 */
function fail(message, reason) {
    if (!dbs.major) return;
    dbs.channels.wordErrors.send(`${message.author} ${reason}`);
    message.delete();
}
const unsafeMessageChars = /[^0-9a-z\-']+/gi;
const safeReplacer = '-';

module.exports = {
    name: 'messageCreate',
    once: false,
    global: true,
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (!dbs.channelsLoaded) return; // no prefix, not loaded yet
        if (message.channel.id !== dbs.channels.wordChain.id) return;
        const messageChannel = dbs.database.channel(dbs.channels.wordChain.id);
        const filtered = message.content.replaceAll(unsafeMessageChars, safeReplacer).toLowerCase();
        let used = messageChannel.get('words') ?? '';

        // our database isnt entirely certainly correct, since we may have not had access to the channel at the times of some messages
        const lastMessages = await Promise.all((await message.channel.messages.fetch({ limit: 200 }))
            .map(message => message.reactions.resolve('<:yes:1164828602609717248>')))
            .filter(reaction => reaction.users.some(u => u.id === imports.client.user.id))
            .map(reaction => [reaction.message.replaceAll(unsafeMessageChars, safeReplacer).toLowerCase(), reaction.author.id])
            .map(info => ({ filtered: info[0], locator: new RegExp(`(?:^|,)${info[0]}(?:$|,)`), author: info[1] }));
        if (!lastMessages[0].locator.test(used)) { // patch our reality with the one visible in discord
            for (let i = lastMessages.length -1; i >= 0; i--) {
                if (lastMessages[0].locator.test(used)) continue;
                used += ',' + filtered;
                messageChannel.set('lastUser', lastMessages[i].author);
            }
        }
        
        if (messageChannel.get('lastUser') === message.author.id) return fail(message, `You are not allowed to submit back to back!`);

        if (used.length && used.at(-1) !== filtered[0]) return fail(message, `\`${filtered}\` does not start with \`${used.at(-1)}\`!`);

        const locator = new RegExp(`(?:^|,)${filtered}(?:$|,)`);
        if (locator.test(used)) return fail(message, `\`${filtered}\` has already been used!`);
        if (!locator.test(words)) return fail(message, `\`${filtered}\` is not a word!`);

        messageChannel.set('words', used + ',' + filtered);
        messageChannel.set('lastUser', message.author.id);
        if (dbs.major) message.react('<:yes:1164828602609717248>')
    }
};


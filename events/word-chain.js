const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const wordsPath = path.resolve(__dirname, '../assets/words.txt');
const words = fs.readFileSync(wordsPath, 'utf8');
const topCounts = words.split(',')
    .map(word => word[0])
    .reduce((c,v) => (v in c ? c[v]++ : (c[v] = 1), c), {});

/**
 * @param {import('discord.js').Message} message
 */
function fail(message, reason) {
    if (!dbs.major) return;
    dbs.channels.wordErrors.send(`${message.author} ${reason}`);
    message.delete();
}
/**
 * @param {import('discord.js').Message} message 
 * @returns {false|string} False only when the input message is valid
 */
function checkMessage(message) {
    if (message.author.id === imports.client.user.id) return false;
    const messageChannel = dbs.database.channel(dbs.channels.wordChain.id);
    const filtered = message.content.replaceAll(unsafeMessageChars, safeReplacer).toLowerCase();
    const letter = filtered[0];
    const used = messageChannel.get('words') ?? '';

    // if this word is the last word, and leads to the same letter it just ended, then we need to edit reality
    if (filtered.at(-1) === filtered[0] && messageChannel.get(filtered.at(-1)) >= topCounts[filtered.at(-1)] -1) {
        const availableLetters = Object.entries(topCounts)
            .filter(([letter, count]) => messageChannel.get(letter) < count)
            .map(([letter]) => letter);
        const letter = availableLetters[Math.floor(Math.random() * availableLetters.length)];
        const end = words.indexOf(letter + ',');
        const start = words.lastIndexOf(',', end);
        dbs.channels.wordChain.send(words.slice(start, end));
        dbs.channels.wordErrors.send('Oops! that cant be right!');
    }
    if (messageChannel.get(filtered.at(-1)) >= topCounts[filtered.at(-1)]) return `\`${filtered.at(-1)}\` has been all used up!`;

    if (messageChannel.get('lastUser') === message.author.id) return `You are not allowed to submit back to back!`;

    if (used.length && used.at(-1) !== letter) return `\`${filtered}\` does not start with \`${used.at(-1)}\`!`;

    const locator = new RegExp(`(?:^|,)${filtered}(?:$|,)`);
    if (locator.test(used)) return `\`${filtered}\` has already been used!`;
    if (!locator.test(words)) return `\`${filtered}\` is not a word!`;

    messageChannel.set('words', used + ',' + filtered);
    messageChannel.set('lastUser', message.author.id);
    if (!messageChannel.has(letter))
        messageChannel.set(letter, 0);
    messageChannel.add(letter);

    return false;
}
const unsafeMessageChars = /[^a-z\-']+/gi;
const safeReplacer = '-';

module.exports = {
    name: 'messageCreate',
    once: false,
    global: true,
    checkMessage,
    wordsPath,
    unsafeMessageChars,
    safeReplacer,
    topCounts,
    words: words.split(','),
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (message.author.id === '860531746294726736' && message.content.startsWith('-#'))
            return;
        if (!dbs.channelsLoaded) return; // no prefix, not loaded yet
        if (message.channel.id !== dbs.channels.wordChain.id) return;
        const messageChannel = dbs.database.channel(dbs.channels.wordChain.id);
        let used = messageChannel.get('words') ?? '';

        // our database isnt entirely certainly correct, since we may have not had access to the channel at the times of some messages
        // note that this expacts: low message flow and short outages (i.e. two days downtime), this will fail if
        // A: someone(s) go and do the word chains for 100+ messages (either because this host couldnt see it for too long, or because it was spammed)
        // B: someone(s) spam the word chains channel with 100+ unhandled messages (or, really, any unhandled messages)
        const lastMessages = (await Promise.all((await message.channel.messages.fetch({ limit: 100 }))
            .map(message => message.reactions.resolve('1164828602609717248'))))
            .filter(reaction => reaction && reaction.users.cache.some(user => user.id === imports.client.user.id))
            .map(reaction => [reaction.message.content.replaceAll(unsafeMessageChars, safeReplacer).toLowerCase(), reaction.message.author.id])
            .map(info => ({ filtered: info[0], locator: new RegExp(`(?:^|,)${info[0]}(?:$|,)`), author: info[1] }));
        if (lastMessages[0].filtered.at(-1) !== used.at(-1)) { // patch our reality with the one visible in discord
            for (let i = lastMessages.length -1; i >= 0; i--) {
                if (lastMessages[i].locator.test(used)) continue;
                used += ',' + lastMessages[i].filtered;
                messageChannel.set('lastUser', lastMessages[i].author);
            }
            messageChannel.set('words', used);
        }

        const checked = checkMessage(message);
        if (checked) return fail(message, checked);

        message.react('<:yes:1164828602609717248>');
    }
};


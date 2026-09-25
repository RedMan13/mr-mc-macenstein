const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const wordsPath = path.resolve(__dirname, '../assets/words.txt');
const words = fs.readFileSync(wordsPath, 'utf8');
const topCounts = {};
const messageChannel = dbs.database.channel(dbs.config.channels.wordChain);
(async () => {
    if (await messageChannel.loaded) {
        const usedWords = (messageChannel.get('words') ?? '').split(',');
        words.split(',')
            .forEach(word => {
                if (messageChannel.get(usedWords.at(-1)) < 0) return;
                topCounts[word[0]] ??= 0;
                topCounts[word[0]]++;
            });
    }
})();

/**
 * @param {import('discord.js').Message} message
 */
async function fail(message, reason) {
    const settings = dbs.database.server(message.channel.guild.id);
    const userSettings = dbs.database.user(message.author.id);

    if (!dbs.major) return;
    const mention = !userSettings.has('wordchains-ping') || userSettings.get('wordchains-ping')
        ? message.author
        : message.author.username + ':'
    const wordErrors = await imports.client.channels.fetch(settings.get('word-errors-channel'));
    wordErrors.send(`${mention} ${reason}`);
    message.delete();
}
/**
 * @param {import('discord.js').Message} message 
 * @returns {false|string} False only when the input message is valid
 */
async function checkMessage(message) {
    if (message.author.id === imports.client.user.id) return false;
    const settings = dbs.database.server(message.channel.guild.id);
    const messageChannel = dbs.database.channel(settings.get('wordchains-channel'));
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
        const wordChains = await imports.client.channels.fetch(settings.get('wordchains-channel'));
        const wordErrors = await imports.client.channels.fetch(settings.get('word-errors-channel'));
        
        wordChains.send(words.slice(start, end));
        wordErrors.send('Oops! that cant be right!');
    }
    if (messageChannel.get(filtered.at(-1)) < 0) return `\`${filtered.at(-1)}\` has been all used up!`;

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
    if (messageChannel.get(letter) >= topCounts[letter])
        messageChannel.set(letter, -1);

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
        const settings = dbs.database.server(message.channel.guild.id);

        if (!settings.get('wordchains-enabled')) return;
        if (!settings.get('wordchains-channel')) return;
        if (!settings.get('word-errors-channel')) return;
        if (message.author.id === dbs.config.users.owner && message.content.startsWith('-#'))
            return;
        if (!dbs.channelsLoaded) return; // no prefix, not loaded yet
        if (message.channel.id !== settings.get('wordchains-channel')) return;

        const checked = await checkMessage(message);
        if (checked) return fail(message, checked);

        message.react('<:yes:1164828602609717248>');
    }
};


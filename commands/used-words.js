const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { words, topCounts, unsafeMessageChars, safeReplacer } = require('../events/word-chain');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'words-used',
    category: 'info',
    sDesc: 'Reports info about the percentage of usage in word chains.',
    lDesc: 'Reports info like how many words are left, the percentage of used words, based on which letter you provided as the starter.',
    work: 'any',
    args: [
        {
            type: 'any',
            name: 'letter',
            required: false,
            desc: 'The letter that all the words searched must start with.'
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const messageChannel = dbs.database.channel(dbs.channels.wordChain.id);
        const usedWords = messageChannel.get('words').split(',');
        if (!message.arguments.letter) {
            const percent = ((usedWords.length / words.length) * 100).toFixed(1) + '%';
            return message.reply(percent + ' of all available words used');
        }
        const letter = message.arguments.letter[0].replaceAll(unsafeMessageChars, safeReplacer).toLowerCase();
        const usedToCheck = messageChannel.get(letter) ?? 0;
        const totalToCheck = topCounts[letter];
        const references = words
            .filter(word => word.at(-1) === letter)
            .filter(word => (messageChannel.get(word[0]) ?? 0) >= 0)
            .filter(word => !usedWords.includes(word));
        const percent = ((usedToCheck / totalToCheck) * 100).toFixed(1) + '%';
        return message.reply(`\`${letter}\` has ${(totalToCheck - usedToCheck)} uses left, and is ${percent} used.\n${references.length} words end in \`${letter}\`.`);
    },
};

const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const words = fs.readFileSync(path.resolve(__dirname, '../assets/words.txt'), 'utf8').split(',');

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
        const letter = message.arguments.letter[0].replaceAll(/[^0-9a-z\-']+/gi, '-');
        const usedToCheck = usedWords.filter(v => v.startsWith(letter));
        const totalToCheck = words.filter(v => v.startsWith(letter));
        const percent = ((usedToCheck.length / totalToCheck.length) * 100).toFixed(1) + '%';
        return message.reply('`' + letter + '` has ' + (totalToCheck.length - usedToCheck.length) + ' usese left, and is ' + percent + ' used.');
    },
};

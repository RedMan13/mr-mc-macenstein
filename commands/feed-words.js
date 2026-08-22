const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { words, wordsPath } = require('../events/word-chain');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'feed-words',
    category: 'hidden',
    sDesc: 'Feeds new words to the word chains database.',
    lDesc: 'Takes in a file or link to text and adds all decernable words into the local dictionary.',
    work: 'any',
    args: [
        {
            type: 'string',
            name: 'link',
            required: false,
            desc: 'A link to a file to download and process.'
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (message.author.id !== "860531746294726736") {
            message.reply(`you are not authorized to use this`);
            return;
        }
        /** @type {import('discord.js').Message} */
        const target = message.reference
            ? await message.channel.messages.fetch(message.reference.messageId)
            : message;
        const file = target.attachments.at(0);
        const link = file?.url ?? target.content.match(/(https:\/\/[^\s]*)/i)?.[1];
        if (!link) return message.reply('must have either a link or a file in the message!');
        const data = await fetch(link).then(req => req.ok ? req.text() : req);
        if (typeof data !== 'string') return message.reply(`the provided media gave a ${data.status} status`);
        const toAdd = data.split(/[^0-9a-z\-']+/gi).filter(Boolean);
        const info = await message.reply(`processing ${toAdd.length} words... host will not be running for this`);
        let added = 0;
        let lastStatus = Date.now();
        let lastIndex = 0;
        toAdd.forEach((word,i) => {
            if (/[^0-9a-z\-']+/gi.test(word)) return;
            if (words.includes(word)) return;
            if (word.length <= 1) return;
            added++;
            words.push(word);
            if ((Date.now() - lastStatus) > 5000) {
                const percent = (100 * (i / (toAdd.length -1))).toFixed(2);
                const eta = Math.floor(((((Date.now() - lastStatus) / (i - lastIndex)) * ((toAdd.length - i) -1)) + Date.now()) / 1000);
                info.edit(`processing ${toAdd.length} words... ${percent}% ETA <t:${eta}:R>`);
                lastStatus = Date.now();
                lastIndex = i;
            }
        });
        fs.writeFileSync(wordsPath, words.join(','));
        info.delete(); 
        
        message.reply(`added ${added} (${((added / toAdd.length) * 100).toFixed(1)}%) words! restart needed`);
    },
};

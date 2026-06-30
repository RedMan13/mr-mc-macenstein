const { EmbedBuilder } = require('discord.js');

let time = null;
let lost = false;
module.exports = {
    name: 'messageCreate',
    once: false,
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (message.channelId !== dbs.channels.watchDog.id) return;
        if (message.author.id !== '1455453433565020306') return; // ddededodediamantes gabriel
        if (time) clearTimeout(time);
        if (lost) {
            lost = false;
            console.log('Watch-dog signal reappeared!');
        }
        message.reply('Hello gabriel!');

        time = setTimeout(() => {
            message.reply('Gabriel? you there?');
            console.log('Lost watch-dog signal.');
            lost = true;
        }, ((5 * 60) * 60) * 1000);
    }
};


const fs = require('fs/promises');
const path = require('path');
const samples = path.resolve(__dirname, '../assets/samples.txt');

module.exports = {
    name: 'messageCreate',
    once: false,
    global: true,
    execute: async (message) => {
        if (message.channel.id !== dbs.config.channels.dataFeed) return;
        fs.appendFile(samples, '\n' + message.cleanContent);
        message.react('🧠');
    },
};

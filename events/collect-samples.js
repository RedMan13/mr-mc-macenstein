const fs = require('fs/promises');
const path = require('path');
const MIDI = require('midi-file');
const textSamples = path.resolve(__dirname, '../assets/samples.txt');
const midiSamples = path.resolve(__dirname, '../assets/midis.txt');

module.exports = {
    name: 'messageCreate',
    once: false,
    global: true,
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        switch (message.channel.id) {
        case dbs.config.channels.textFeed:
            if (message.channel.id !== dbs.config.channels.dataFeed) return;
            fs.appendFile(textSamples, '\n' + message.cleanContent);
            for (const name in dbs.onNewData)
                dbs.onNewData[name](message.cleanContent);
            break;
        case dbs.config.channels.midiFeed:
            if (message.attachments.size <= 0) return;
            let glob = '';
            message.attachments.forEach(async file => {
                if (file.contentType !== 'audio/sp-midi') return;
                const data = await fetch(file.url).then(req => req.bytes());
                const parsed = MIDI.parseMidi(data);
                glob += JSON.stringify(parsed) + '\n';
            });
            if (glob.length <= 0) return;
            fs.appendFile(midiSamples, glob);
            break;
        default: return;
        }
        message.react('🧠');
    },
};

const { AttachmentBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'ddededodediamante-furry',
    category: 'hidden',
    sDesc: 'Sends ddededodediamantes secret',
    lDesc: 'Sends ddededodediamantes fursona',
    args: [],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const data = await fs.readFile(path.resolve(__dirname, '../assets/dde-fursona.png'));
        message.reply({
            content: 'See! proof of furry:',
            files: [
                new AttachmentBuilder(data, { name: 'ddededodediamante-fursona.png', description: 'ddededodediamantes hand-drawn fursona' })
            ]
        })
    },
};

const fs = require('fs/promises');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'logs',
    category: 'operator',
    sDesc: 'Sends the most recent logs',
    lDesc: 'Sends the most recent 2000 characters of logs',
    work: 'any',
    args: [],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const data = await fs.readFile(process.env.LOG_FILE);
        message.reply(`\`\`\`ansi\n${data.toString().replaceAll('```', '``\x1b[m`').slice(-1989)}\`\`\``);
    },
};

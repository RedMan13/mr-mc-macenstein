/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'chess',
    category: 'dumb fun',
    sDesc: 'Plays chess.',
    lDesc: 'Starts a game of chess.',
    work: 1,
    args: [],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        message.reply('v');
    },
};

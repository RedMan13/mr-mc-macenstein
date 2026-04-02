/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'cancel',
    category: 'operator',
    sDesc: 'Cancels stream effects',
    lDesc: 'Cancels all currently running stream effects',
    args: [],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        await fetch('http://localhost:8080/cancel');
        message.reply('Canceled all effects');
    },
};

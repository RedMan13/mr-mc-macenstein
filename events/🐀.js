module.exports = {
    name: 'messageCreate',
    once: false,
    global: false,
    /** @param {import('discord.js').Message} message */
    execute: async (message) => {
        if (/🧀|🐀|cheese|(\s+|^)rat(\s+|$)/ig.test(message.cleanContent)) {
            message.react('🐀');
        }
    },
};
module.exports = {
    name: 'messageCreate',
    once: false,
    global: false,
    /** @param {import('discord.js').Message} message */
    execute: async (message) => {
        const userSettings = dbs.database.user(message.author.id);
        const settings = dbs.database.server(message.channel.guild.id);
        if (settings.has('rat-reactions') && !settings.get('rat-reactions')) return;
        if (userSettings.has('rat-reactions') && !userSettings.get('rat-reactions')) return;
        if (!/🧀|🐀|cheese|(\s+|^)rat(\s+|$)/ig.test(message.cleanContent)) return;
        message.react('🐀');
    },
};
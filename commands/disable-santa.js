/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'disable-santa',
    category: 'settings',
    sDesc: 'enables santa clause',
    lDesc: 'enables santa clause, can only be used by <@860531746294726736>',
    work: 'any',
    args: [],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (message.author.id !== dbs.config.users.owner && message.author.id !== dbs.config.users.jeremygamer) {
            message.reply(`you are not authorized to use this`);
            return;
        }
        const database = dbs.database.channel(message.channel.id);
        database.set('santaIsHere', false);
        message.reply('Done!');
    },
};

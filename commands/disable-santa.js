module.exports = {
    name: 'disable-santa',
    category: 'dumb fun',
    sDesc: 'enables santa clause',
    lDesc: 'enables santa clause, can only be used by <@860531746294726736>',
    args: [],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (message.author.id !== "860531746294726736" && message.author.id !== "462098932571308033") {
            message.channel.send(`you are not authorized to use this`);
            return;
        }
        const database = dbs.database.channel(message.channel.id);
        database.set('santaIsHere', false);
        message.reply('Done!');
    },
};

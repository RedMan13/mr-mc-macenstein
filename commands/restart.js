/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'restart',
    category: 'operator',
    sDesc: 'restarts the bot',
    lDesc: 'Restarts the entire discord bot.',
    work: 1,
    args: [],
    execute: async (message) => {
        if (message.author.id !== "860531746294726736") {
            message.reply(`you are not authorized to use this`);
            return;
        }
        await message.channel.send('Restarting bot...');
        const global = dbs.database.global();
        global.set('restarted', true);
        global.set('restartMessage', message.id);
        global.set('restartChannel', message.channel.id);
        stop();
    },
};

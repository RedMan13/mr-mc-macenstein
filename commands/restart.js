/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'restart',
    category: 'operator',
    sDesc: 'restarts the bot',
    lDesc: 'Restarts the entire discord bot.',
    args: [],
    execute: async (message) => {
        if (message.author.id !== "860531746294726736") {
            message.reply(`you are not authorized to use this`);
            return;
        }
        stop();
    },
};

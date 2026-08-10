/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'stop',
    category: 'operator',
    sDesc: 'stops the bot',
    lDesc: 'Makes the bot shut down entirely from discord',
    work: 0,
    args: [
        {
            type: 'any',
            name: 'id',
            desc: 'The bot id to control',
            required: false
        }
    ],
    execute: async (message) => {
        if (dbs.id !== message.arguments.id && dbs.alias !== message.arguments.id) return;
        if (message.author.id !== "860531746294726736") {
            message.reply(`you are not authorized to use this`);
            return;
        }
        process.send({ stop: true });
        stop();
    },
};

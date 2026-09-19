/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'stop',
    category: 'operator',
    sDesc: 'stops the bot',
    lDesc: 'Makes the bot shut down entirely from discord',
    work: 'all',
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
        if (message.author.id !== dbs.config.users.owner) {
            message.reply(`you are not authorized to use this`);
            return;
        }
        await message.reply(`Stopped bot ${dbs.id}`);
        process.send({ stop: true });
        stop();
    },
};

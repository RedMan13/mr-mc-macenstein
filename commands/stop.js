module.exports = {
    name: 'stop',
    category: 'operator',
    sDesc: 'Stops the bot',
    lDesc: 'Makes the bot shut down entirely from discord',
    args: [],
    execute: async (message) => {
        if (message.author.id !== "860531746294726736") {
            message.channel.send(`you are not authorized to use this`);
            return;
        }
        stop();
    },
};

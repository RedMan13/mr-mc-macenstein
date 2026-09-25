/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'enable-santa',
    category: 'settings',
    sDesc: 'enables santa clause',
    lDesc: 'enables santa clause, can only be used by <@860531746294726736>',
    work: 'any',
    args: [
        {
            type: 'any',
            name: 'webhook',
            required: false
        },
        {
            type: 'channel',
            name: 'wishes',
            required: false
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (!message.member.permissions.had('Administrator')) {
            message.reply(`you are not authorized to use this`);
            return;
        }
        const wishChannel = message.arguments.wishes ?? message.channel;
        wishChannel.send(`Santa is enabled here now.
📃 reactions mean santa replied.
🧏‍♂️ reactions means santa is thinking.
👋 reactions means that a human will be handling your wish.`);
        message.reply('Done!');
        const database = dbs.database.channel(wishChannel.id);
        database.set('santaIsHere', true);
        if (!message.arguments.webhook) return;
        const url = message.arguments.webhook.split('/');
        database.set('webhookId', url.at(-2));
        database.set('webhookToken', url.at(-1));
    },
};

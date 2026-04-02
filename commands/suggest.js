/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'suggest',
    category: 'general',
    sDesc: 'Makes a suggestion',
    lDesc: 'Suggest features/changes for this bot!',
    args: [
        {
            type: 'string',
            lBraket: '`',
            rBraket: '`',
            name: 'suggestion',
            desc: 'The suggestion you wish to make',
            required: true
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const sent = await dbs.channels.suggestions.send(`Suggestion: ${message.arguments.suggestion}`);
        const data = dbs.database.channel(dbs.channels.suggestions.id);
        const suggested = data.get('suggested') ?? {};
        suggested[sent.id] = {
            author: message.author.id,
            suggestion: message.arguments.suggestion
        };
        data.set('suggested', suggested);
        message.reply('Sent!');
    },
};

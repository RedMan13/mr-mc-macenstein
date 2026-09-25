/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'plead',
    category: 'hidden',
    sDesc: 'Begs',
    lDesc: 'Begs',
    work: 'any',
    args: [
        {
            type: 'string',
            name: 'content',
            desc: 'The content to plead for',
            required: true
        }
    ],
    execute: async (message) => {
        message.reply(`PLEASE sir PLEASE. i am just one simple man just lend me this one simple request! PLEASE just ${message.arguments.content}!`);
    },
};

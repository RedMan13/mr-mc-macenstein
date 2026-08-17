const { createQuoteCard } = require('../statics/quote-generator.js');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'kill',
    category: 'hidden',
    sDesc: '...',
    lDesc: '... how could you...',
    work: 'any',
    args: [],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        /** @type {Blob} */
        const blob = await createQuoteCard(message);
        message.reply({
            files: [
                {
                    name: 'evils.png',
                    contentType: blob.type,
                    attachment: Buffer.from(await blob.bytes())
                }
            ]
        })
    },
};

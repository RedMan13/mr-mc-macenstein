module.exports = {
    name: 'quote',
    category: 'dumb fun',
    sDesc: 'Quotes some text',
    lDesc: 'Takes in any message you reply to and makes it into a quote card',
    args: [],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (!message.reference) {
            message.reply('You must reply to a message for this to work');
            return;
        }
        return;
        /** @type {Blob} */
        const blob = await imports.createQuoteCard(await message.channel.messages.fetch(message.reference.messageId));
        message.reply({
            files: [
                {
                    name: 'quote.png',
                    contentType: blob.type,
                    attachment: Buffer.from(await blob.bytes())
                }
            ]
        })
    },
};

const { ApplicationIntegrationType, InteractionContextType, ApplicationCommandType, LabelBuilder, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    name: 'snap-conf',
    /**
     * @param {import('discord.js').ModalSubmitInteraction} interaction
     */
    execute: async (interaction, channelId, messageId) => {
        await interaction.deferReply();
        /** @type {import('discord.js').TextChannel} */
        const channels = await imports.client.channels.fetch(channelId);
        const messages = await channels.messages.fetch({
            limit: interaction.fields.getTextInputValue('count'),
            [interaction.fields.getStringSelectValues('direction')[0]]: messageId
        });

        /** @type {Blob} */
        const blob = await imports.createQuoteMessage([...messages.values()]);
        interaction.editReply({
            files: [
                {
                    name: 'snapshot.png',
                    contentType: blob.type,
                    attachment: Buffer.from(await blob.bytes())
                }
            ]
        })
    }
};

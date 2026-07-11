const { ApplicationIntegrationType, InteractionContextType, ApplicationCommandType } = require('discord.js');
const { createQuoteCard, createQuoteMessage } = require('../statics/quote-generator.js');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    slashCmd: true,
    work: 2,
    comData: {
        type: ApplicationCommandType.Message,
        name: 'Quote',
        integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
        contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]
    },
    /**
     * @param {import('discord.js').Interaction} interaction
     */
    execute: async (interaction) => {
        await interaction.deferReply().catch(err => console.warn(err));
        /** @type {Blob} */
        const blob = await createQuoteCard(await interaction.targetMessage);
        interaction.editReply({
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

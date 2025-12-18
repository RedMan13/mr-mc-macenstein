const { ApplicationIntegrationType, InteractionContextType, ApplicationCommandType } = require('discord.js');

module.exports = {
    slashCmd: true,
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
        await interaction.deferReply().catch(() => null);
        return;
        /** @type {Blob} */
        const blob = await imports.createQuoteCard(await interaction.targetMessage);
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

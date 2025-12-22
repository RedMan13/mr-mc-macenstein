const { ApplicationIntegrationType, InteractionContextType, ApplicationCommandType, LabelBuilder, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    slashCmd: true,
    comData: {
        type: ApplicationCommandType.Message,
        name: 'Snapshot',
        integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
        contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]
    },
    /**
     * @param {import('discord.js').Interaction} interaction
     */
    execute: async (interaction) => {
        await interaction.showModal(
            new ModalBuilder()
                .setTitle("Snapshot config")
                .setCustomId(`snap-conf.${interaction.targetMessage.channelId}.${interaction.targetMessage.id}`)
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel("Messages")
                        .setDescription("How many messages around the selected message should be inside the snapshot.")
                        .setTextInputComponent(
                            new TextInputBuilder()
                                .setCustomId("count")
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder("67")
                                .setValue("1")
                                .setRequired(false)
                        )
                )
                .addLabelComponents(
                    new LabelBuilder()
                        .setLabel("Direction")
                        .setDescription("The direction in which we should be grabbing messages.")
                        .setStringSelectMenuComponent(
                            new StringSelectMenuBuilder()
                                .setCustomId("direction")
                                .setPlaceholder("Somewhere over the rainbow")
                                .setRequired(false)
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                    .setLabel("Around")
                                    .setValue("around")
                                    .setDescription("All messages above and all messages below the sellected message."),
                                    new StringSelectMenuOptionBuilder()
                                    .setLabel("Above")
                                    .setValue("before")
                                    .setDescription("All messages above the selected message.")
                                    .setDefault(true),
                                    new StringSelectMenuOptionBuilder()
                                    .setLabel("Below")
                                    .setValue("after")
                                    .setDescription("All messages below the selected message.")
                                )
                        )
                )
        );
        //
    }
};

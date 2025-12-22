module.exports = {
    name: 'interactionCreate',
    once: false,
    /** @param {import('discord.js').BaseInteraction} interaction */
    execute: async (interaction) => {
        if (!interaction.isCommand()) {
            const [id, ...clues] = interaction.customId.split('.');
            const command = dbs.commands[id];
            command.command.execute(interaction, ...clues);
            return;
        }
        const command = dbs.commands[interaction.commandName];
        command.command.execute(interaction);
    }
};
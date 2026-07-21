module.exports = {
    name: 'interactionCreate',
    once: false,
    global: true,
    /** @param {import('discord.js').BaseInteraction} interaction */
    execute: async (interaction) => {
        if (!dbs.commands[command]?.enabled) return;
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
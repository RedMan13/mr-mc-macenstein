module.exports = {
    name: 'interactionCreate',
    once: false,
    global: true,
    /** @param {import('discord.js').BaseInteraction} interaction */
    execute: async (interaction) => {
        if (!interaction.isCommand()) {
            const [id, ...clues] = interaction.customId.split('.');
            if (!dbs.commands[id]?.enabled) return;
            const command = dbs.commands[id];
            command.command.execute(interaction, ...clues);
            return;
        }
        const command = dbs.commands[interaction.commandName];
        if (!command?.enabled) return;
        command.command.execute(interaction);
    }
};
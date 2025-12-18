module.exports = {
    name: 'interactionCreate',
    once: false,
    execute: async (interaction) => {
        const command = dbs.commands[interaction.commandName];
        command.command.execute(interaction);
    }
};
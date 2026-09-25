const syncSlash = require('@frostzzone/discord-sync-commands');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'push-slash',
    category: 'hidden',
    sDesc: 'Pushes the current slash commands.',
    lDesc: 'Pushes the current slash command list from the bot to discord.',
    work: 'any',
    args: [],
    execute: async (message) => {
        const slashCommands = Object.values(dbs.commands)
            .filter(command => command.isSlash)
            .map(command => command.command.comData);
        const commands = await syncSlash(imports.client, slashCommands, {});
        message.reply(
            `Starting with \`${commands.currentCommandCount}\` commands\n` +
            `Created \`${commands.newCommandCount}\`\n` + 
            `Updated \`${commands.updatedCommandCount}\`\n` + 
            `Deleted \`${commands.deletedCommandCount}\``
        );
    },
};

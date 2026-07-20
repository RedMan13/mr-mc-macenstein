module.exports = {
    name: 'messageCreate',
    once: false,
    global: true,
    execute: async (message) => {
        if (!dbs.commandConfig.prefix) return;
        if (message.content.startsWith(dbs.commandConfig.prefix)) {
            const args = message.content.split(' ');
            const command = args.shift().slice(dbs.config.commands.prefix.length);
            if (!dbs.commands[command]) return message.react('<:no:1164832595478069299>');
            if (!dbs.commands[command].enabled) return;
            const commandData = dbs.commands[command].command;
            message.args = args.join(' ');
            message.arguments = dbs.commands[command].useCLI
                ? imports.parseArgs(message.args.split(' '), commandData.args)
                : await imports.getAllArgs(message, commandData.args);
            if (typeof message.arguments === 'string')
                return message.reply(message.arguments);
            try {
                await commandData.execute(message);
            } catch (err) {
                message.reply('command failed :(');
                console.warn(err);
                dbs.channels.console.send(err.stack);
            }
        }
    },
};

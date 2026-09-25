module.exports = {
    name: 'messageCreate',
    once: false,
    global: true,
    execute: async (message) => {
        if (!dbs.commandConfig.prefix) return;
        if (message.content.startsWith(dbs.commandConfig.prefix)) {
            const args = message.content.split(' ');
            let command = args.shift().slice(dbs.config.commands.prefix.length);
            if (!dbs.commands[command]) return message.react('<:no:1164832595478069299>');
            if ('aliasFor' in dbs.commands[command])
                command = dbs.commands[command].aliasFor;
            if (!dbs.commands[command].enabled && dbs.commands[command].work !== 'all') return;

            const settings = dbs.database.server(message.channel.guild.id);
            if (settings.has('channels-list')) {
                const usesBlacklist = !settings.has('blacklist-channels') || settings.get('blacklist-channels');
                const list = settings.get('channels-list');
                // xor my beloved
                if (usesBlacklist === list.includes(message.channel.id)) return;
            }

            if (settings.has(`${command}-enabled`) && !settings.get(`${command}-enabled`)) return;
            if (settings.has(`${command}-channels-list`)) {
                const usesBlacklist = !settings.has(`${command}-blacklist-channels`) || settings.get(`${command}-blacklist-channels`);
                const list = settings.get(`${command}-channels-list`);
                // xor my beloved
                if (usesBlacklist === list.includes(message.channel.id)) return;
            }

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

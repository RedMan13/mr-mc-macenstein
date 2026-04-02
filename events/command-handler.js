module.exports = {
    name: 'messageCreate',
    once: false,
    execute: async (message) => {
        if (!dbs.commandConfig.prefix) return;
        if (message.content.startsWith(dbs.commandConfig.prefix)) {
            let command = message.content.split(' ')
            command[0] = command[0].slice(dbs.commandConfig.prefix.length, command[0].length)
            let args = command.splice(1, command.length).join(' ')
            command = command[0]
            if (command === 'help') {
                let commands = Object.getOwnPropertyNames(dbs.commands)
                let embed = {
                    color: 0x33cc00,
                    title: 'command list',
                    timestamp: new Date().toISOString(),
                }
                if (!args) {
                    embed.fields = []
                    for (const cat of dbs.commandConfig.categorys) {
                        embed.fields.push({
                            name: cat,
                            value: '',
                            inline: false
                        })
                    }
                    for (const command of commands) {
                        let category = embed.fields.find(field => field.name === dbs.commands[command].category);
                        if (!category) continue
                        category.value += '\n`' + command + '` ' + dbs.commands[command].description
                    }
                } else if (commands.includes(args)) {
                    const commandData = dbs.commands[args].command
                    embed.title = commandData.name
                    embed.description = (dbs.commands[args].useCLI ? 'mc!<name> <args> default\n' : '') + commandData.lDesc;
                    embed.fields = [];
                    for (const argIdx in commandData.args) {
                        const arg = commandData.args[argIdx];
                        if (dbs.commands[args].useCLI) {
                            const additionalInfo = [];
                            if (arg[1].noValue) additionalInfo.push('takes no value');
                            if (arg[1].repeatable) additionalInfo.push('can be repeated');
                            if (arg[1].match) additionalInfo.push('matches: `' + arg[1].match.source + '`');
                            if (arg[1].needs) additionalInfo.push('requires: `' + arg[1].needs.join(', ') + '`');
                            if (arg[1].default) additionalInfo.push('default value: `' + arg[1].default + '`');
                            embed.fields.push({
                                name: `--${argIdx} (${arg[0].map(alt => alt.length > 1 ? `--${alt}` : `-${alt}`).join(', ')})`,
                                value: additionalInfo.join(', ') + '\n' + (arg[2] || ''),
                                inline: true
                            });
                            continue;
                        }
                        embed.fields.push({
                            name: `${arg.name} (${arg.type}${arg.required ? '' : ', optional'})`,
                            value: arg.desc || '',
                            inline: true
                        });
                    }
                } else {
                    embed.title = 'non-existant command'
                    embed.description = 'the command you provided doesnt exist'
                }
                message.reply({ embeds: [embed] })
                return
            }
            if (!dbs.commands[command]) return
            const commandData = dbs.commands[command].command;
            message.args = args
            message.arguments = dbs.commands[command].useCLI
                ? imports.parseArgs(message.args.split(' '), commandData.args)
                : await imports.getAllArgs(message, commandData.args)
            if (typeof message.arguments === 'string') {
                message.reply(message.arguments)
                return
            }
            try {
                await commandData.execute(message)
            } catch (err) {
                message.reply('command failed :(')
                console.warn(err);
                imports.client.channels.cache.get(dbs.config.channels.console).send(err.stack)
            }
        }
    },
};

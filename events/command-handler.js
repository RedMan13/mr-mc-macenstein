module.exports = {
    name: 'messageCreate',
    once: false,
    execute: async (message) => {
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
                        let category = imports.locateCategory(dbs.commands[command].category, embed.fields)
                        if (!category) continue
                        let name = embed.fields[category].value
                        embed.fields[category].value = name + '\n`' + command + '` ' + dbs.commands[command].description
                    }
                } else if (commands.includes(args)) {
                    const commandData = dbs.commands[args].command
                    embed.title = commandData.name
                    embed.description = commandData.lDesc
                } else {
                    embed.title = 'non-existant command'
                    embed.description = 'the command you provided doesnt exist'
                }
                message.channel.send({ embeds: [embed] })
                return
            }
            if (!dbs.commands[command]) return
            const commandData = dbs.commands[command].command;
            message.args = args
            message.arguments = await imports.getAllArgs(message, commandData.args)
            if (typeof message.arguments === 'string') {
                message.channel.send(message.arguments)
                return
            }
            try {
                commandData.execute(message)
            } catch (err) {
                message.channel.send('command failed :(')
                imports.client.channels.cache.get(dbs.config.channels.console).send(err.stack)
            }
        }
    },
};

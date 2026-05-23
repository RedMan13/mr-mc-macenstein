const { AttachmentBuilder } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'help',
    category: 'hidden',
    sDesc: 'Gets help',
    lDesc: 'Sends the entire help list yippee',
    args: [
        {
            type: 'string',
            name: 'command',
            desc: 'The command you want more help for',
            optional: true
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const commands = Object.keys(dbs.commands);
        const embed = {
            color: 0x33cc00,
            title: 'non-existant command',
            description: 'the command you provided doesnt exist',
            timestamp: new Date().toISOString(),
        }

        if (commands.includes(message.arguments.command)) {
            const commandData = dbs.commands[message.arguments.command].command;
            const usesCLI = dbs.commands[message.arguments.command].useCLI;
            embed.title = commandData.name;
            embed.description = (usesCLI
                ? 'mc!<name> <args> default\n' 
                : '') + commandData.lDesc;
            embed.fields = usesCLI
                ? Object.entries(commandData.args)
                    .map(([name, arg]) => ({
                        name: `--${name} (${arg[0].map(alt => alt.length > 1 ? `--${alt}` : `-${alt}`).join(', ')})`,
                        value: (arg[1].noValue ? 'takes no value, ' : '') +
                            (arg[1].repeatable ? 'can be repeated, ' : '') +
                            (arg[1].match ? `matches: \`${arg[1].match.source}\`, ` : '') +
                            (arg[1].needs ? `requires: \`${arg[1].needs.join(', ')}\`, ` : '') +
                            (arg[1].default ? `default value: \`${arg[1].default}\`, \n` : '\n') +
                            (arg[2] || ''),
                        inline: true
                    }))
                : commandData.args.map(arg => ({
                    name: `${arg.name} (${arg.type}${arg.required ? '' : ', optional'})`,
                    value: arg.desc || '',
                    inline: true
                }));
            return message.reply({ embeds: [embed] });
        }

        embed.title = 'command list';
        embed.fields = dbs.commandConfig.categorys
            .map(category => ({
                name: category,
                value: commands
                    .filter(command => dbs.commands[command].category === category)
                    .map(command => `\`${command}\` ${dbs.commands[command].description}`)
                    .join('\n'),
                inline: false
            }))
            .filter(v => v.value.length);
        message.reply({ embeds: [embed] });
    },
};

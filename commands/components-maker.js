const embedBuilder = require('../statics/discord-embeds.js');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'components-maker',
    aliases: ['v2-maker', 'components-v2', 'components-helper', 'v2-helper'],
    category: 'languages',
    sDesc: 'Helps with making discord components V2',
    lDesc: 'Uses a bespoke XML format to help produce discord components V2',
    work: 'any',
    args: [
        {
            type: 'string',
            name: 'components',
            desc: 'The XML formated components',
            required: true
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const code = message.arguments.components.replace(/^```[a-z]*|```$/gi, '');
        let output = code;
        try {
            const jSON = JSON.parse(output = embedBuilder(`<components>${code}</components>`, true));
            output = JSON.stringify(jSON, null, '\t');
            await message.reply({
                flags: 'IsComponentsV2',
                components: jSON
            });
        } catch (err) {
            output = err.message + `\nGot: ${output}`;
        }
        message.channel.send('```json\n' + output + '```');
    },
};

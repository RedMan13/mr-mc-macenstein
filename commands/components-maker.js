const embedBuilder = require('../statics/discord-embeds.js');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'components-maker',
    alias: ['v2-maker', 'components-v2', 'components-helper', 'v2-helper'],
    category: 'languages',
    sDesc: 'Helps with making discord components V2',
    lDesc: 'Uses a bespoke XML format to help produce discord components V2',
    work: 'any',
    args: [
        {
            type: 'string',
            name: 'code',
            desc: 'The code to run, of course',
            required: true
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (message.arguments.code.startsWith('```')) message.arguments.code = message.arguments.code.replace(/^```[a-z]*|```$/gi, '');
        let output;
        try {
            const jSON = JSON.parse(output = embedBuilder(`<components>${message.arguments.code}</components>`, true));
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

let lastPing = 0;
const { AttachmentBuilder } = require('discord.js');

const toWait = 2 * 60 * 1000;
module.exports = {
    name: 'electricfuzzping',
    category: 'dumb fun',
    sDesc: 'Pings electricfuzzball',
    lDesc: 'Pings <@1203782668928421949> 6 or 7 times randomly',
    // hoping this works lel
    args: [
        {
            type: 'string',
            //lBraket: '{',
            //rBraket: '}',
            name: 'text',
            desc: 'Optional message to send after each ping',
            required: false
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if ((Date.now() - lastPing) < toWait) return message.reply(`Cooldown ends <t:${Math.round((Date.now() + (toWait - (Date.now() - lastPing))) / 1000)}:R>`);
        lastPing = Date.now();

        const args = message.arguments;
        const extraMessage = args['text'] ? ' ' + args['text'] : '';

        const pingCount = Math.random() < 0.5 ? 6 : 7;

        // pings
        for (let i = 0; i < pingCount; i++) {
            await message.channel.send({
                content: `<@1203782668928421949>${extraMessage}`,
                allowedMentions: {
                    user: ['1203782668928421949'],
                    roles: []
                }
            });
        }

        // ping count thing
        const imageUrl = pingCount === 6
            ? 'http://floppydisk-osc.github.io/random-assets/sixSeven.png'
            : 'http://floppydisk-osc.github.io/random-assets/67_2.jpg';

        const attachment = new AttachmentBuilder(imageUrl);

        await message.channel.send({
            content: `-# [Successfully pinged ElectricFuzzball ${pingCount} times] 🎉🎉`,
            files: [attachment]
        });
    },
};
//hi ddededodediamante if you see this

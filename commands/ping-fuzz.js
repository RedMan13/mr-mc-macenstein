let lastPing = 0;
const { AttachmentBuilder } = require('discord.js');

const toWait = 2 * 60 * 1000;

module.exports = {
    name: 'electricfuzzping',
    category: 'dumb fun',
    sDesc: 'Pings electricfuzzball',
    lDesc: 'Pings <@1203782668928421949> 6 or 7 times randomly',
    args: [
        {
            type: 'string',
            name: 'text',
            desc: 'Optional message to send after each ping',
            required: false
        }
    ],

    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if ((Date.now() - lastPing) < toWait) {
            return message.reply(
                `Cooldown ends <t:${Math.round((Date.now() + (toWait - (Date.now() - lastPing))) / 1000)}:R>`
            );
        }

        lastPing = Date.now();

        const args = message.arguments;
        const rawText = args['text'] || '';

        // detect pingies
        const containsPing =
            /<@!?&?\d+>|@everyone|@here/.test(rawText);

        const extraMessage = rawText ? ' ' + rawText : '';

        const pingCount = Math.random() < 0.5 ? 6 : 7;

        for (let i = 0; i < pingCount; i++) {
            await message.channel.send({
                content: `<@1203782668928421949>${extraMessage}`,
                allowedMentions: containsPing
                    ? { users: ['1203782668928421949'] } // ping whitelist
                    : undefined
            });
        }

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

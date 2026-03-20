let lastPing = 0;
const { AttachmentBuilder } = require('discord.js');

module.exports = {
    name: 'electricfuzzping',
    category: 'dumb fun',
    sDesc: 'Pings electricfuzzball',
    lDesc: 'Pings <@1203782668928421949> 6 or 7 times randomly',
    args: ['message'], // optional message
    /**
     * @param {import('discord.js').Message} message
     * @param {string[]} args
     */
    execute: async (message, args) => {
        if ((Date.now() - lastPing) < 2 * 60 * 1000) return;
        lastPing = Date.now();

        const pingCount = Math.random() < 0.5 ? 6 : 7;

        // join
        const extraMessage = args.length ? ' ' + args.join(' ') : '';

        // pings
        for (let i = 0; i < pingCount; i++) {
            await message.channel.send(`<@1203782668928421949>${extraMessage}`);
        }

        // ping count thing
        const imageUrl = pingCount === 6
            ? 'http://floppydisk-osc.github.io/random-assets/sixSeven.png'
            : 'http://floppydisk-osc.github.io/random-assets/67_2.jpg';

        const attachment = new AttachmentBuilder(imageUrl);

        // attach image / log that stuff
        await message.channel.send({
            content: `-# [Successfully pinged ElectricFuzzball ${pingCount} times] 🎉🎉`,
            files: [attachment]
        });
    },
};

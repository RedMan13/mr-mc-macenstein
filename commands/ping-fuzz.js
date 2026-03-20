let lastPing = 0;
const { AttachmentBuilder } = require('discord.js');

module.exports = {
    name: 'ping-electricfuzzball',
    category: 'dumb fun',
    sDesc: 'Pings electricfuzzball',
    lDesc: 'Pings <@1203782668928421949> six or seven times randomly',
    args: [],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if ((Date.now() - lastPing) < 2 * 60 * 1000) return;
        lastPing = Date.now();

        const pingCount = Math.random() < 0.5 ? 6 : 7;

        // pings
        for (let i = 0; i < pingCount; i++) {
            await message.channel.send('<@1203782668928421949>');
        }

        // ping count thing
        const imageUrl = pingCount === 6
            ? 'http://floppydisk-osc.github.io/random-assets/sixSeven.png'
            : 'http://floppydisk-osc.github.io/random-assets/67_2.jpg';
                //i hope this fixes it
        const attachment = new AttachmentBuilder(imageUrl);

        // attach image / log that stuff
        await message.channel.send({
            content: `-# [Successfully pinged ElectricFuzzball ${pingCount} times] 🎉🎉`,
            files: [attachment]
        });
    },
};
//hehe six sevennnnnnn

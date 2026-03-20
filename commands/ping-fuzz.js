let lastPing = 0;
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

        for (let i = 0; i < pingCount; i++) {
            message.channel.send('<@1203782668928421949>');
        }
    },
};

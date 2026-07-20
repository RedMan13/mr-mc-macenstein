const rate = require('../statics/self-rating.js');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'dawg',
    category: 'hidden',
    sDesc: 'Rates the hosts performance.',
    lDesc: 'Reports an assortment of information about how all current hosts are performing',
    work: 0,
    args: [],
    execute: async (message) => {
        message.reply(`<:dawg:1282237696424677377>`);
        const rating = rate(client.readyTimestamp);
        dbs.channels.watchDog.send(`mc;rate ${JSON.stringify({ id: dbs.id, rating })}`);
    },
};

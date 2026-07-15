const rate = require('../statics/self-rating.js');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'rate',
    category: 'hidden',
    sDesc: 'Rates the hosts performance.',
    lDesc: 'Reports an assortment of information about how all current hosts are performing',
    work: 0,
    args: [],
    execute: async (message) => {
        const rating = rate(message.createdTimestamp);
        message.reply(`i am \`\`\`json\n${JSON.stringify({ id: dbs.id, rating }, null, 4)}\`\`\``);
    },
};

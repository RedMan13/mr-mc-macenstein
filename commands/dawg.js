const rate = require('../statics/self-rating.js');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'dawg',
    category: 'hidden',
    sDesc: 'Checks if the bot got that dawg inum.',
    lDesc: 'Replies to the message with a dawg emoji, according to however many hosts there are currently.',
    work: 0,
    args: [],
    execute: async (message) => {
        message.reply(`<:dawg:1282237696424677377>`);
        const rating = rate(message.createdTimestamp);
        dbs.channels.watchDog.send(`i am \`\`\`json\n${JSON.stringify({ id: dbs.id, rating }, null, 4)}\`\`\``);
    },
};

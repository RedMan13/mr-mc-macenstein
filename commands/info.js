module.exports = {
    name: 'whats-this?',
    category: 'info',
    sDesc: 'Says what i am',
    lDesc: 'Simply states some info about why i am here',
    args: [],
    execute: async (message) => {
        message.channel.send(`I am here on behalf of <@860531746294726736>, and simply manage fun things like santa.`);
    },
};

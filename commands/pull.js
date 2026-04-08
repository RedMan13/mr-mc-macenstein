/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'pull',
    category: 'operator',
    sDesc: 'pulls from github',
    lDesc: 'pulls from github, restarting the bot if necessary',
    args: [],
    execute: async (message) => {
        if (message.author.id !== "860531746294726736") {
            message.reply(`you are not authorized to use this`);
            return;
        }
        process.send({ pull: true });
    },
};

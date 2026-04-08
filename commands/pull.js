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
        process.once('message', msg => {
            if (msg.noChanged) return message.reply('No changes!');
            if (msg.couldntMerge) return message.reply('Failed to merge because: ' + msg.couldntMerge.join('\n'));
            if (msg.updated) return message.reply('Finished! updated ' + msg.updated.length + ' files. ' + (msg.restartNeeded ? 'Bot requires restart to implement' : ''));
            if (msg.restartNeeded && msg.args === 'restart') {
                message.reply('Restarting....');
                stop();
            }
        });
    },
};

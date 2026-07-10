/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'pull',
    category: 'operator',
    sDesc: 'pulls from github',
    lDesc: 'pulls from github, restarting the bot if necessary',
    work: 0,
    args: [],
    execute: async (message) => {
        if (message.author.id !== "860531746294726736") {
            message.reply(`you are not authorized to use this`);
            return;
        }
        process.send({ pull: true });
        process.once('message', msg => {
            if (msg.noChanges) message.reply('No changes!');
            if (msg.couldntMerge) message.reply('Failed to merge because: ' + Array.isArray(msg.couldntMerge) ? msg.couldntMerge.join('\n') : msg.couldntMerge);
            if (msg.updated) message.reply('Finished! updated ' + msg.updated.length + ' files. ' + (msg.restartNeeded ? 'Bot requires restart to implement' : ''));
            if (msg.restartNeeded && msg.args === 'restart') {
                await message.channel.send('Restarting bot...');
                const global = dbs.database.global();
                global.set('restarted', true);
                global.set('restartMessage', message.id);
                global.set('restartChannel', message.channel.id);
                stop();
            }
        });
    },
};

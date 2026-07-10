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
        process.once('message', async msg => {
            if (msg.noChanges) return message.reply('No changes!');
            if (msg.couldntMerge) return message.reply('Failed to merge because: ' + (Array.isArray(msg.couldntMerge) ? msg.couldntMerge.join('\n') : msg.couldntMerge));
            if (msg.updated) await message.reply('Finished! updated ' + msg.updated.length + ' files. ');
            if (msg.restartNeeded) {
                await message.channel.send('Restarting bot...');
                const global = dbs.database.global();
                global.set('restarted', true);
                global.set('restartMessage', message.id);
                global.set('restartChannel', message.channel.id);
                stop();
            }
        });
        process.send({ pull: true });
    },
};

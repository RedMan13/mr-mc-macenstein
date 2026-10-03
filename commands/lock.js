const child = require('child_process');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'lock',
    alias: ['sleep'],
    category: 'operator',
    sDesc: 'locks (sleeps) the target host',
    lDesc: 'Makes the target host lock itself then go to sleep.',
    work: 'all',
    args: [
        {
            type: 'any',
            name: 'id',
            desc: 'The bot id to control',
            required: false
        }
    ],
    execute: async (message) => {
        if (dbs.id !== message.arguments.id && dbs.alias !== message.arguments.id) return;
        if (message.author.id !== dbs.config.users.owner) {
            message.reply(`you are not authorized to use this`);
            return;
        }
        child.exec('systemctl suspend');
        message.reply('Sleeping peacefully...');
    },
};

/** @type {import('../index.js').CommandDefinition} */ 
module.exports = { 
    name: 'shutup',
    category: 'operator',
    sDesc: 'Makes the particular host stop being major',
    lDesc: 'Causes this particular host to temporarily shut up and let anyone else handle its place',
    work: 0,
    args: [
        {
            type: 'any',
            name: 'id',
            desc: 'The bot id to control',
            required: true
        }
    ],
    execute: async (message) => {
        if (dbs.id !== message.arguments.id && dbs.alias !== message.arguments.id) return;
        if (message.author.id !== "860531746294726736") {
            message.reply(`you are not authorized to use this`);
            return;
        }
        console.log('shutting it')
        message.reply('https://klipy.com/gifs/cry-16222');
        dbs.channels.watchDog.send(`${JSON.stringify({ id: dbs.id, lie: true, rating: { available: 0 } })}`);
    },
};

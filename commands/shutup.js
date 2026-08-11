/** @type {import('../index.js').CommandDefinition} */ 
module.exports = { 
    name: 'shutup',
    category: 'operator',
    sDesc: 'Makes the particular host stop being major',
    lDesc: 'Causes this particular host to temporarily shut up and let anyone else handle its place',
    work: 'all',
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
        message.reply('https://cdn.discordapp.com/attachments/1038238583686967428/1536486266319798372/giphy-downsized.gif?ex=6a7b93d8&is=6a7a4258&hm=f6c13038bc3b2d2eb8fbf4e358820ad57bb639c81a5dddde20fc0447f5137293&');
        dbs.channels.watchDog.send(`${JSON.stringify({ id: dbs.id, lie: true, rating: { available: 0 } })}`);
    },
};

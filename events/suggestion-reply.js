const { EmbedBuilder } = require('discord.js');

const maxMemory = 10;
async function respondSanta(message, naughty = '', ...reason) {
    const messageChannel = dbs.database.channel(message.channel.id);
    const userWishes = dbs.database.user(message.author.id);
    if (!userWishes.has('history')) userWishes.set('history', []);
    userWishes.get('history').push({ naughty, wish: message.content, reason: reason.join('; ') });
    if (userWishes.get('history').length > maxMemory)
        userWishes.get('history').splice(0, userWishes.get('history').length - maxMemory);
    userWishes.flush();
    message.react('📃');
    const webhook = await imports.client.fetchWebhook(messageChannel.get('webhookId'), messageChannel.get('webhookToken')).catch(err => console.warn(err));

    const embed = new EmbedBuilder()
        .setColor(naughty.toLowerCase().includes('nice') ? 0x00FF00 : 0xFF0000)
        .setTitle(`${message.author.username} is on the ${naughty} list!`)
        .setDescription(`${reason.join('; ')} ${message.author}`)
        .setAuthor({
            name: "Santa Claus",
            url: "https://godslayerakp.serv00.net",
            iconURL: "https://pics.clipartpng.com/Cute_Santa_PNG_Clipart-21.png",
        });
    const reply = !webhook 
        ? await message.reply({ embeds: [embed] }).catch(err => console.warn(err))
        : await webhook.send({ embeds: [embed] }).catch(err => console.warn(err));
    if (!reply) message.reply(`You are ${naughty} because ${reason.join('; ')}`.slice(0, 2000));
    return;
}
module.exports = {
    name: 'messageCreate',
    once: false,
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (!dbs?.database) return;
        const data = dbs.database.channel(dbs.channels.suggestions.id);
        const suggested = data.get('suggested');
        if (!suggested) return;
        if (!message.reference || !(message.reference.messageId in suggested)) return;
        const toForward = suggested[message.reference.messageId].author;
        const suggestion = suggested[message.reference.messageId].suggestion;
        if (message.content.startsWith('accepted') || message.content.startsWith('rejected')) delete suggested[message.reference.messageId];
        const author = await imports.client.users.fetch(toForward);
        await author.send(`${suggestion.split('\n').map(line => `> ${line}`)}\n${message.content}`);
        data.flush();
    }
};


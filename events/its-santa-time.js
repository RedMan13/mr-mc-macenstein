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
        const messageChannel = dbs.database.channel(message.channel.id);
        const logsChannel = dbs.database.channel(dbs.config.channels.saintlets);
        const userWishes = dbs.database.user(message.author.id);
        if (message.channel.id === dbs.config.channels.saintlets && logsChannel.get('wishes')?.[message.reference?.messageId]) {
            const wish = logsChannel.get('wishes')[message.reference.messageId];
            delete logsChannel.get('wishes')[message.reference.messageId];
            logsChannel.flush();
            const systemMessage = await dbs.channels.saintlets.messages.fetch(message.reference.messageId).catch(err => console.warn(err));
            if (systemMessage) systemMessage.react('✅');
            const args = message.content.split('; ');
            const channel = await imports.client.channels.fetch(wish.channel).catch(err => console.warn(err));
            if (!channel) return console.error('the wishing channel is gone');
            message = await channel.messages.fetch(wish.message).catch(err => console.warn(err));
            if (!message) return console.error('the wish message is gone');
            respondSanta(message, ...args);
            return;
        }
        if (!messageChannel.get('santaIsHere')) return;
        if (!(message.content.toLowerCase().startsWith('i wish') || message.content.toLowerCase().startsWith('i want') || message.content.toLowerCase().startsWith('santa')))
            return;
        
        const react = await message.react('🧏‍♂️').catch(err => console.warn(err));
        if (!userWishes.has('history')) userWishes.set('history', []);
        const wish = `the users name is ${message.author.username}, they said \`${message.content}\`. You have said to them the following: \n${userWishes.get('history').map(message => `they said \`${message.wish}\` and were \`${message.naughty}\` because \`${message.reason}\``).join('\n')}`;
        const response = await imports.ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: wish,
            config: {
                thinkingConfig: {
                    thinkingBudget: 0, // Disables thinking
                },
                systemInstruction: `You are Santa Clause. You rate wishes and
questions that people send you as either naughty or nice. You are reading wishes
for the people who are in the PenguinMod discord server. If someone was already
naughty, and the reason for being naughty is similar in reason to the new wish,
they should remain naughty. Please remember that anthing that requires you to
change how a person thinks, rewrite the physics, or change who people worship
should be marked as naughty. Please make sure to respond in format
\`{nice|naughty}; {reason}\` where \`{nice|naughty}\` is a string that can only
ever be  \`nice\` or \`naughty\`, and \`{reason}\` is what santa would say for
declaring that wish naughty or nice. PenguinMod is often short handed as pm,
same with TurboWarp being short handed as tw. PenguinMod is currently working on
a total rewrite called \`The PenguinMod Port\` in which latest TurboWarp is
being forked and modified to support PenguinMod exclusive APIs. PenguinMod is
already a fork of TurboWarp, but has not merged anything from turbowarp for
multiple years now. The developers of PenguinMod are called JeremyGamer13,
godslayerakp, Sharkpool, ianyourgod, and jwklong. JeremyGamer13 is often simply
called Jeremy. godslayerakp is often called gsa, zeitung, or zeitung ei.
Sharkpool is often called sp. ianyourgod is often simply called ian. jwklong is
often call jwk, or packbob. PenguinMod is owned by FreshPenguin112, though they
rarely make any changes to the repository. FreshPenguin112 is often called
fresh, or john penguinmod. Since all of this is running on discord, you may
encounter message mentions (formated as \`<@{numbers}>\`). The numbers inside
those mentions are the id of the user. JeremyGamer13's id is 462098932571308033.
godslayerakp's id is 860531746294726736. Sharkpool's id is 977995410234826814.
ianyourgod's id is 790782926785609728. jwklong's id is 567307285324496897.
FreshPenguin112 id is 712497713043734539`
            }
        }).catch(() => ({}));
        if (!response.text) {
            react.remove().catch(() => {});
            message.react('👋');
            const msg = await dbs.channels.saintlets.send(`<@&1449223667992105112> ${wish}`.slice(0, 2000)).catch(err => err);
            if (msg instanceof Error) return console.error('could not make human request', msg);
            if (!logsChannel.has('wishes')) logsChannel.set('wishes', {});
            logsChannel.get('wishes')[msg.id] = {
                message: message.id,
                channel: message.channel.id
            };
            logsChannel.flush();
            return;
        } 
        console.log('santa said "', response.text, '" to the wish "', wish, '"');
        react.remove().catch(() => {});
        respondSanta(message, ...response.text.split('; '));
        userWishes.flush();
    }
};


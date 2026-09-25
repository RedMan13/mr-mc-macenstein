const rate = require('../statics/self-rating');
const { checkMessage } = require('./word-chain');
const { unsafeMessageChars, safeReplacer } = require('./word-chain');

module.exports = {
    name: 'connected',
    once: false,
    global: true,
    async execute() {
        const rating = rate(imports.client.readyTimestamp);
        dbs.channels.watchDog.send(`mc;rate ${JSON.stringify({ id: dbs.id, rating })}`);

        for (const [guildId] of imports.client.guilds.cache) {
            await dbs.database.server(guildId).loaded;
            const settings = dbs.database.server(guildId);
            if (!settings.get('wordchains-enabled')) continue;
            if (!settings.get('wordchains-channel')) continue;
            if (!settings.get('word-errors-channel')) continue;

            await dbs.database.channel(settings.get('wordchains-channel')).loaded;
            const messageChannel = dbs.database.channel(settings.get('wordchains-channel'));
            const wordChain = await imports.client.channels.fetch(settings.get('wordchains-channel'));
            const wordErrors = await imports.client.channels.fetch(settings.get('word-errors-channel'));
            const handledUsers = {}
            const userNames = {};
            /** @type {import('discord.js').Message[]} */
            const messages = (await imports.scrapeChannel(wordChain, message => message.reactions.resolve('1164828602609717248')?.me))
                .reverse();
            let used = messageChannel.get('words');
            let caughtLatest = false;
            for (const message of messages) {
                /** @type {import('discord.js').MessageReaction} */
                const reaction = message.reactions.resolve('1164828602609717248');
                if (reaction?.me) {
                    if (caughtLatest) continue;
                    caughtLatest = true;
                    const filtered = message.content.replaceAll(unsafeMessageChars, safeReplacer).toLowerCase();
                    const locator = new RegExp(`(?:^|,)${filtered}(?:$|,)`);
                    if (locator.test(used)) continue;
                    used += ',' + filtered;
                    messageChannel.set('words', used);
                    messageChannel.set('lastUser', message.author.id);
                    continue;
                }

                const checked = await checkMessage(message);
                if (!checked) {
                    message.react('<:yes:1164828602609717248>');
                    continue;   
                }

                handledUsers[message.author.id] ??= [];
                handledUsers[message.author.id].push(checked);
                userNames[message.author.id] = message.author.username;
                message.delete();
            }

            const users = Object.fromEntries(await Promise.all(Object.keys(handledUsers)
                .map(async userId => {
                    await dbs.database.user(userId).loaded;
                    return [userId, dbs.database.user(userId)]
                })))

            const problems = [];
            for (const [userId, reasons] of Object.entries(handledUsers)) {
                if (!users[userId].has('wordchains-ping') || users[userId].get('wordchains-ping'))
                    problems.push(`\n<@${userId}>:`);
                else 
                    problems.push(`\n${userNames[userId]}`);
                let lastReason = '';
                let repeated = 1;
                for (const reason of reasons) {
                    if (lastReason === reason) { repeated++; continue; }

                    if (repeated > 1)
                        problems[problems.length -1] += `(x${repeated})`;
                    problems.push(`- ${reason}`);
                    repeated = 1;
                }
                if (repeated > 1) problems += `(x${repeated})`;
            }

            if (problems.length <= 0) return;

            let page = '';
            for (const line of problems) {
                if (page.length + line.length +1 > 2000) {
                    wordErrors.send(page);
                    page = '';
                }
                page += '\n' + line;
            }
            wordErrors.send(page);
        }
    },
};

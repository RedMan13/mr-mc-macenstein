const rate = require('../statics/self-rating');
const { checkMessage } = require('./word-chain');

module.exports = {
    name: 'connected',
    once: false,
    global: true,
    async execute() {
        const rating = rate(imports.client.readyTimestamp);
        dbs.channels.watchDog.send(`mc;rate ${JSON.stringify({ id: dbs.id, rating })}`);

        const handledUsers = {}
        /** @type {import('discord.js').Message[]} */
        const messages = (await imports.scrapeChannel(dbs.channels.wordChain, message => message.reactions.resolve('1164828602609717248')?.me))
            .reverse();
        for (const message of messages) {
            /** @type {import('discord.js').MessageReaction} */
            const reaction = message.reactions.resolve('1164828602609717248');
            if (reaction?.me) continue;

            const checked = checkMessage(message);
            if (!checked) {
                message.react('<:yes:1164828602609717248>');
                continue;   
            }

            handledUsers[message.author.id] ??= [];
            handledUsers[message.author.id].push(checked);
            message.delete();
        }

        const problems = [];
        for (const [userId, reasons] of Object.entries(handledUsers)) {
            problems.push(`\n<@${userId}>:`);
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
                dbs.channels.wordErrors.send(page);
                page = '';
            }
            page += '\n' + line;
        }
        dbs.channels.wordErrors.send(page);
    },
};
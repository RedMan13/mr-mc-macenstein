const { createHash, hash } = require('crypto');
const https = require('https');

module.exports = {
    name: 'messageCreate',
    once: false,
    global: false,
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const settings = await dbs.database.server(message.channel.guild.id);
        if (!settings.get('ban-scammers')) return;
        const user = await dbs.database.user(message.author.id);

        if (message.channelId === user.get('last-channel')) return;
        user.set('last-channel', message.channelId);
        if (message.guildId === user.get('last-guild')) return;
        user.set('last-guild', message.guildId);

        const oldHash = user.get('content-hash');
        const text = hash('sha256', message.content);
        user.set('content-hash', text);
        if (oldHash && text !== oldHash) return;

        const fileHashes = user.get('file-hashes');
        const newHashes = [];
        for (const attachment of message.attachments) {
            const res = await new Promise(resolve => https.get(attachment.url, resolve).on('error', () => resolve));
            if (!res) continue;

            const hasher = createHash('sha256');
            res.pipe(hasher).setEncoding('hex');
            const hash = await new Promise(resolve => hasher.once('data', resolve));
            newHashes.push(hash);
        }
        user.set('file-hashes', newHashes);

        if (!fileHashes) return;
        if (!fileHashes.every((hash,i) => newHashes[i] === hash)) return user.delete('offense');
        if (!user.has('offense'))
            user.set('offense');
        user.add('offense');

        if (user.get('offense') < 2) return;
        user.delete('content-hash');
        user.delete('file-hashes');
        // the user has posted the exact same content more then three times in distinct channels, which suggests a scam
        dbs.channels.console.send(`Scammer ${message.author} fount`);
        message.member.ban({ deleteMessageSeconds: 60 * 60, reason: 'Appeared to be a Scammer' });
    },
};

const { AttachmentBuilder } = require('discord.js');

module.exports = {
    name: 'pfp',
    category: 'general',
    sDesc: 'Gets a users PFP',
    lDesc: 'Gets the Profile Picture of whoever you mention',
    args: [
        {
            type: 'member',
            name: 'member',
            desc: 'The person whos pfp is to be gotten',
            required: true
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const avatar = message.arguments.member.avatarURL({ extension: 'png', size: 1024 }) ??
            message.arguments.member.user.avatarURL({ extension: 'png', size: 1024 });
        if (!avatar) return message.reply('User ha no avatar');
        const file = new AttachmentBuilder(avatar);
        message.reply({ files: [file] })
    },
};

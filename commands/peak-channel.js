const { ContainerBuilder, SectionBuilder, MediaGalleryBuilder, TextDisplayBuilder } = require('discord.js');

/** @param {import('discord.js').Message} message  */
function renderMessage(message) {
    const container = new ContainerBuilder();
    const messageContentSection = new SectionBuilder();
    messageContentSection.setThumbnailAccessory({ media: { url: message.author.avatarURL() } });
    messageContentSection.addTextDisplayComponents({ content: `## ${message.author.displayName}` });
    if (message.content) messageContentSection.addTextDisplayComponents({ content: message.content });
    container.addSectionComponents(messageContentSection);

    if (message.attachments?.size > 0) {
        const messageAttachmentsGallery = new MediaGalleryBuilder();
        for (const [_, attachment] of message.attachments) {
            messageAttachmentsGallery.addItems({
                media: { url: attachment.url },
                description: attachment.description
            });
        }
        container.addMediaGalleryComponents(messageAttachmentsGallery);
    }

    container.addTextDisplayComponents({ content: `-# <R:${Math.floor((message.editedTimestamp ?? message.createdTimestamp) / 1000)}:t>` });

    // if (message.embeds.length > 0) {
    //     for (const embed of message.embeds) {
    //         const container = new ContainerBuilder();
    //         container.setAccentColor(embed.color);
    //         const titleText = embed.url
    //             ? `## [${embed.title}](${embed.url})`
    //             : `## ${embed.title}`;
    //         const title = embed.title && new TextDisplayBuilder({ content: titleText });
    //         const body = embed.description && new TextDisplayBuilder({ content: embed.description });
    //         if (embed.thumbnail) {
    //             const thumbnailBody = new SectionBuilder();
    //             if (title) thumbnailBody.addTextDisplayComponents(title);
    //             if (body) thumbnailBody.addTextDisplayComponents(body);
    //             thumbnailBody.setThumbnailAccessory({ media: embed.thumbnail });
    //         } else {
    //             if (title) container.addTextDisplayComponents(title);
    //             if (body) container.addTextDisplayComponents(body);
    //         }
    //         if (embed.image || embed.video) {
    //             const media = new MediaGalleryBuilder();
    //             media.addItems(embed.image ?? embed.video);
    //         }
    //         container.addMediaGalleryComponents(container);
    //     }
    // }

    return container;
}

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'peak',
    aliases: ['peak-channel', 'read-channel'],
    category: 'operator',
    sDesc: 'Responds with messages from channels',
    lDesc: 'Responds with all visible messages in any channel anywhere the bot can see.',
    work: 'any',
    args: [
        {
            type: 'any',
            desc: 'The channel to read',
            name: 'channel',
            required: true
        },
        {
            type: 'number',
            name: 'limit',
            max: 40,
            min: 1,
            desc: 'The number of messages to report'
        }
    ],
    async execute(message) {
        if (message.author.id !== dbs.config.users.owner) {
            message.reply(`you are not authorized to use this`);
            return;
        }
        /** @type {import('discord.js').TextBasedChannel} */
        const channel = dbs.channels[message.arguments.channel] ??
            await imports.client.channels.fetch(message.arguments.channel);
        const messages = await channel.messages.fetch({ limit: message.arguments.limit || 10 });
        await message.reply({
            flags: 'IsComponentsV2',
            components: messages.map(renderMessage),
            allowedMentions: {
                repliedUser: true,
                roles: [],
                users: []
            }
        });
    }
};

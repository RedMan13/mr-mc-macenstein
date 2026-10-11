const { Canvas, loadImage, FontLibrary } = require('skia-canvas');
const { AttachmentBuilder } = require('discord.js');
const path = require('path');

const matchUser = /\<@([0-9]+)\>/g;
FontLibrary.use('Wolpe Fanfare', path.resolve(__dirname, '../assets/wolpe-fanfare.ttf'));
/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'defeat',
    category: 'hidden',
    sDesc: 'Creates a BFDI:TPOT Defeat ONE episode thumbnail',
    lDesc: 'Creates a BFDI:TPOT Defeat ONE episode thumbnail with any username and pfp. Attaching an image file will define the pfp.',
    work: 'any',
    args: [
        {
            type: 'string',
            name: 'name',
            desc: 'Someone who needs defeated!',
            required: false
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const template = await loadImage(path.resolve(__dirname, '../assets/defeat-someone.png'));
        const targetUser = matchUser.test(message.arguments.name ?? '')
            ? (await imports.client.users.fetch(matchUser.exec(message.arguments.name)[0]))
            : message.reference
                ? (await message.channel.messages.fetch(message.reference.messageId)).author
                : message.author;
        const iconURL = message.attachments.size >= 1
            ? message.attachments.at(0).url
            : targetUser.avatarURL();
        const defeated = targetUser.id !== message.author.id
            ? targetUser.displayName ?? targetUser.username
            : message.arguments.name;
        const icon = await loadImage(iconURL);
        const can = new Canvas(template.width, template.height);
        const ctx = can.getContext('2d');
        ctx.drawImage(template, 0,0);
        ctx.save();
        ctx.translate(940, 265);
        ctx.rotate(-6 / 180 * Math.PI);
        ctx.font = '700 600px Wolpe Fanfare';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#823e54';
        ctx.drawImage(icon, 200,-25, 200,200);
        ctx.transform(1,0, -Math.tan(6 * Math.PI / 180), 1,0,0);
        ctx.fillText(defeated, 0,0, can.width);
        ctx.restore();
        message.reply({
            files: [
                new AttachmentBuilder(await can.toBuffer(), { name: 'defeat.png', description: 'defeat' })
            ]
        })
    },
};

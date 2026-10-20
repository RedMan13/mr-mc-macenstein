const { isSkia, isCairo, Canvas, loadImage, FontLibrary } = require('../statics/canvas');
const { AttachmentBuilder } = require('discord.js');
const path = require('path');

const rootWidth = 1920;
const rootHeight = 1080;
const matchUser = /\<@([0-9]+)\>/;
FontLibrary.use('Wolpe Fanfare', path.resolve(__dirname, '../assets/wolpe-fanfare.ttf'));
/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'defeat',
    category: 'image processing',
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
        const template = await loadImage(path.resolve(__dirname, '../assets/defeat-someone.png')).catch(err => Promise.reject(new Error('Failed to load template', { cause: err })));
        const targetUser = matchUser.test(message.arguments.name)
            ? (await imports.client.users.fetch(message.arguments.name.match(matchUser)[1]))
            : message.reference
                ? (await message.channel.messages.fetch(message.reference.messageId)).author
                : message.author;
        const iconURL = message.attachments.size >= 1
            ? message.attachments.at(0).url
            : targetUser.avatarURL({ extension: 'jpeg' });
        const defeated = message.arguments.name && !matchUser.test(message.arguments.name ?? '')
            ? message.arguments.name
            : targetUser.displayName ?? targetUser.username;
        const icon = await loadImage(iconURL).catch(err => {});
        const can = new Canvas(template.width, template.height);
        const ctx = can.getContext('2d');

        ctx.save();
        ctx.translate(
            940 / rootWidth * can.width,
            330 / rootHeight * can.height
        );
        ctx.rotate(-6 / 180 * Math.PI);

        if (icon) {
            ctx.drawImage(icon,
                200 / rootWidth * can.width, -70 / rootHeight * can.height, 
                200 / rootWidth * can.width, 200 / rootHeight * can.height
            );
            ctx.globalCompositeOperation = 'destination-in';
            ctx.ellipse(
                300 / rootWidth * can.width, 30 / rootHeight * can.height, 
                100 / rootWidth * can.width, 100 / rootHeight * can.height,
            0, 0, Math.PI *2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.font = `700 ${600 / rootWidth * can.width}px Wolpe Fanfare`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#823e54';
        ctx.transform(1,0, -Math.tan(6 * Math.PI / 180), 1,0,0);
        const { width } = ctx.measureText(defeated);
        ctx.scale(can.width / Math.max(width, can.width), 1);
        ctx.fillText(defeated.toUpperCase(), 0,0);
        ctx.restore();
        
        ctx.globalCompositeOperation = 'destination-over';
        ctx.drawImage(template, 0,0);

        message.reply({
            content: `\`${width}\`, \`${width / can.width}\``,
            files: [
                new AttachmentBuilder(await can.toBuffer(), { name: 'defeat.png', description: 'defeat' })
            ]
        })
    },
};

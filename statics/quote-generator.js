const { createCanvas, loadImage, parseText, drawStyled } = require('./text-tools');
const emojiRegex = require('emoji-regex'); // im not dealing with that damn regex being inside here

globalThis.nostd = true;
const imageScale = 1;
/** @type {{ [key: string]: import('./tokenizer').TokenGenerator }} */
const textFormatRules = {
    customEmoji: /<(?<animated>a?):(?<emojiName>[a-zA-Z_~0-9]+):(?<id>[0-9]+)>/,
    emoji: emojiRegex()
}
/** @type {[string[], import('./text-tools').GroupStylizer][]} */
const textFormatStyles = [
    [['customEmoji'], async ([emoji]) => {
        const image = await loadImage(Asset.CustomEmoji(emoji, 'png', 16 * imageScale));
        return {
            start: emoji.start,
            end: emoji.end,
            components: [{ type: 'image', value: image }]
        };
    }],
    [['emoji'], async ([emoji]) => ({
        start: emoji.start,
        end: emoji.end,
        components: [{ type: 'text', width: 10, value: 'idk' }]
    })]
]
function findBitEdge(num) {
    for (let i = 31; i > 0; i--) {
        if ((num >> i) & 0b1) return 1 << i;
    }
}
/**
 * @param {import('discord.js').Message} message 
 * @returns {Promise<Blob>}
 */
async function createQuoteCard(message) {
    /** @type {import('canvas').Canvas} */
    const canvas = createCanvas(640 * imageScale, 360 * imageScale);
    /** @type {import('canvas').CanvasRenderingContext2D} */
    const ctx = canvas.getContext('2d');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '20px';
    ctx.scale(imageScale, imageScale);
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0, 640,480);
    const guild = message.guild ?? await imports.client.guilds.fetch(message.guildId).catch(err => console.warn(err));
    const member = message.member ?? await guild?.members?.fetch?.(message.author.id)?.catch?.(err => console.warn(err));
    const avatar = await loadImage(
        member?.avatarURL?.({ extension: 'png', size: findBitEdge(360 * imageScale) }) ??
        message.author.avatarURL({ extension: 'png', size: findBitEdge(360 * imageScale) })
    );
    ctx.drawImage(avatar, 0,0, canvas.height, canvas.height);
    ctx.fillStyle = ctx.createLinearGradient(0,180, 360,180);
    ctx.fillStyle.addColorStop(0, '#00000000');
    ctx.fillStyle.addColorStop(1, '#000000FF');
    ctx.fillRect(0,0, 360,360);
    ctx.fillStyle = 'white';
    ctx.breakRule = 'break-longest';
    ctx.font = '20px sans-serif';
    const components = await parseText(ctx, message.content + '\n', textFormatRules, textFormatStyles);
    drawStyled(ctx, 'break-longest', true, false, components, 500, 180, 280);
    ctx.font = '12px sans-serif';
    const namePlateY = 320;
    const measures = ctx.measureText('abcdefghijklmnopqrstuvwxyz_`|');
    const textHeight = measures.actualBoundingBoxAscent + measures.actualBoundingBoxDescent
    ctx.fillStyle = ctx.createLinearGradient(500,(namePlateY - (textHeight / 2)) - 20, 500,namePlateY - (textHeight / 2));
    ctx.fillStyle.addColorStop(0, '#00000000');
    ctx.fillStyle.addColorStop(1, '#000000FF');
    ctx.fillRect(360,(namePlateY - (textHeight / 2)) - 20, 280,20);
    ctx.fillStyle = 'black';
    ctx.fillRect(360,namePlateY - (textHeight / 2), 280,360 - (namePlateY - (textHeight / 2)));
    ctx.fillStyle = '#EEE';
    ctx.fillText(message.author.username, 500, namePlateY, 280);
    return new Blob([canvas.toBuffer()], { type: 'image/png' });
}
/**
 * @param {import('discord.js').Message[]} messages 
 * @returns {Promise<Blob>}
 */
async function createQuoteMessage(messages) {
    /** @type {import('canvas').Canvas} */
    const canvas = createCanvas(4950 * imageScale, 360 * imageScale * messages.length);
    /** @type {import('canvas').CanvasRenderingContext2D} */
    const ctx = canvas.getContext('2d');
    ctx.scale(imageScale, imageScale);
    for (const message of messages) {
        /** @type {import('discord.js').Guild} */
        const guild = message.guild ?? await imports.client.guilds.fetch(message.guildId).catch(err => console.warn(err));
        const member = message.member ?? await guild?.members?.fetch?.(message.author.id).catch(err => console.warn(err));
        const avatar = await loadImage(
            member?.avatarURL?.({ extension: 'png', size: findBitEdge(360 * imageScale) }) ??
            message.author.avatarURL({ extension: 'png', size: findBitEdge(360 * imageScale) })
        );
        ctx.drawImage(avatar, 0,0, 360,360);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(180,0);
        ctx.arcTo(360,0, 360,180, 180);
        ctx.arcTo(360,360, 180,360, 180);
        ctx.arcTo(0,360, 0,180, 180);
        ctx.arcTo(0,0, 180,0, 180);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.font = 'bold 150px sans-serif';
        ctx.fillStyle = `#${member.roles.color?.color?.toString?.(16)?.padStart?.(6, '0') || 'FFF'}`;
        ctx.fillText(member?.nickname || message.author.displayName || message.author.username, 460, 180);
        ctx.textBaseline = 'top';
        ctx.font = '150px sans-serif';
        ctx.fillStyle = `white`;
        ctx.fillText(message.content, 460, 180);
        ctx.translate(0, 360);
    }
    return new Blob([canvas.toBuffer()], { type: 'image/png' });
}

module.exports = { createQuoteCard, createQuoteMessage }
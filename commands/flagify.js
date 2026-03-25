const { Canvas, loadImage, CanvasGradient } = require('skia-canvas');
const { rgbToHsv, hsvToRgb, rgbToString } = require('../statics/color');
const sharp = require('sharp');
const { AttachmentBuilder } = require('discord.js');

const canvasWidth = 480;
const canvasHeight = canvasWidth * 1.188405797;
const poleWidth = canvasWidth * 0.0625;
const poleRadius = poleWidth / 2;
const flagOutlineWidth = canvasWidth * 0.03515625;
const flagOutlineRadius = flagOutlineWidth / 2;
const flagHeight = canvasHeight * 0.517750488;
const innerFlagWidth = canvasWidth - (flagOutlineWidth + poleWidth);
const innerFlagHeight = flagHeight - flagOutlineWidth;
const rippleHeight = canvasWidth * 0.0390625;

const gradient = new CanvasGradient('linear', 0,0, 0,innerFlagHeight);
gradient.addColorStop(0, '#00000000');
gradient.addColorStop(1, '#00000040');

/** @param {CanvasRenderingContext2D} ctx */
const pole = ctx => {
    ctx.beginPath();
    ctx.lineWidth = poleWidth;
    ctx.lineCap = 'round';
    ctx.moveTo(poleRadius, poleRadius);
    ctx.lineTo(poleRadius, canvasHeight - poleWidth);
    ctx.stroke();
}

module.exports = {
    name: 'flagify',
    category: 'dumb fun',
    sDesc: 'Makes any image a flag',
    lDesc: 'Takes any image and a color, or just a color, and makes it into a penguinmod flag',
    args: [
        {
            type: 'string',
            name: 'color',
            desc: 'The primary color of everything including the flag background',
            required: false
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const canvas = new Canvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        // load attached image, if any, and extract meta from it like the primary color
        let imageDraw = () => {}
        if (message.attachments.size >= 1) {
            const rootMsg = await message.reply('Loading target image...');
            const req = await fetch(message.attachments.at(0).proxyURL);
            let image = Buffer.from(await req.bytes());
            if (['image/webp', 'image/gif', 'image/avif'].includes(req.headers.get('content-type')))
                image = sharp(image);
            const toTransform = await loadImage(image).catch(() => {});
            if (!toTransform) return rootMsg.edit('The image is in an unsupported format (supports png,jpeg,svg,webp,gif,avif,pdf ONLY)');

            const scale = Math.min(innerFlagWidth / toTransform.width, innerFlagHeight / toTransform.height);
            const width = toTransform.width * scale;
            const height = toTransform.height * scale;
            const x = flagOutlineRadius + ((innerFlagWidth - width) / 2);
            const y = flagOutlineRadius + ((innerFlagHeight - height) / 2);
            imageDraw = () => ctx.drawImage(toTransform, x,y, width, height);
            ctx.drawImage(toTransform, 0,0, width, height);
            if (!message.arguments.color) {
                const left = ctx.getImageData(0,0, 1,height);
                const right = ctx.getImageData(width,0, 1,height);
                const pixels = [...left.data, ...right.data];
                const colors = Object.entries(pixels
                    .reduce((c,v,i) => (!(i % 4) ? c.push([v]) : c.at(-1).push(v), c), [])
                    .reduce((c,v) => (c[v] ??= 0, c[v]++, c), {}))
                    .sort((a,b) => b[1] - a[1])
                    .map(([color]) => color.split(','));
                message.arguments.color = `rgb(${colors[0][0]} ${colors[0][1]} ${colors[0][2]} / ${(colors[0][3] / 255) * 100}%)`;
            }
        }

        // resolve the primary and secondary colors
        ctx.fillStyle = message.arguments.color || '#00a6ff';
        ctx.fillRect(0,0, 1,1);
        const color = rgbToHsv(ctx.getImageData(0,0, 1,1).data);
        const primaryColor = rgbToString(hsvToRgb(color));
        const secondaryColor = rgbToString(hsvToRgb({ h: color.h + 13, s: color.s, v: color.v * 0.42, a: color.a }));

        // composite each flag layer and get each pixel slice
        const slices = [];
        ctx.clearRect(0,0, canvasWidth, canvasHeight);
        ctx.fillStyle = primaryColor;
        ctx.fillRect(flagOutlineRadius,flagOutlineRadius, innerFlagWidth, innerFlagHeight);
        imageDraw();
        ctx.fillStyle = gradient;
        ctx.fillRect(flagOutlineRadius, flagOutlineRadius, innerFlagWidth, innerFlagHeight);
        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = flagOutlineWidth;
        ctx.strokeRect(flagOutlineRadius, flagOutlineRadius, innerFlagWidth, innerFlagHeight);
        for (let i = 0; i < (innerFlagWidth + flagOutlineWidth); i++)
            slices.push(ctx.getImageData(i,0, 1,innerFlagHeight + flagOutlineWidth));
        ctx.clearRect(0,0, canvasWidth, canvasHeight);

        // finish drawing, ripple the flag and draw the pole
        for (let i = 0; i < slices.length; i++) {
            const offX = i;
            const dir = Math.PI + ((offX / innerFlagWidth) * Math.PI * 2);
            const offY = (Math.sin(dir) * rippleHeight) + rippleHeight + flagOutlineWidth;
            ctx.putImageData(slices[i], offX, offY);
        }
        pole(ctx);

        message.reply({
            content: 'Finished;',
            files: [new AttachmentBuilder(await canvas.toBuffer(), { name: 'converted.png' })]
        });
    },
};

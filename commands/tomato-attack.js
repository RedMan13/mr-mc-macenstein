const { Canvas, loadImage } = require('../statics/canvas');
const sharp = require('sharp');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');
const fs = require('fs');

const tomatoRate = 30;
const width = 20; // the width of splatted tomato
const height = 23; // the height of a splatted tomato
const frames = new Array(100);
for (let i = 0; i < frames.length; i++)
    loadImage(path.resolve(__dirname, `../assets/tomato/frame-${i}.png`))
        .then(img => frames[i] = img);

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'tomato-attack',
    aliases: ['tomato'],
    category: 'image processing',
    sDesc: 'Throws tomatos at an image',
    lDesc: 'Variant of pm!tomato, namely just configurable',
    work: 'any',
    args: {
        leadingCount: [['leading-count', 'l'], { match: /^[0-9]+$/i, default: 6 }, 'How many tomatoes to start throwing, one at a time'],
        trailingCount: [['trailing-count', 't', 'c', 'default'], { match: /^(?:[0-9]+|\s*)$/i, default: 200 }, 'How many tomatoes to finish with'],
        frameRate: [['frame-rate', 'fps', 'f', 'r'], { match: /^[0-9]+$/i, default: 30 }, 'The framerate to throw tomatoes at']
    },
    execute: async message => {
        const frameRate = Number(message.arguments.frameRate) || 60;
        const leadingCount = Math.min(20, Number(message.arguments.leadingCount)) || 6;
        const trailingCount = Math.min(1000, Number(message.arguments.trailingCount)) || 100;
        const frameCount = (tomatoRate * leadingCount) + frames.length;
        if (frameCount > 4000) return message.reply('Total gif length can not be longer then 3:20!');

        if (!message.attachments.at(0)) return message.reply('You have to add an image silly!');
        const rootMsg = await message.reply('Loading target image...');
        const req = await fetch(message.attachments.at(0).proxyURL);
        if (!['image/webp', 'image/gif', 'image/avif', 'image/png', 'image/jpeg', 'image/svg+xml'].includes(req.headers.get('content-type')))
            return rootMsg.edit('The image is in an unsupported format (supports png,jpeg,svg,webp,gif,avif ONLY)');
        const image = sharp(Buffer.from(await req.bytes()));
        const background = await loadImage(image).catch(() => {});
        if (!background) {
            rootMsg.delete();
            return message.reply('Couldnt load the image :(');
        }

        const scale = Math.min(500 / background.width, 1);
        const canvas = new Canvas(background.width * scale, background.height * scale);
        const ctx = canvas.getContext('2d');

        const scatter = new Array(leadingCount + trailingCount);
        for (let i = 0; i < scatter.length; i++)
            scatter[i] = {
                x: ((canvas.width - width) * Math.random()) - 105,
                y: ((canvas.height - height) * Math.random()) - 97
            }

        await rootMsg.edit('Drawing frames...');

        const promises = [];
        const tomatoes = [];
        for (let f = 0; f < frameCount; f++) {
            ctx.drawImage(background, 0,0, canvas.width, canvas.height);
            tomatoes.forEach((frame, i) => {
                ctx.drawImage(frames[frame], scatter[i].x, scatter[i].y);
                if (frame < frames.length -1) tomatoes[i]++;
            });
            
            if (tomatoes.length === leadingCount)
                for (let i = 0; i < trailingCount; i++)
                    tomatoes.push(0);
            if (tomatoes.length < leadingCount && !(f % tomatoRate))
                tomatoes.push(0);
            promises.push(canvas.toBuffer());
        }
        const generated = await Promise.all(promises);

        await rootMsg.edit(`Encoding frames...`);

        const final = await sharp(generated, { join: { animated: true } })
            .ensureAlpha()
            .webp({ delay: new Array(frameCount).fill(Math.floor(1000 / frameRate)) })
            .toBuffer();

        rootMsg.delete();

        if (final >= 10 * 1000 * 1000) return message.reply('Haha... i couldnt send that, generated file to large.');
        message.reply({
            content: 'Finished;',
            files: [new AttachmentBuilder(final, { name: `tomatoed.webp` })]
        });
    },
};

const pixels = require('../assets/emojis.js');
const { Canvas, loadImage } = require('skia-canvas');
const sharp = require('sharp');
const { AttachmentBuilder } = require('discord.js');
const { rgbToHsv, hsvToRgb } = require('../statics/color');

const width = 32;
const height = width;
const processes = [];
async function startConvert(message, file, pixels) {
    const id = Math.round(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
    processes.push(id);
    await convert(id, message, file, pixels);
    const idx = processes.indexOf(id);
    if (idx <= -1) return;
    processes.splice(idx, 1);
}
async function convert(id, message, file, pixels) {
    const rootMsg = await message.reply(`(${id}) Loading target image...`);
    const req = await fetch(message.attachments.at(file).proxyURL);
    let image = Buffer.from(await req.bytes());
    if (['image/webp', 'image/gif', 'image/avif'].includes(req.headers.get('content-type')))
        image = sharp(image);
    const toTransform = await loadImage(image).catch(() => {});
    if (!toTransform) return rootMsg.edit('The image is in an unsupported format (supports png,jpeg,svg,webp,gif,avif,pdf ONLY)');
    let tilesWide = Math.round(toTransform.width / width);
    let tilesHigh = Math.round(toTransform.height / height);
    const scale = Math.min(24 / tilesWide, 24 / tilesHigh) * (message.arguments.scale || 1);
    tilesWide *= scale;
    tilesHigh *= scale;
    tilesWide = Math.round(tilesWide);
    tilesHigh = Math.round(tilesHigh);
    const canvas = new Canvas(tilesWide * width, tilesHigh * height);
    const ctx = canvas.getContext('2d');
    await rootMsg.edit(`(${id}) Extracting image squares at ${message.arguments.scale}x scale...`);
    ctx.drawImage(toTransform, 0,0, canvas.width, canvas.height);
    const segments = [];
    if (((canvas.height / height) * (canvas.width / width)) > 16000) return rootMsg.edit('Image or image scale is to big.');
    for (let y = 0; y < canvas.height; y += height)
        for (let x = 0; x < canvas.width; x += width) {
            const data = ctx.getImageData(x,y, width,height).data;
            segments.push(data);
        }
    // if (segments.length > 256) return rootMsg.edit('Your image must not produce any more then 256 emojis.');
    await rootMsg.edit(`(${id}) Weighting emojis...`);
    let idx = 0;
    let emoji = 0;
    let lastTime = Date.now();
    const possible = [];
    return new Promise(resolve => {
        const inter = setInterval(async () => {
            const start = Date.now();
            const startIdx = idx;
            const t = () => (Date.now() - start) >= 4000;
            topLoop: for (; idx < segments.length; idx++) {
                if (t()) break topLoop;
                possible[idx] ??= [];
                if (emoji >= pixels.length) emoji = 0;
                for (; emoji < pixels.length; emoji++) {
                    if (t()) break topLoop;
                    possible[idx][emoji] = {
                        emojiIdx: emoji,
                        weight: 0
                    }
                    for (let i = 0; i < segments[idx].length; i += 8) {
                        possible[idx][emoji].weight += Math.abs(segments[idx][i] - pixels[emoji].data[i]) +
                            Math.abs(segments[idx][i +1] - pixels[emoji].data[i +1]) +
                            Math.abs(segments[idx][i +2] - pixels[emoji].data[i +2]) +
                            Math.abs(segments[idx][i +3] - pixels[emoji].data[i +3]) +

                            Math.abs(segments[idx][i +4] - pixels[emoji].data[i +4]) +
                            Math.abs(segments[idx][i +5] - pixels[emoji].data[i +5]) +
                            Math.abs(segments[idx][i +6] - pixels[emoji].data[i +6]) +
                            Math.abs(segments[idx][i +7] - pixels[emoji].data[i +7]);
                    }
                }
            }
            if (idx >= segments.length || !processes.includes(id)) {
                clearInterval(inter);
                await rootMsg.edit(`(${id}) Finding best suited emojis...`);
                possible.forEach(list => list.sort((a,b) => a.weight - b.weight));
                rootMsg.delete();
                ctx.clearRect(0,0, canvas.width, canvas.height);
                for (let i = 0; i < possible.length; i++) {
                    const x = (i % tilesWide) * width;
                    const y = Math.floor(i / tilesWide) * height;
                    ctx.drawImage(pixels[possible[i][0].emojiIdx], x,y, width, height);
                }
                message.reply({
                    content: 'Finished;',
                    files: [new AttachmentBuilder(await canvas.toBuffer(), { name: 'converted.png' })]
                });
                return resolve();
            }
            const dt = Date.now() - lastTime;
            lastTime = Date.now();
            const di = idx - startIdx;
            rootMsg.edit(`(${id}) Weighting emojis... ${Math.round((idx / segments.length) * 100)}% ETA <t:${Math.floor((Date.now() + (dt * ((segments.length - idx) / di))) / 1000)}:R>`);
        }, 4100);
    });
}

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'emojify',
    category: 'dumb fun',
    sDesc: 'Converts an image to emojis',
    lDesc: 'Converts any one image into a set of discord emojis',
    args: {
        scale: [['s'], { match: /^[0-9]+(?:\.[0-9]+)?$/i, default: 1 }, 'The scale factor to apply to the image'],
        dump: [[], { noValue: true }, 'Dumps all of the internal emoji data'],
        // perfect: [['p'], { noValue: true }, 'If the image should be rendered perfectly'],
        mapping: [['m'], { noValue: true }, 'If the first supplied image should be used as the emoji mapping. Formatting is identical to the output of dump'],
        list: [['l'], { noValue: true }, 'List all currently running image processes'],
        cancel: [['c'], { match: /^[0-9a-f]+$/i }, 'Cancels any running image process']
    },
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (message.arguments.dump) {
            const sqaureSize = Math.ceil(Math.sqrt(pixels.length)); 
            const canvas = new Canvas(sqaureSize * width, sqaureSize * height);
            const ctx = canvas.getContext('2d');
            let i = 0;
            for (let y = 0; y < canvas.height; y += height) {
                for (let x = 0; x < canvas.width; x += width) {
                    ctx.putImageData(pixels[i][2], x,y);
                    i++;
                    if (i >= pixels.length) break;
                }
            }
            message.reply({
                files: [new AttachmentBuilder(await canvas.toBuffer(), { name: 'debug.png' })]
            });
            return;
        }
        if (message.arguments.list) {
            message.reply(processes.join(', '));
            return;
        }
        if (message.arguments.cancel) {
            const idx = processes.indexOf(message.arguments.cancel);
            if (idx < 0) return message.reply('That process doesnt exist!');
            processes.splice(idx, 1);
            return message.reply('Canceled that process');
        }
        let usedPixels = pixels;
        if (message.arguments.mapping) {
            if (message.attachments.size < 2) return message.reply('Must have atleast two attached images.');
            usedPixels = [];
            const req = await fetch(message.attachments.at(0).proxyURL);
            let image = Buffer.from(await req.bytes());
            if (['image/webp', 'image/gif', 'image/avif'].includes(req.headers.get('content-type')))
                image = sharp(image);
            const toTransform = await loadImage(image).catch(() => {});
            const canvas = new Canvas(Math.round(toTransform.width / width) * width, Math.round(toTransform.height / height) * height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(toTransform, 0,0, canvas.width, canvas.height);
            if (dbs.channels.console) message.reply('Extracting emoji pixels...');
            for (let y = 0; y < canvas.height; y += height) {
                for (let x = 0; x < canvas.width; x += width) {
                    const image = ctx.getImageData(x,y, width, height);
                    const colors = Object.entries(image.data
                        .reduce((c,v,i) => (!(i % 4) ? c.push([v]) : c.at(-1).push(v), c), [])
                        .map(v => [v, Math.floor(v[0] / 100).toString() + Math.floor(v[1] / 100).toString() + Math.floor(v[2] / 100).toString() + Math.floor(v[3] / 100).toString()])
                        .reduce((c,v) => (c[v[1]] ??= [0, v[0]], c[v[1]][0]++, c), {}))
                        .sort((a,b) => b[1][0] - a[1][0])
                        // .slice(0, 3)
                        .map(([_,[__, color]]) => color)
                        .map(rgbToHsv);
                    if (colors.length < 3) colors.push(...new Array(3 - colors.length).fill(colors.at(-1) ?? { h: 0, s: 0, v: 0, a: 0 }));
                    usedPixels.push(['', colors, image]);
                }
            }
        }
        message.arguments.scale = Math.max(Math.min(Number(message.arguments.scale), 6), 0);
        if (message.attachments.size < 1) return message.reply('Must have atleast one attached image.');
        startConvert(message, message.arguments.mapping ? 1 : 0, usedPixels);
    },
};

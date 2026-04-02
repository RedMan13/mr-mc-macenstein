const urls = require('../assets/images.json');
const { Canvas, loadImage } = require('skia-canvas');
const sharp = require('sharp');
const { AttachmentBuilder } = require('discord.js');
const { rgbToHsv, hsvToRgb } = require('../statics/color');

let ready = false;
let width;
let height; 
let pixels;
(async () => {
    const emojis = Object.keys(urls);
    pixels = [];
    console.log('Loading emoji graphics...');
    if (dbs.channels.console) dbs.channels.console.send('Loading emoji graphics...');
    const images = await Promise.all(Object.values(urls).map(url => loadImage(url)));
    width = 32;
    height = width;
    const canvas = new Canvas(width,height);
    const ctx = canvas.getContext('2d');
    console.log('Extracting emoji pixels...');
    if (dbs.channels.console) dbs.channels.console.send('Extracting emoji pixels...');
    for (const idx in images) {
        ctx.clearRect(0,0,width,height);
        ctx.drawImage(images[idx], 0,0, canvas.width,canvas.height);
        const image = ctx.getImageData(0,0, width,height);
        const colors = Object.entries(image.data
            .reduce((c,v,i) => (!(i % 4) ? c.push([v]) : c.at(-1).push(v), c), [])
            .map(v => [v, Math.floor(v[0] / 100).toString() + Math.floor(v[1] / 100).toString() + Math.floor(v[2] / 100).toString() + Math.floor(v[3] / 100).toString()])
            .reduce((c,v) => (c[v[1]] ??= [0, v[0]], c[v[1]][0]++, c), {}))
            .sort((a,b) => b[1][0] - a[1][0])
            // .slice(0, 3)
            .map(([_,[__, color]]) => color)
            .map(rgbToHsv);
        pixels.push([emojis[idx], colors, image]);
    }
    console.log('Emoji command ready!');
    if (dbs.channels.console) dbs.channels.console.send('Emoji command ready!');
    ready = true;
})()
async function startDraw(message, file, perfect) {
    const rootMsg = await message.reply('Loading target image...');
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
    const canvas = perfect 
        ? new Canvas(tilesWide * width, tilesHigh * height)
        : new Canvas(tilesWide, tilesHigh);
    const ctx = canvas.getContext('2d');
    await rootMsg.edit('Extracting image squares...');
    ctx.drawImage(toTransform, 0,0, canvas.width, canvas.height);
    const segments = [];
    if (perfect) {
        if (((canvas.height / height) * (canvas.width / width)) > 16000) return rootMsg.edit('Image or image scale is to big.');
        for (let y = 0; y < canvas.height; y += height)
            for (let x = 0; x < canvas.width; x += width) {
                const data = ctx.getImageData(x,y, width,height).data;
                segments.push(data);
            }
    } else {
        if ((canvas.height * canvas.width) > 16000) return rootMsg.edit('Image or image scale is to big.');
        for (let y = 0; y < canvas.height; y++)
            for (let x = 0; x < canvas.width; x++) {
                const data = ctx.getImageData(x,y, 1,1).data;
                const colors = rgbToHsv(data);
                segments.push(colors);
            }
    }
    // if (segments.length > 256) return rootMsg.edit('Your image must not produce any more then 256 emojis.');
    await rootMsg.edit('Weighting emojis...');
    let idx = 0;
    let emoji = 0;
    let lastTime = Date.now();
    const possible = [];
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
                if (perfect) {
                    possible[idx][emoji] = {
                        emojiIdx: emoji,
                        weight: 0
                    }
                    for (let i = 0; i < segments[idx].length; i += 8) {
                        possible[idx][emoji].weight += Math.abs(segments[idx][i] - pixels[emoji][2].data[i]) +
                            Math.abs(segments[idx][i +1] - pixels[emoji][2].data[i +1]) +
                            Math.abs(segments[idx][i +2] - pixels[emoji][2].data[i +2]) +
                            Math.abs(segments[idx][i +3] - pixels[emoji][2].data[i +3]) +

                            Math.abs(segments[idx][i +4] - pixels[emoji][2].data[i +4]) +
                            Math.abs(segments[idx][i +5] - pixels[emoji][2].data[i +5]) +
                            Math.abs(segments[idx][i +6] - pixels[emoji][2].data[i +6]) +
                            Math.abs(segments[idx][i +7] - pixels[emoji][2].data[i +7]);
                    }
                } else {
                    possible[idx][emoji] = {
                        emojiIdx: emoji,
                        weight: Math.abs(segments[idx].h - pixels[emoji][1][0].h) +
                            Math.abs(segments[idx].s - pixels[emoji][1][0].s) +
                            Math.abs(segments[idx].v - pixels[emoji][1][0].v) +
                            Math.abs(segments[idx].a - pixels[emoji][1][0].a) +

                            Math.abs(segments[idx].h - pixels[emoji][1][1].h) +
                            Math.abs(segments[idx].s - pixels[emoji][1][1].s) +
                            Math.abs(segments[idx].v - pixels[emoji][1][1].v) +
                            Math.abs(segments[idx].a - pixels[emoji][1][1].a) +

                            Math.abs(segments[idx].h - pixels[emoji][1][2].h) +
                            Math.abs(segments[idx].s - pixels[emoji][1][2].s) +
                            Math.abs(segments[idx].v - pixels[emoji][1][2].v) +
                            Math.abs(segments[idx].a - pixels[emoji][1][2].a)
                    }
                }
            }
        }
        if (idx >= segments.length) {
            clearInterval(inter);
            await rootMsg.edit('Finding best suited emojis...');
            possible.forEach(list => list.sort((a,b) => a.weight - b.weight));
            rootMsg.delete();
            if (!perfect) {
                canvas.width *= width;
                canvas.height *= height;
            }
            ctx.clearRect(0,0, canvas.width, canvas.height);
            for (let i = 0; i < possible.length; i++) {
                const x = (i % tilesWide) * width;
                const y = Math.floor(i / tilesWide) * height;
                ctx.drawImage(pixels[possible[i][0].emojiIdx][2], x,y, width, height);
            }
            message.reply({
                content: 'Finished;',
                files: [new AttachmentBuilder(await canvas.toBuffer(), { name: 'converted.png' })]
            });
            return;
        }
        const dt = Date.now() - lastTime;
        lastTime = Date.now();
        const di = idx - startIdx;
        rootMsg.edit(`Weighting emojis... ${Math.round((idx / segments.length) * 100)}% ETA <t:${Math.floor((Date.now() + (dt * ((segments.length - idx) / di))) / 1000)}:R>`);
    }, 4100);
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
        perfect: [['p'], { noValue: true }, 'If the image should be rendered perfectly']
    },
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (!ready) return message.reply('Command not ready for use.');
        if (message.arguments.dump) {
            const sqaureSize = Math.ceil(Math.sqrt(pixels.length)); 
            const canvas = new Canvas(sqaureSize * (width +10), sqaureSize * height);
            const ctx = canvas.getContext('2d');
            let i = 0;
            for (let y = 0; y < canvas.height; y += height) {
                for (let x = 0; x < canvas.width; x += width +10) {
                    ctx.putImageData(pixels[i][2], x,y);
                    const length = Math.min(pixels[i][1].length, height);
                    for (let j = 0; j < length; j++) {
                        if (!pixels[i][1][j]) break;
                        const color = '#' + hsvToRgb(pixels[i][1][j]).slice(0, 3).map(v => Math.round((v / 255) * 100).toString(16).padStart(2, '0')).join('');
                        ctx.fillStyle = color;
                        ctx.fillRect(x + width, y + ((j / length) * height), 10,height / length);
                    }
                    i++;
                    if (i >= pixels.length) break;
                }
            }
            message.reply({
                files: [new AttachmentBuilder(await canvas.toBuffer(), { name: 'debug.png' })]
            });
            return;
        }
        message.arguments.scale = Math.max(Math.min(Number(message.arguments.scale), 10), 0);
        // use a far stricter boundary for perfect resolves
        if (message.arguments.perfect) message.arguments.scale = Math.max(Math.min(message.arguments.scale, 3), 0);
        if (message.attachments.size < 1) return message.reply('Must have atleast one attached image.');
        startDraw(message, 0, message.arguments.perfect);
    },
};

const urls = require('../assets/images.json');
const { loadImage, createCanvas } = require('canvas');
const sharp = require('sharp');
const { AttachmentBuilder } = require('discord.js');
const fs = require('fs');

let ready = false;
let width;
let height;
let pixels;
let emojis;
let images;
let fileId = 51;
function rgbToHsv (rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const x = Math.min(Math.min(r, g), b);
    const v = Math.max(Math.max(r, g), b);

    // For grays, hue will be arbitrarily reported as zero. Otherwise, calculate
    let h = 0;
    let s = 0;
    if (x !== v) {
        const f = (r === x) ? g - b : ((g === x) ? b - r : r - g);
        const i = (r === x) ? 3 : ((g === x) ? 5 : 1);
        h = ((i - (f / (v - x))) * 60) % 360;
        s = (v - x) / v;
    }

    return {
        h: h,
        s: s,
        v: v,
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        a: rgb[3]
    };
}
function hsvToRgb (hsv) {
    let h = hsv.h % 360;
    if (h < 0) h += 360;
    const s = Math.max(0, Math.min(hsv.s, 1));
    const v = Math.max(0, Math.min(hsv.v, 1));

    const i = Math.floor(h / 60);
    const f = (h / 60) - i;
    const p = v * (1 - s);
    const q = v * (1 - (s * f));
    const t = v * (1 - (s * (1 - f)));

    let r;
    let g;
    let b;

    switch (i) {
    default:
    case 0:
        r = v;
        g = t;
        b = p;
        break;
    case 1:
        r = q;
        g = v;
        b = p;
        break;
    case 2:
        r = p;
        g = v;
        b = t;
        break;
    case 3:
        r = p;
        g = q;
        b = v;
        break;
    case 4:
        r = t;
        g = p;
        b = v;
        break;
    case 5:
        r = v;
        g = p;
        b = q;
        break;
    }

    return [
        Math.floor(r * 255),
        Math.floor(g * 255),
        Math.floor(b * 255),
        hsv.a
    ];
}
(async () => {
    emojis = Object.keys(urls);
    pixels = [];
    console.log('Loading emoji graphics...');
    images = await Promise.all(Object.values(urls).map(url => loadImage(url)));
    width = 32;
    height = width;
    const canvas = createCanvas(width,height);
    const ctx = canvas.getContext('2d');
    console.log('Extracting emoji pixels...');
    for (const idx in images) {
        ctx.clearRect(0,0,width,height);
        ctx.drawImage(images[idx], 0,0, width,height);
        const data = ctx.getImageData(0,0, width,height).data;
        let count = 0;
        const rgbColors = data.reduce((c,v,i) => (c[i % 4] += v, (i % 4) === 3 && (count += v / 255), c), [0,0,0,0]);
        rgbColors[0] /= count;
        rgbColors[1] /= count;
        rgbColors[2] /= count;
        rgbColors[3] /= data.length / 4;
        const colors = rgbToHsv(rgbColors);
        pixels.push([emojis[idx], colors]);
        images[idx] = [emojis[idx], images[idx]];
    }
    images = Object.fromEntries(images);
    console.log('Emoji command ready!')
    ready = true;
})()
async function startDraw(message, file) {
    const rootMsg = await message.reply('Loading target image...');
    const req = await fetch(message.attachments.at(file).proxyURL);
    let image = Buffer.from(await req.bytes());
    if (['image/webp', 'image/gif', 'image/avif'].includes(req.headers.get('content-type')))
        image = await sharp(image).png().toBuffer();
    const toTransform = await loadImage(image).catch(() => {});
    if (!toTransform) return rootMsg.edit('The image is in an unsupported format (supports png,jpeg,svg,webp,gif,avif,pdf ONLY)');
    let tilesWide = Math.max(Math.round(toTransform.width / width), 24);
    let tilesHigh = Math.max(Math.round(toTransform.height / height), 24);
    const canvas = createCanvas(tilesWide * width, tilesHigh * height);
    const ctx = canvas.getContext('2d');
    await rootMsg.edit('Extracting image squares...');
    ctx.drawImage(toTransform, 0,0, canvas.width, canvas.height);
    const segments = [];
    for (let y = 0; y < canvas.height; y += width)
        for (let x = 0; x < canvas.width; x += height) {
            const data = ctx.getImageData(x,y, width, height).data;
            let count = 0;
            const rgbColors = data.reduce((c,v,i) => (c[i % 4] += v, (i % 4) === 3 && (count += v / 255), c), [0,0,0,0]);
            rgbColors[0] /= count;
            rgbColors[1] /= count;
            rgbColors[2] /= count;
            rgbColors[3] /= data.length / 4;
            const colors = rgbToHsv(rgbColors);
            segments.push(colors);
        }
    // if (segments.length > 256) return rootMsg.edit('Your image must not produce any more then 256 emojis.');
    await rootMsg.edit('Weighting emojis...');
    let idx = 0;
    let emoji = 0;
    let lastTime = Date.now();
    const possible = [];
    const inter = setInterval(async () => {
        const start = Date.now();
        const t = () => (Date.now() - start) < 4000;
        for (; idx < segments.length && t(); idx++) {
            possible[idx] ??= [];
            if (emoji >= emojis.length) emoji = 0;
            for (; emoji < emojis.length && t(); emoji++) {
                possible[idx][emoji] = {
                    emoji: pixels[emoji][0],
                    weight: Math.abs(segments[idx].h - pixels[emoji][1].h) +
                        Math.abs(segments[idx].s - pixels[emoji][1].s) +
                        Math.abs(segments[idx].v - pixels[emoji][1].v) +
                        Math.abs(segments[idx].r - pixels[emoji][1].r) +
                        Math.abs(segments[idx].g - pixels[emoji][1].g) +
                        Math.abs(segments[idx].b - pixels[emoji][1].b) +
                        Math.abs(segments[idx].a - pixels[emoji][1].a)
                }
            }
        }
        if (idx >= segments.length) {
            clearInterval(inter);
            await rootMsg.edit('Finding best suited emojis...');
            possible.forEach(list => list.sort((a,b) => a.weight - b.weight));
            rootMsg.delete();
            ctx.clearRect(0,0, canvas.width, canvas.height);
            for (let i = 0; i < possible.length; i++) {
                const x = (i % tilesWide) * width;
                const y = Math.floor(i / tilesWide) * height;
                ctx.drawImage(images[possible[i][0].emoji], x,y, width, height);
            }
            // fs.writeFileSync('./' + fileId++ + '.png', canvas.toBuffer());
            message.reply({
                content: 'Finished;',
                files: [new AttachmentBuilder(canvas.toBuffer(), { name: 'converted.png' })]
            });
            return;
        }
        const dt = Date.now() - lastTime;
        lastTime = Date.now();
        rootMsg.edit(`Weighting emojis... ${Math.round((idx / segments.length) * 100)}% ETA <t:${Math.floor((Date.now() + (dt * (segments.length - idx))) / 1000)}:R>`);
    }, 4100);
}

module.exports = {
    name: 'emojify',
    category: 'dumb fun',
    sDesc: 'Converts an image to emojis',
    lDesc: 'Converts any one image into a set of discord emojis',
    args: [],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (!ready) return message.reply('Command not ready for use.');
        if (message.args === 'dump') {
            const sqaureSize = Math.ceil(Math.sqrt(pixels.length)); 
            const canvas = createCanvas(sqaureSize * (width +10), sqaureSize * height);
            const ctx = canvas.getContext('2d');
            let i = 0;
            for (let y = 0; y < canvas.height; y += height) {
                for (let x = 0; x < canvas.width; x += width +10) {
                    ctx.drawImage(images[pixels[i][0]], x,y, width, height);
                    const color = '#' + hsvToRgb(pixels[i][1]).slice(0, 3).map(v => Math.round((v / 255) * 100).toString(16).padStart(2, '0')).join('');
                    ctx.fillStyle = color;
                    ctx.fillRect(x + width, y, 10, height);
                    i++;
                    if (i >= pixels.length) break;
                }
            }
            message.reply({
                files: [new AttachmentBuilder(canvas.toBuffer(), { name: 'debug.png' })]
            });
            return;
        }
        if (message.attachments.size < 1) return message.reply('Must have atleast one attached image.');
        startDraw(message, 0);
    },
};

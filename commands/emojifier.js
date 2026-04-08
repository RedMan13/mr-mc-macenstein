const pixels = require('../assets/emojis.js');
const sharp = require('sharp');
const child = require('child_process');
const os = require('os');
const { AttachmentBuilder } = require('discord.js');

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
    const width = message.arguments.tileSize || 32;
    const height = width;
    const rootMsg = await message.reply(`(${id}) Loading target image...`);
    const req = await fetch(message.attachments.at(file).proxyURL);
    const image = sharp(Buffer.from(await req.bytes()));
    if (!image) return rootMsg.edit('The image is in an unsupported format (supports png,jpeg,svg,webp,gif,avif,pdf ONLY)');
    const meta = await image.metadata();
    let tilesWide = Math.round(meta.width / width);
    let tilesHigh = Math.round(meta.height / height);
    const scale = (message.arguments.scale || 1);
    tilesWide *= scale;
    tilesHigh *= scale;
    tilesWide = Math.round(tilesWide);
    tilesHigh = Math.round(tilesHigh);
    const pixelsHigh = tilesHigh * height;
    const pixelsWide = tilesWide * width;
    await rootMsg.edit(`(${id}) Extracting image squares...`);
    image.resize(pixelsWide, pixelsHigh);
    const promises = [];
    for (let y = 0; y < pixelsHigh; y += height)
        for (let x = 0; x < pixelsWide; x += width)
            promises.push(image
                .extract({ left: x, top: y, width, height })
                .ensureAlpha()
                .raw()
                .toBuffer()
                .then(buf => buf.toJSON().data));
    const segments = await Promise.all(promises);
    await rootMsg.edit(`(${id}) Weighting emojis...`);
    return new Promise(resolve => {
        const cpus = os.cpus().length / 2;
        let i = 0;
        const output = [];
        const progress = [];
        const walk = Math.ceil(segments.length / cpus);
        const subProcesses = [];
        console.log('spawning', cpus, 'processes');
        async function finish() {
            clearInterval(inter);
            subProcesses.forEach(proc => proc.kill()); // make certain to kill all humans
            await rootMsg.edit(`(${id}) Generating output image...`);
            const result = output.flat();
            const image = await sharp(new Uint8ClampedArray([0,0,0,0]), {
                raw: {
                    channels: 4,
                    width: 1, 
                    height: 1
                }
            })
                .resize(tilesWide * width, tilesHigh * height)
                .composite(result.map((emoji, i) => ({
                    left: (i % tilesWide) * width,
                    top: Math.floor(i / tilesWide) * height,
                    input: pixels[emoji].data,
                    raw: {
                        channels: 4,
                        width,
                        height
                    }
                })))
                .png()
                .toBuffer();
            rootMsg.delete();
            message.reply({
                content: 'Finished;',
                files: [new AttachmentBuilder(image, { name: 'converted.png' })]
            });
            return resolve(); 
        }
        for (let j = 0; j < cpus; j++) {
            progress[j] = 0;
            const proc = child.fork(require.resolve('../statics/emojifier-thread.js'));
            proc.once('spawn', () => proc.send([segments.slice(i, i += walk), pixels.map(p => [...p.data])]));
            proc.on('message', content => {
                if ('status' in content) {
                    console.log('process', j, 'at', content.status * 100, 'percent');
                    progress[j] = content.status * 100;
                    return;
                }
                console.log('process', j, 'finished');
                progress[j] = 100;
                output[j] = content;
                if (progress.every(p => p === 100)) finish();
            });
            subProcesses.push(proc);
        }
        const inter = setInterval(async () => {
            const percent = progress.reduce((c,v) => c + v, 0) / progress.length;
            if (percent >= 100) return finish();
            if (!processes.includes(id)) {
                clearInterval(inter);
                await rootMsg.edit(`(${id}) Conversion canceled.`);
                subProcesses.forEach(proc => proc.kill());
                return resolve();
            }
            rootMsg.edit(`(${id}) Weighting emojis... ${Math.round(percent)}% (${progress.map(per => Math.round(per) + '%').join(', ')})`);
        }, 4250);
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
        tileSize: [['tile-size', 'ts', 't'], { match: /^[0-9]+(?:\.[0-9]+)?$/i, default: 32 }, 'The pixel size to use for emoji tiles.'],
        // perfect: [['p'], { noValue: true }, 'If the image should be rendered perfectly'],
        mapping: [['m'], { noValue: true }, 'If the first supplied image should be used as the emoji mapping. Can optionally include a number to state how many pixels each square should be.'],
        list: [['l'], { noValue: true }, 'List all currently running image processes'],
        cancel: [['c'], { match: /^[0-9a-f]+$/i }, 'Cancels any running image process']
    },
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        message.arguments.tileSize = Number(message.arguments.tileSize) || 32
        const width = message.arguments.tileSize;
        const height = width;
        if (message.arguments.dump) {
            const sqaureSize = Math.ceil(Math.sqrt(pixels.length)); 
            const image = await sharp(new Uint8ClampedArray([0,0,0,0]), {
                raw: {
                    channels: 4,
                    width: 1, 
                    height: 1
                }
            })
                .resize(sqaureSize * width, sqaureSize * height)
                .composite(result.map((emoji, i) => ({
                    left: (i % sqaureSize) * width,
                    top: Math.floor(i / sqaureSize) * height,
                    input: pixels[i].data,
                    raw: {
                        channels: 4,
                        width,
                        height
                    }
                })))
                .png()
                .toBuffer();
            message.reply({
                files: [new AttachmentBuilder(image, { name: 'debug.png' })]
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
            const image = sharp(Buffer.from(await req.bytes()));
            image.resize(Math.round(toTransform.width / width) * width, Math.round(toTransform.height / height) * height);
            const promises = [];
            for (let y = 0; y < pixelsHigh; y += height)
                for (let x = 0; x < pixelsWide; x += width)
                    promises.push(image
                        .extract({ left: x, top: y, width, height })
                        .ensureAlpha()
                        .raw()
                        .toBuffer()
                        .then(buf => buf.toJSON().data));
            usedPixels = await Promise.all(promises);
        }
        message.arguments.scale = Math.max(Math.min(Number(message.arguments.scale), 16), 0);
        if (message.attachments.size < 1) return message.reply('Must have atleast one attached image.');
        startConvert(message, message.arguments.mapping ? 1 : 0, usedPixels);
    },
};

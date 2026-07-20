const simulate = require('../statics/partical-processor.js');
const sharp = require('sharp');
const { AttachmentBuilder } = require('discord.js');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'simulate',
    category: '',
    sDesc: 'Runs a partical simulation',
    lDesc: 'Takes any image, turns it into only four colors, then runs those colors as a particle simulation',
    work: 3,
    args: [],
    execute: async (message) => {
        const rootMsg = await message.reply(`Loading target image...`);
        const req = await fetch(message.attachments.at(0).proxyURL);
        const image = sharp(Buffer.from(await req.bytes()));
        if (!image) return rootMsg.edit('The image is in an unsupported format (supports png,jpeg,svg,webp,gif,avif,pdf ONLY)');
        const meta = await image.metadata();
        if (meta.width > 2048 || meta.height > 2048) return rootMsg.edit('Image dimensions must be smaller then 2048x2048');
        const pixels = (await image
            .ensureAlpha()
            .raw()
            .toBuffer())
            .reduce((c,v,i) => (!(i % 4) ? c.push([v]) : c.at(-1).push(v), c), [])
            .map(v => v[0] | v[1] << 8 | v[2] << 16 | v[3] << 24);
        const pallet = pixels
            .reduce((c,v) => (c.includes(v) || c.push(v), c), [])
            .sort((a,b) => a - b);
        const palletized = pixels.map(v => pallet.indexOf(v));
        for (let i = 0; i < pallet.length; i++)
            pallet[i] = [pallet[i] & 0xFF, (pallet[i] >> 8) & 0xFF, (pallet[i] >> 16) & 0xFF, (pallet[i] >> 24) & 0xFF];

        const ranges = [];
        for (let i = 0; i < pallet.length; i++) {
            const [r,g,b,a] = pallet[i];
            let applied = false;
            for (let j = 0; j < ranges.length; j++) {
                const [fr,fg,fb,fa] = ranges[j][0];
                const [tr,tg,tb,ta] = ranges[j][1];
                if (
                    r >= fr && r <= tr && 
                    g >= fg && g <= tg &&
                    b >= fb && b <= tb &&
                    a >= fa && a <= ta
                ) {
                    ranges[j][2].push(i);
                    applied = true;
                    break;
                }
                if (((r < fr !== g < fg) !== b < fb) !== a < fa) continue;
                const bottom = r < fr && g < fg && b < fb && a < fa;
                const distances = bottom ? [(fr - r), (fg - g), (fb - b), (fa - a)] : [(r - tr), (g - tg), (b - tb), (a - ta)];
                if (distances.some(v => Math.abs(v) > 20)) continue;
                ranges[j][2].push(i);
                ranges[j][0][0] = Math.min(r, fr);
                ranges[j][0][1] = Math.min(g, fg);
                ranges[j][0][2] = Math.min(b, fb);
                ranges[j][0][3] = Math.min(a, fa);
                ranges[j][1][0] = Math.max(r, tr);
                ranges[j][1][1] = Math.max(g, tg);
                ranges[j][1][2] = Math.max(b, tb);
                ranges[j][1][3] = Math.max(a, ta);
                applied = true;
            }
            if (!applied)
                ranges.push([[r,g,b,a], [r,g,b,a], [i], [r,g,b,a]]);
        }
        const toReplaceWith = {};
        for (let i = 0; i < ranges.length; i++) {
            const color = [
                ((ranges[i][1][0] - ranges[i][0][0]) / 2) + ranges[i][0][0],
                ((ranges[i][1][1] - ranges[i][0][1]) / 2) + ranges[i][0][1],
                ((ranges[i][1][2] - ranges[i][0][2]) / 2) + ranges[i][0][2],
                ((ranges[i][1][3] - ranges[i][0][3]) / 2) + ranges[i][0][3]
            ];
            for (let j = 1; j < ranges[i][2].length; j++) {
                toReplaceWith[ranges[i][2][j]] = ranges[i][2][0];
                delete pallet[ranges[i][2][j]];
            }
            pallet[ranges[i][2][0]] = color;
        }

        const finalPixels = new Uint8ClampedArray(palletized.flatMap(v => pallet[v]));
        const newImage = await sharp(finalPixels, {
            raw: {
                channels: 4,
                width: meta.width, 
                height: meta.height
            }
        })
            .png()
            .toBuffer();

        rootMsg.delete();
        message.reply({
            // content: `\`\`\`${pallet.map(v => ((v >> 24) & 0xFF).toString(16).padStart(2, '0') + ((v >> 16) & 0xFF).toString(16).padStart(2, '0') + ((v >> 8) & 0xFF).toString(16).padStart(2, '0') + (v & 0xFF).toString(16).padStart(2, '0')).join('\n').slice(0, 991) + '...'}\`\`\``,
            files: [new AttachmentBuilder(newImage, { name: 'converted.png' })]
        });
    }
};

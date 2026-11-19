const { Canvas, loadImage } = require('../statics/canvas');
const sharp = require('sharp');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');

const frameRate = 30;
const edits = {
    'rotate in': {
        description: 'Rotate the image into view, tiled over the background',
        frameCount: 10,
        generate(stage, image, ctx) {
            
        }
    },
    'slide': {
        description: 'Slide in from the side',
        frameCount: 10,
        generate(stage, image, ctx) {
            
        }
    },
    'kiss': {
        description: 'Kiss the camera',
        frameCount: 10,
        generate(stage, image, ctx) {
            
        }
    },
    'switch out': {
        description: 'Remove the image and replace it with the image',
        frameCount: 10,
        generate(stage, image, ctx) {
            
        }
    },
    'flip': {
        description: 'Flip horizontally',
        frameCount: 10,
        generate(stage, image, ctx) {
            const width = image.width * Math.abs(stage -.5) * 2;
            ctx.drawImage(image, (ctx.canvas.width - width) / 2,0, width,image.height);
        }
    },
    'turn style': {
        description: 'Slap that image onto a cube and spin it around like a turn style of birthday cards',
        frameCount: 10,
        generate(stage, image, ctx) {
            
        }
    },
    'news letter': {
        description: 'Fly the image in like a news letter',
        frameCount: 10,
        generate(stage, image, ctx) {
            
        }
    },
    'springy': {
        description: 'Spring the image in rotationally',
        frameCount: 10,
        generate(stage, image, ctx) {
            
        }
    },
    'picture in picture': {
        description: 'Take a snapshot and put it in the corner',
        frameCount: 10,
        generate(stage, image, ctx) {
            
        }
    },
    'cube drop': {
        description: 'Drop a cube of the image',
        frameCount: 10,
        generate(stage, image, ctx) {
            
        }
    },
    'shatter': {
        description: 'Oh no, our table, its broken',
        frameCount: 10,
        generate(stage, image, ctx) {
            
        }
    },
    'column flip': {
        description: 'Flip every column of the image seperately',
        frameCount: 10,
        generate(stage, image, ctx) {
            
        }
    },
    'swap': {
        description: 'Take out the old cart- i mean image, and put in the new one',
        frameCount: 10,
        generate(stage, image, ctx) {
            
        }
    },
    'vine boom': {
        description: 'DAMN BIRD!!!!!!',
        frameCount: 10,
        generate(stage, image, ctx) {
            
        }
    },
    'spinning globe': {
        description: 'Oh i guess we traveling now...',
        frameCount: 10,
        generate(stage, image, ctx) {
            
        }
    }
}
/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'edits',
    aliases: 'edit',
    category: 'image processing',
    sDesc: 'makes those funny edits',
    lDesc: `Make those funny edit spam gifs, edits are a comma seperated list in the format \`edit name[length]\`, where \`[length]\` is entirely optional. The following is a list of possible edits: \n\n${Object.entries(edits).map(edit => `\`${edit[0]}\`: ${edit[1].description}`).join('\n')}`,
    work: 'any',
    args: [],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const texts = message.args.split(/,\s*/g);
        let frameCount = 0;
        const stages = [];
        for (const text of texts) {
            const [_, name, length = ''] = /^(.*?)(?:\[(.*)\])?$/i.exec(text);
            if (!(name in edits)) continue;

            let frames = 0;
            for (const [_,digits,unit] of length.matchAll(/([0-9]+(?:\.[0-9]+)?)(?:\s*([hmsf]))?/gi)) {
                switch (unit.toUpperCase()) {
                case 'H': frames += digits * 60 * 60 * frameRate; break;
                case 'M': frames += digits * 60 * frameRate; break;
                case 'S': frames += digits * frameRate; break;
                case 'F': frames += Number(digits); break;
                }
            }
            frames ||= edits[name].frameCount;
            frameCount += frames;

            stages.push({
                name,
                frames,
                generate: edits[name].generate
            });
        }
        if (frameCount <= 0) return message.reply('I need to actually be tasked to draw something!');

        const rootMsg = await message.reply('Loading target image...');
        const image = await imports.loadTargetImages(message);
        const canvas = new Canvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        await rootMsg.edit('Drawing frames...');

        const promises = [];
        let frame = 0;
        for (let i = 0; i < frameCount; i++) {
            ctx.resetTransform();
            ctx.clearRect(0,0, canvas.width, canvas.height);

            stages[0].generate(frame / stages[0].frames, image, ctx);
            if (frame >= stages[0].frames) {
                frame = 0;
                stages.shift();
            }
            frame++;

            canvas.toFile(`./test/${i}.png`);
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

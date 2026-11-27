const { Canvas, loadImage, DOMMatrix, DOMPoint } = require('../statics/canvas');
const sharp = require('sharp');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');
const { quad, expo, cubic, quint, sine, bounce, elastic } = require('../statics/tweens.js');

const near = 10;
const frustum = new DOMMatrix([
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    0,0,-1 / near,1
]);
const frameRate = 30;
/** @type {{ [key: string]: { description: string, frameCount: number, generate(stage: number, image: import('../statics/canvas.js').Image, ctx: import('../statics/canvas.js').CanvasRenderingContext2D) } }} */
const edits = {
    'rotate in': {
        description: 'Rotate the image into view, tiled over the background',
        frameCount: 10,
        generate(stage, image, ctx) {
            ctx.translate(image.width, 0);
            ctx.rotate(bounce(stage, 'out') * (Math.PI / 2));
            ctx.translate(-image.width, 0);

            const pattern = ctx.createPattern(image, 'repeat');
            pattern.setTransform(new DOMMatrix().rotate(-90))
            ctx.fillStyle = pattern;
            ctx.beginPath();
            ctx.rect(0,0, image.width *2, image.height *2);
            ctx.fill();
        }
    },
    'slide': {
        description: 'Slide in from the side',
        frameCount: 10,
        generate(stage, image, ctx) {
            ctx.drawImage(image, expo(stage, 'out') * image.width, 0);
            ctx.drawImage(image, (expo(stage, 'out') * image.width) - image.width, 0);
        }
    },
    'kiss': {
        description: 'Kiss the camera',
        frameCount: 10,
        generate(stage, image, ctx) {
            ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);

            const first = Math.min(stage, 0.6) / 0.6;
            const second = (Math.max(stage, 0.6) - 0.6) / 0.4;
            
            const scale = stage <= 0.6
                ? 1+ (cubic(first, 'in') * 0.3)
                : 1.3- (cubic(second, 'out') * 0.3);
            ctx.scale(scale, scale);

            ctx.drawImage(image, -image.width / 2, -image.height / 2);
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
            const matrix = new DOMMatrix()
                .rotate(0, 45)
                .multiply(frustum);
            const points = [
                matrix.transformPoint(new DOMPoint(0,0,1,1)),
                matrix.transformPoint(new DOMPoint(image.width,0,1,1)),
                matrix.transformPoint(new DOMPoint(image.width,image.height,1,1)),
                matrix.transformPoint(new DOMPoint(0,image.height,1,1))
            ];

            ctx.setTransform(
                ctx.createProjection(
                    points.flatMap(v => [v.x * v.w, v.y * v.w])
                )
            );
            ctx.drawImage(image, 0,0);
        }
    },
    'news letter': {
        description: 'Fly the image in like a news letter',
        frameCount: 10,
        generate(stage, image, ctx) {
            ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
            ctx.scale(quint(stage, 'in'), quint(stage, 'in'));
            ctx.rotate((1- sine(stage, 'out')) * 100);
            ctx.drawImage(image, -image.width / 2, -image.height / 2);
        }
    },
    'springy': {
        description: 'Spring the image in rotationally',
        frameCount: 10,
        generate(stage, image, ctx) {
            ctx.translate(-image.width, -image.height);
            ctx.rotate(elastic(stage, 'out') * (-Math.PI / 2));
            ctx.translate(-image.width *4, -image.height);

            const pattern = ctx.createPattern(image, 'repeat');
            pattern.setTransform(new DOMMatrix().rotate(90))
            ctx.fillStyle = pattern;
            ctx.beginPath();
            ctx.rect(0,0, image.width *4, image.height *4);
            ctx.fill();
        }
    },
    'picture in picture': {
        description: 'Take a snapshot and put it in the corner',
        frameCount: 10,
        generate(stage, image, ctx) {
            const first = Math.min(stage, 0.2) / 0.2;
            const second = (Math.max(stage, 0.2) - 0.2) / 0.8;

            ctx.fillStyle = '#FFFFFF' + Math.floor((1- (Math.abs(first - 0.5) * 2)) * 255)
                .toString(16)
                .padStart(2, '0');
            ctx.drawImage(image, 0,0);
            ctx.fillRect(0,0, image.width, image.height);
            if (second > 0) {
                ctx.translate(ctx.canvas.width, 0);
                const scale = 1- (quad(second, 'out') * 0.6);
                ctx.scale(scale, scale);
                ctx.drawImage(image, -image.width,0);
            }
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
            ctx.translate(0,ctx.canvas.height / 2);
            
            for (let i = 0; i < 8; i++) {
                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
                ctx.fillStyle = 'white';
                ctx.fillRect(i * (image.width / 8), -image.height / 2, image.width / 8, image.height);
                ctx.scale(1, Math.min((stage * 8) - (i / 8), 1));
                ctx.globalCompositeOperation = 'source-in';
                ctx.drawImage(image, 0, -image.height / 2);
                ctx.restore();
            }
        }
    },
    'swap': {
        description: 'Take out the old cart- i mean image, and put in the new one',
        frameCount: 15,
        generate(stage, image, ctx) {
            ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);

            const first = Math.min(stage, 0.1) / 0.1;
            const second = (Math.min(Math.max(stage, 0.1), 0.5) - 0.1) / 0.4;
            const third = (Math.min(Math.max(stage, 0.5), 0.9) - 0.5) / 0.4;
            const fourth = (Math.max(stage, 0.9) - 0.9) / 0.1;

            const scale = 1- (cubic(stage >= 0.9 ? (1- fourth) : first, 'out') * 0.3);
            ctx.scale(scale, scale);
            if (third <= 0) ctx.translate((quad(second, 'in-out') * image.width) / scale, 0);
            if (third > 0) ctx.translate(((bounce(third, 'out') * image.width) - image.width) / scale, 0);

            ctx.drawImage(image, -image.width / 2, -image.height / 2);
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
    aliases: ['edit'],
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
            if (!(name in edits)) return message.reply(`\`${name}\` is not an effect! Did you maybe forget to make the list comma seperated?`);

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

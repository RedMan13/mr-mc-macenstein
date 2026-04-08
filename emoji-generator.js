const emojis = require('./emojis.json');
const { Canvas, loadImage } = require('skia-canvas');
const fs = require('fs');
const { rgbToHsv } = require('./statics/color');
const path = require('path');

const canvas = new Canvas(32, 32);
const ctx = canvas.getContext('2d');

ctx.textDrawingMode = "glyph";
ctx.font = '25.702px "Noto Color Emoji"';
ctx.fillStyle = 'white';
ctx.textBaseline = 'middle';
ctx.textAlign = 'center';

const files = emojis.map(icon => {
    ctx.clearRect(0,0, 32,32);
    ctx.fillText(icon, 16,16);
    const image = ctx.getImageData(0,0, 32,32);
    const text = "const { ImageData } = require('skia-canvas');\n" +
        `module.exports = new Uint8ClampedArray([\n` +
        `    ${image.data
                .reduce((c,v,i) => (!(i % 4) ? c.push([v]) : c.at(-1).push(v), c), [])
                .reduce((c,v,i) => (!(i % 32) ? c.push([v]) : c.at(-1).push(v), c), [])
                .map(row => row.map(color => color.map(c => '0x' + c.toString(16).padStart(2, '0')).join(',')).join(', '))
                .join(',\n    ')
            }\n` +
        `]);\n`;
    const str = Buffer.from(icon).toString('hex');
    const file = path.resolve(__dirname, './assets/emojis', str + '.js');
    fs.writeFileSync(file, text);
    return path.relative(path.resolve(__dirname, 'assets'), file);
});
fs.writeFileSync('./assets/emojis.js', "/** @type {import('skia-canvas').ImageData[]} */\n" +
'module.exports = [\n' +
`    ${files.map(file => `require("./${JSON.stringify(file).slice(1,-1)}")`).join(',\n    ')}\n` +
`];\n`);
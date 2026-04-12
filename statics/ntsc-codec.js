const stream = require('stream');
const { rgbToHsv } = require('./color');
const path = require('path');
const fs = require('fs');

// written to the best understanding i have of the specifications listed at https://antiqueradio.org/art/NTSC%20Signal%20Specifications.pdf
// and also the specifications listed at https://www.eetimes.com/measuring-composite-video-signal-performance-requires-understanding-differential-gain-and-phase-part-1-of-2/
// why is there so little solid documentation that can easily be found? i had the same issue with RIFF files

// design note: a "frame" is all data between two verticle sync pulses, or half of a frame as many people will attempt to tell you.
// this is because saying NTSC runs at 30fps is quite frankly disgustingly dishonest. as the signal is intended for CRT TVs
// who will, to the human eye, render each interlaced frame as a UNIQUE frame. this fact is doubled down by that fact that
// the only thing to EVER send the picture in both halves, are nothing. everything either only sent half a frame, or sent
// a new point in time for each interlaced half.

const audioFrequency = 440000; // some ludicrus number i derived from the pixel resolution
const sampleLength = 1 / audioFrequency;
const byteWidth = 4;

const frameHeight = 483;
const frameWidth = frameHeight * (4 / 3); // derivative of the above, real width is theoretically infinite

const lineSampleWidth = audioFrequency / 525;
const linePictureWidth = (lineSampleWidth - (lineSampleWidth * 0.165));
const samplesPerPixel = linePictureWidth / frameWidth;
const whiteLevel = 0x8FFFFFFF;
const blackLevel = Math.floor(whiteLevel * 0.25);
const syncLevel = 0;

const cyclesInBurst = 9;
const colorBurstLower = blackLevel * 0.9;
const colorBurstUpper = blackLevel * 1.1;
const colorBurstRange = colorBurstUpper - colorBurstLower;
const backPorchLength = (lineSampleWidth * 0.02);
const syncPulseLength = (lineSampleWidth * 0.075);
const frontPorchPre = (lineSampleWidth * 0.006);
const colorBurstLength = lineSampleWidth * 0.044;
const frontPorchPost = (lineSampleWidth * 0.02);

const verticleBlankingSamples = lineSampleWidth * (3 + 3 + 3 + 42);
const verticleSyncLongLength = lineSampleWidth * 0.46;
const verticleSyncShortLength = lineSampleWidth * 0.04;

class StreamEncoder extends stream.Transform {
    static frameWidth = frameWidth;
    static frameHeight = frameHeight;
    idx = 0;
    /**
     * Creates a stream converter that takes in 60 fps 480x360 8-bit RGB frame data and outputs a complete NTSC video broadcast signal
     * Outputs unsined 32-bit at 440000 hz PCM audio-formatted data that contains the signal
     */
    constructor() { super() }
    _transform = new Function('chunk', '_', 'callback', `
        try {
        console.time();
        const samples = Buffer.alloc(((chunk.length / 3) / ${frameWidth}) * ${lineSampleWidth} + (${verticleBlankingSamples}));
        let x = 0, y = 0;
        let syncIdx = 0;
        for (let i = 0; i < chunk.length; i += 3) {
            x++;
            if (x >= ${frameWidth}) {
                y++;
                x = 0;
                ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(backPorchLength)}
                ${`syncIdx += ${Math.floor(syncPulseLength) * byteWidth};`}
                ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(frontPorchPre)}
                ${`samples.writeUInt32LE(${blackLevel} + (${colorBurstRange / 2} * Math.sin(((this.idx + syncIdx) / ${audioFrequency}) * Math.PI *2 * ${audioFrequency / 2})), syncIdx); syncIdx += ${byteWidth}; `.repeat(colorBurstLength)}
                ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(frontPorchPost)}
            }
            if (y >= ${frameHeight}) {
                y = 0;
                ${`syncIdx += ${Math.floor(verticleSyncShortLength) * byteWidth};`}
                ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(verticleSyncLongLength)}
                ${`syncIdx += ${Math.floor(verticleSyncShortLength) * byteWidth};`}
                ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(verticleSyncLongLength)}
                ${`syncIdx += ${Math.floor(verticleSyncShortLength) * byteWidth};`}
                ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(verticleSyncLongLength)}

                ${`syncIdx += ${Math.floor(verticleSyncLongLength) * byteWidth};`}
                ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(verticleSyncShortLength)}
                ${`syncIdx += ${Math.floor(verticleSyncLongLength) * byteWidth};`}
                ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(verticleSyncShortLength)}
                ${`syncIdx += ${Math.floor(verticleSyncLongLength) * byteWidth};`}
                ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(verticleSyncShortLength)}
                
                ${`syncIdx += ${Math.floor(verticleSyncShortLength) * byteWidth};`}
                ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(verticleSyncLongLength)}
                ${`syncIdx += ${Math.floor(verticleSyncShortLength) * byteWidth};`}
                ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(verticleSyncLongLength)}
                ${`syncIdx += ${Math.floor(verticleSyncShortLength) * byteWidth};`}
                ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(verticleSyncLongLength)}
                ${`
                    ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(backPorchLength)}
                    ${`syncIdx += ${Math.floor(syncPulseLength) * byteWidth};`}
                    ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(frontPorchPre)}
                    ${`samples.writeUInt32LE(${blackLevel} + (${colorBurstRange / 2} * Math.sin(((this.idx + syncIdx) / ${audioFrequency}) * Math.PI *2 * ${audioFrequency * (cyclesInBurst / colorBurstLength)})), syncIdx); syncIdx += ${byteWidth}; `.repeat(colorBurstLength)}
                    ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(frontPorchPost)}
                    ${`samples[syncIdx++] = ${blackLevel & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 8) & 0xFF}; samples[syncIdx++] = ${(blackLevel >> 16) & 0xFF}; samples[syncIdx++] = ${blackLevel >> 24}; `.repeat(linePictureWidth)}
                `.repeat(42)}
            }

            const r = chunk[i] / 255;
            const g = chunk[i +1] / 255;
            const b = chunk[i +2] / 255;
            const level = (r * 0.30) + (g * 0.59) + (b * 0.11);
            const q = (0.41 * (b - level)) + (0.48 * (r - level));
            const j = (-0.27 * (b - level)) + (0.47 * (r - level));

            const l = Math.min(r,g,b);
            const v = Math.max(r,g,b);
            if (l !== v) {
                const f = (r === l) ? g - b : ((g === l) ? b - r : r - g);
                const i = (r === l) ? 3 : ((g === l) ? 5 : 1);
                const phase = ((i - (f / (v - l))) * 60) * Math.PI / 180;
                let amplitude = ((v - l) / v) * ${whiteLevel / 2};
                if ((-amplitude + level) < ${colorBurstLower}) amplitude = ${colorBurstLower} - level;
                ${`samples.writeUInt32LE(${blackLevel} + level, syncIdx); syncIdx += ${byteWidth}; `.repeat(samplesPerPixel)}
            } else {
                ${`samples.writeUInt32LE(${blackLevel} + level, syncIdx); syncIdx += ${byteWidth}; `.repeat(samplesPerPixel)}
            }

        }
        this.idx += syncIdx / 2;
        this.push(samples);
        console.timeEnd();
}catch(err) {
console.log(err);
                debugger;}
    `);
}

class StreamDecoder extends stream.Transform {
    constructor() { super() }
    inLine = false;
    x = 0;
    y = 0;
    idx = 0;
    _transform(chunk, _, callback) {
        console.time();
        const pixels = Buffer.alloc(frameWidth * (chunk.length / lineSampleWidth) * 3);
        let syncIdx = 0;
        let idx = 0;
        let frameStart = 0;
        if (!this.inLine) // wait until first vsync IF we are not handling the middle of a line
            while (chunk.readUInt32LE(syncIdx) > 10) syncIdx += 4; 
        for (let i = 0; i < lineSampleWidth; i++) {
            if (chunk[syncIdx] > 10) {
                frameStart = chunkIdx + this.idx;
                syncIdx += Math.floor(frontPorchPre) * 2;

                syncIdx += Math.floor(frontPorchPost) * 2;
                continue;
            }
            idx += 3;
        }

        this.inLine = !x >= frameWidth && !y >= frameHeight
        this.push(pixels);
        console.timeEnd();
    }
}

if (path.resolve(process.argv[1]) === __filename) {
    const sharp = require('sharp');
    // input is a pcm file, assume its ntsc video data
    if (path.extname(process.argv[2]) === '.pcm') {
        const decoder = new StreamDecoder();
        const image = sharp({ raw: {
            channels: 3,
            width: frameWidth,
            height: frameHeight
        } }).png();
        const output = fs.createWriteStream(process.argv[3]);
        image.pipe(output);
        const file = fs.createReadStream(process.argv[2]);
        file.pipe(decoder);
        decoder.pipe(image);
        return;
    }
    const image = sharp()
        .removeAlpha()
        .raw();
    const encoder = new StreamEncoder();
    image.pipe(encoder);
    const output = fs.createWriteStream(process.argv[3]);
    encoder.pipe(output);
    const file = fs.createReadStream(process.argv[2]);
    file.pipe(image);
}

module.exports = StreamEncoder;
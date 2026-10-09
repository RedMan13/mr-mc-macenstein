const { DecodeMP3 } = require('./mpeg-codec');
const Resampler = require('./statics/resampler');
const Speaker = require('speaker');
const fs = require('fs');

const output = new Speaker({
    bitDepth: 16,
    channels: 2,
    sampleRate: 44100
});

const decoder = new DecodeMP3();
const reSample = new Resampler({ type: 'float', sampleRate: 44100 }, { type: 'int16', sampleRate: 44100 });
decoder.pipe(reSample);
reSample.pipe(output);

fs.createReadStream(process.argv[2])
    .pipe(decoder);
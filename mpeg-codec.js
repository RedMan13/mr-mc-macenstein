const { Transform } = require('stream');

const bitrateTable = [
    new Array(16).fill(NaN),
    [0,  32000, 64000, 96000, 128000,160000,192000,224000,256000,288000,320000,352000,384000,416000,448000, NaN],
    [0,  32000, 48000, 56000,  64000, 80000, 96000,112000,128000,160000,192000,224000,256000,320000,384000, NaN],
    [0,  32000, 40000, 48000,  56000, 64000, 80000, 96000,112000,128000,160000,192000,224000,256000,320000, NaN]
];

const subLookup = [
    [0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2]
]
const limitsRateLookup = [
    [{ rate: 0, limit: 8  }, { rate: 0, limit: 8  }, { rate: 0, limit: 12 }],
    [{ rate: 1, limit: 27 }, { rate: 1, limit: 27 }, { rate: 1, limit: 27 }],
    [{ rate: 1, limit: 30 }, { rate: 1, limit: 27 }, { rate: 1, limit: 30 }]
]
// generated patchwork, toooo lazy to format into anything human readable
const subBandMetaLookup = [[{"bits":4,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7},{"levels":255,"grouped":false,"bits":8},{"levels":511,"grouped":false,"bits":9},{"levels":1023,"grouped":false,"bits":10},{"levels":2047,"grouped":false,"bits":11},{"levels":4095,"grouped":false,"bits":12},{"levels":8191,"grouped":false,"bits":13},{"levels":16383,"grouped":false,"bits":14},{"levels":32767,"grouped":false,"bits":15}]},{"bits":4,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7},{"levels":255,"grouped":false,"bits":8},{"levels":511,"grouped":false,"bits":9},{"levels":1023,"grouped":false,"bits":10},{"levels":2047,"grouped":false,"bits":11},{"levels":4095,"grouped":false,"bits":12},{"levels":8191,"grouped":false,"bits":13},{"levels":16383,"grouped":false,"bits":14},{"levels":32767,"grouped":false,"bits":15}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7}]}],[{"bits":4,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":7,"grouped":false,"bits":3},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7},{"levels":255,"grouped":false,"bits":8},{"levels":511,"grouped":false,"bits":9},{"levels":1023,"grouped":false,"bits":10},{"levels":2047,"grouped":false,"bits":11},{"levels":4095,"grouped":false,"bits":12},{"levels":8191,"grouped":false,"bits":13},{"levels":16383,"grouped":false,"bits":14},{"levels":32767,"grouped":false,"bits":15},{"levels":65535,"grouped":false,"bits":16}]},{"bits":4,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":7,"grouped":false,"bits":3},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7},{"levels":255,"grouped":false,"bits":8},{"levels":511,"grouped":false,"bits":9},{"levels":1023,"grouped":false,"bits":10},{"levels":2047,"grouped":false,"bits":11},{"levels":4095,"grouped":false,"bits":12},{"levels":8191,"grouped":false,"bits":13},{"levels":16383,"grouped":false,"bits":14},{"levels":32767,"grouped":false,"bits":15},{"levels":65535,"grouped":false,"bits":16}]},{"bits":4,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":7,"grouped":false,"bits":3},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7},{"levels":255,"grouped":false,"bits":8},{"levels":511,"grouped":false,"bits":9},{"levels":1023,"grouped":false,"bits":10},{"levels":2047,"grouped":false,"bits":11},{"levels":4095,"grouped":false,"bits":12},{"levels":8191,"grouped":false,"bits":13},{"levels":16383,"grouped":false,"bits":14},{"levels":32767,"grouped":false,"bits":15},{"levels":65535,"grouped":false,"bits":16}]},{"bits":4,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7},{"levels":255,"grouped":false,"bits":8},{"levels":511,"grouped":false,"bits":9},{"levels":1023,"grouped":false,"bits":10},{"levels":2047,"grouped":false,"bits":11},{"levels":4095,"grouped":false,"bits":12},{"levels":8191,"grouped":false,"bits":13},{"levels":65535,"grouped":false,"bits":16}]},{"bits":4,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7},{"levels":255,"grouped":false,"bits":8},{"levels":511,"grouped":false,"bits":9},{"levels":1023,"grouped":false,"bits":10},{"levels":2047,"grouped":false,"bits":11},{"levels":4095,"grouped":false,"bits":12},{"levels":8191,"grouped":false,"bits":13},{"levels":65535,"grouped":false,"bits":16}]},{"bits":4,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7},{"levels":255,"grouped":false,"bits":8},{"levels":511,"grouped":false,"bits":9},{"levels":1023,"grouped":false,"bits":10},{"levels":2047,"grouped":false,"bits":11},{"levels":4095,"grouped":false,"bits":12},{"levels":8191,"grouped":false,"bits":13},{"levels":65535,"grouped":false,"bits":16}]},{"bits":4,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7},{"levels":255,"grouped":false,"bits":8},{"levels":511,"grouped":false,"bits":9},{"levels":1023,"grouped":false,"bits":10},{"levels":2047,"grouped":false,"bits":11},{"levels":4095,"grouped":false,"bits":12},{"levels":8191,"grouped":false,"bits":13},{"levels":65535,"grouped":false,"bits":16}]},{"bits":4,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7},{"levels":255,"grouped":false,"bits":8},{"levels":511,"grouped":false,"bits":9},{"levels":1023,"grouped":false,"bits":10},{"levels":2047,"grouped":false,"bits":11},{"levels":4095,"grouped":false,"bits":12},{"levels":8191,"grouped":false,"bits":13},{"levels":65535,"grouped":false,"bits":16}]},{"bits":4,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7},{"levels":255,"grouped":false,"bits":8},{"levels":511,"grouped":false,"bits":9},{"levels":1023,"grouped":false,"bits":10},{"levels":2047,"grouped":false,"bits":11},{"levels":4095,"grouped":false,"bits":12},{"levels":8191,"grouped":false,"bits":13},{"levels":65535,"grouped":false,"bits":16}]},{"bits":4,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7},{"levels":255,"grouped":false,"bits":8},{"levels":511,"grouped":false,"bits":9},{"levels":1023,"grouped":false,"bits":10},{"levels":2047,"grouped":false,"bits":11},{"levels":4095,"grouped":false,"bits":12},{"levels":8191,"grouped":false,"bits":13},{"levels":65535,"grouped":false,"bits":16}]},{"bits":4,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7},{"levels":255,"grouped":false,"bits":8},{"levels":511,"grouped":false,"bits":9},{"levels":1023,"grouped":false,"bits":10},{"levels":2047,"grouped":false,"bits":11},{"levels":4095,"grouped":false,"bits":12},{"levels":8191,"grouped":false,"bits":13},{"levels":65535,"grouped":false,"bits":16}]},{"bits":4,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":63,"grouped":false,"bits":6},{"levels":127,"grouped":false,"bits":7},{"levels":255,"grouped":false,"bits":8},{"levels":511,"grouped":false,"bits":9},{"levels":1023,"grouped":false,"bits":10},{"levels":2047,"grouped":false,"bits":11},{"levels":4095,"grouped":false,"bits":12},{"levels":8191,"grouped":false,"bits":13},{"levels":65535,"grouped":false,"bits":16}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":65535,"grouped":false,"bits":16}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":65535,"grouped":false,"bits":16}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":65535,"grouped":false,"bits":16}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":65535,"grouped":false,"bits":16}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":65535,"grouped":false,"bits":16}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":65535,"grouped":false,"bits":16}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":65535,"grouped":false,"bits":16}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":65535,"grouped":false,"bits":16}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":65535,"grouped":false,"bits":16}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":65535,"grouped":false,"bits":16}]},{"bits":3,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":7,"grouped":false,"bits":3},{"levels":9,"grouped":true,"bits":10},{"levels":15,"grouped":false,"bits":4},{"levels":31,"grouped":false,"bits":5},{"levels":65535,"grouped":false,"bits":16}]},{"bits":2,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":65535,"grouped":false,"bits":16}]},{"bits":2,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":65535,"grouped":false,"bits":16}]},{"bits":2,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":65535,"grouped":false,"bits":16}]},{"bits":2,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":65535,"grouped":false,"bits":16}]},{"bits":2,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":65535,"grouped":false,"bits":16}]},{"bits":2,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":65535,"grouped":false,"bits":16}]},{"bits":2,"maps":[null,{"levels":3,"grouped":true,"bits":5},{"levels":5,"grouped":true,"bits":7},{"levels":65535,"grouped":false,"bits":16}]}]]
const cdTable = {
    3: [1.33333333333, 0.50000000000],
    5: [1.60000000000, 0.50000000000],
    7: [1.14285714286, 0.25000000000],
    9: [1.77777777777, 0.50000000000],
    15: [1.06666666666, 0.12500000000],
    31: [1.03225806452, 0.06250000000],
    63: [1.01587301587, 0.03125000000],
    127: [1.00787401575, 0.01562500000],
    255: [1.00392156863, 0.00781250000],
    511: [1.00195694716, 0.00390625000],
    1023: [1.00097751711, 0.00195312500],
    2047: [1.00048851979, 0.00097656250],
    4095: [1.00024420024, 0.00048828125],
    8191: [1.00012208522, 0.00024414063],
    16383: [1.00006103888, 0.00012207031],
    32767: [1.00003051851, 0.00006103516],
    65535: [1.00001525902, 0.00003051758]
}

class EncodeMP3 extends Transform {
    constructor() {}
}
class DecodeMP3 extends Transform {
    readStep = 0;
    buffer;
    stage = 0;

    id;
    layer;
    protection;
    bitrate;
    bitrateIndex;
    sampleRate;
    sampleRateIndex;
    padded;
    mode;
    bound;
    copyrighted;
    copied;
    emphasis;
    channels;
    subBands;

    l2Rate;

    _subIdx = 0;
    _phase = 0;
    _idx = 0;
    _onEdge = false;
    _edgeStart = 0;
    _readOfThree(byte) {
        let v;
        switch (this._phase++ % 4) {
        case 0: v = byte >> 2; break;
        case 1: v = ((this.buffer << 4) & 0b00110000) | ((byte & 0b11110000) >> 4); break;
        case 2: v = ((this.buffer << 2) & 0b00111100) | ((byte & 0b11000000) >> 6);
        case 3: v = byte & 0b00111111;
        }
        this.buffer = byte;
        return v;
    }
    _applySign(num, bits) {
        const signMask = 0xFFFFFFFF ^ ((bits >> (bits -1)) << (bits -1));
        if (num >> (bits -1)) return (num & signMask) * -1;
        return num;
    }

    _transform(chunk, encoding, callback) {
        for (let pos = 0; pos < chunk.length; pos++) {
            switch (this.stage) {
            case 0: if (chunk[pos] === 0xFF) this.stage++; break;
            case 1:
                if ((chunk[pos] & 0xF0) !== 0xF0) { this.stage = 0; break; }
                this.id = chunk[pos] & 0b00001000;
                this.layer = 4 - ((chunk[pos] >> 1) & 0b00000011);
                if (this.layer === 4) {
                    console.warn('Bad layer index! Casting to layer two');
                    this.layer = 2;
                }
                this.protection = chunk[pos] & 0b00000001;
                this.stage++;
                break;
            case 2:
                this.bitrate = bitrateTable[this.layer][this.bitrateIndex = (chunk[pos] & 0b11110000) >> 4];
                this.sampleRate = [44100, 48000, 32000][this.sampleRateIndex = (chunk[pos] & 0b00001100) >> 2];
                this.padded = chunk[pos] & 0b00000010;
                this.stage++;
                break;
            case 3:
                this.mode = (chunk[pos] & 0b11000000) >> 6;
                this.channels = +(this.mode === 0b11) || 2;
                this.bound = 32;
                if (this.mode === 0b10)
                    this.bound = (((chunk[pos] & 0b00110000) >> 4) +1) * 4;
                this.copyrighted = chunk[pos] & 0b00001000;
                this.copied = chunk[pos] & 0b00000100;
                this.emphasis = chunk[pos] & 0b00000011;

                // setup for actual decoding now that everything is available
                switch (this.layer) {
                case 1:
                    this.subBands = new Array(32 * this.channels).fill(0)
                        .map(() => ({
                            allocation: null,
                            scaleFactor: null,
                            samples: new Uint8Array(12)
                        }));
                    break;
                case 2:
                    const coreMeta = limitsRateLookup[subLookup[this.channels -1][this.bitrateIndex]][this.sampleRateIndex];
                    this.l2Rate = coreMeta.rate;
                    this.bound = Math.max(this.bound, coreMeta.limit);

                    this.subBands = new Array(coreMeta.limit * this.channels).fill(0)
                        .map(() => ({
                            allocation: null,
                            scaleFactor: new Array(3),
                            samples: new Array(36),
                            selector: null
                        }));
                    break;
                case 3: // three is special
                    break;
                }

                this.stage++;
                break;
            case 4: if (this.protection) { this.stage++; break; }
            case 5: if (this.protection) { this.stage++; break; }
            case 6: this.stage = 6; // if theres no crc then we end up here while on stage 4
                switch (this.layer) {
                case 1: this.stage = 7; break;
                case 2: this.stage = this.channels == 1 ? 10 : 13; break;
                }
                pos--; // make sure this dummy stage doesnt eat a byte
                break;
            // MPEG-1 Layer-1 decoder
            case 7: 
                const hi = (chunk[pos] & 0b11110000) >> 4;
                const lo = chunk[pos] & 0b00001111;
                if (this._idx < (this.bounds *2)) {
                    this.subBands[this._idx].allocation = hi && hi +1;
                    this.subBands[this._idx +1].allocation = lo && lo +1;
                } else {
                    this.subBands[this._idx].allocation = hi && hi +1;
                    this.subBands[this._idx +1].allocation = hi && hi +1;
                    this.subBands[this._idx +2].allocation = lo && lo +1;
                    this.subBands[this._idx +3].allocation = lo && lo +1;
                }
                this._idx += 2;
                if (this._idx >= this.subBands.length) {
                    this._idx = 0;
                    this.stage++;
                }
                break;
            case 8:
                if (!this.subBands[this._idx].allocation) { this._idx++; break; }
                switch (this._idx % 3) {
                case 1: this.subBands[this._idx].scaleFactor = (chunk[pos] & 0b11111100) >> 2; break;
                case 2: this.subBands[this._idx].scaleFactor = ((this.buffer[pos] & 0b00000011) << 4) | ((chunk[pos] & 0b11110000) >> 4); break;
                case 3: // oh hey, theres four of them
                    this.subBands[this._idx].scaleFactor = ((this.buffer[pos] & 0b00001111) << 2) | ((chunk[pos] & 0b11000000) >> 6);
                    this._idx++;
                    this.subBands[this._idx].scaleFactor = (chunk[pos] & 0b00111111) >> 2;
                    break;
                }
                this.subBands[this._idx];
                this.buffer = chunk[pos];
                this._idx++;
                if (this._idx >= this.subBands.length) {
                    this._idx = 0;
                    this._stage++;
                    // this should technically be a buffer, but an array is easier to slide
                    this.buffer = new Array(3);
                }
                break;
            case 9:
                this.buffer.shift(); this.buffer.push(chunk[pos]);
                this.stage = 0;
                break;
                
                // MPEG-1 Layer-2 mono decoder
            case 10: {
                const widths = subBandMetaLookup[this.l2Rate];
                if (this._onEdge) {
                    this.subBands[this._idx].allocation = widths[this._idx].maps[(((this.buffer << this._edgeStart) & 0xFF) >> (this._edgeStart - this._onEdge)) | (chunk[pos] >> (8- this._onEdge))];
                    this._idx++;
                }
                let read = this._onEdge;
                while (this._idx < this.subBands.length) {
                    const bit = read;
                    read += widths[this._idx].bits;
                    this.subBands[this._idx].allocation = widths[this._idx].maps[((chunk[pos] << bit) & 0xFF) >> (8- widths[this._idx].bits)];
                    if (read >= 8) {
                        this._edgeStart = bit;
                        this._onEdge = read % 8;
                        if (!this._onEdge) this._idx++;
                        break;
                    }
                    this._idx++;
                }
                this.buffer = chunk[pos];
                
                if (this._idx >= this.subBands.length) {
                    this._idx = 0;
                    this.stage++;
                }
                break;
            }
            case 11:
                let i = 0;
                while (i < 4) {
                    if (this._idx >= this.subBands.length) break;
                    if (!this.subBands[this._idx].allocation) { this._idx++; continue; }
                    switch (i) {
                    case 0: this.subBands[this._idx].selector = chunk[pos] >> 6; break;
                    case 1: this.subBands[this._idx].selector = (chunk[pos] >> 4) & 0b00000011; break;
                    case 2: this.subBands[this._idx].selector = (chunk[pos] >> 2) & 0b00000011; break;
                    case 3: this.subBands[this._idx].selector = chunk[pos] & 0b00000011; break;
                    }
                    i++; this._idx++;
                }

                if (this._idx >= this.subBands.length) {
                    this._idx = 0;
                    this.stage++;
                }
                break;
            case 12:
                while (!this.subBands[this._idx].allocation) this._idx++;
                this.subBands[this._idx].scaleFactor[this._subIdx] = this._readOfThree(chunk[pos]);
                this._subIdx++;
                switch (this.subBands[this._idx].selector) {
                case 0:
                    if (this._subIdx >= 3) {
                        this._subIdx = 0;
                        this._idx++;
                    }
                    break;
                case 3:
                case 1:
                    if (this._subIdx >= 2) {
                        this.subBands[this._idx].scaleFactor = [
                            this.subBands[this._idx].scaleFactor[0],
                            this.subBands[this._idx].scaleFactor[0],
                            this.subBands[this._idx].scaleFactor[1]
                        ]
                        this._subIdx = 0;
                        this._idx++;
                    }
                    break;
                case 2:
                    this.subBands[this._idx].scaleFactor = [
                        this.subBands[this._idx].scaleFactor[0],
                        this.subBands[this._idx].scaleFactor[0],
                        this.subBands[this._idx].scaleFactor[0]
                    ]
                    this._idx++;
                    this._subIdx = 0;
                    break;
                }

                if (this._idx >= this.subBands.length) {
                    this._idx = 0;
                    this.stage++;
                    this.buffer = Buffer.alloc(Math.ceil(this.subBands.reduce((c,v) => c + ((v.allocation?.bits ?? 0) * (12 * (v.allocation?.grouped ? 1 : 3))), 0) / 8) +4);
                }
                break;
            case 13: // i can not currently fathom how i could possibly implement stage 10, but with support for >8 bits
                     // so instead, just buffer the entire expected bit length to process all at once 
                this.buffer[this._idx++] = chunk[pos];
                
                if (this._idx >= this.buffer.length) {
                    this._idx = 0;
                    let byte = 0;
                    for (let grain = 0; grain < 36; grain += 3) {
                        for (let band = 0; band < this.subBands.length; band++) {
                            const meta = this.subBands[band].allocation;
                            if (!meta) continue;
                            if (meta.grouped) {
                                const slice = this.buffer.readUint32BE(Math.floor(byte));
                                let data = (slice << ((byte * 8) % 8)) >> (32- meta.bits);
                                this.subBands[band].samples[grain] = data % meta.levels;
                                data /= meta.levels;
                                this.subBands[band].samples[grain +1] = data % meta.levels;
                                data /= meta.levels;
                                this.subBands[band].samples[grain +2] = data % meta.levels;
                                data /= meta.levels;
                                byte += meta.bits / 8;
                                continue;
                            } 
                            this.subBands[band].samples[grain] = (this.buffer.readUint32BE(Math.floor(byte)) << ((byte * 8) % 8)) >> (32- meta.bits);
                            byte += meta.bits / 8;
                            this.subBands[band].samples[grain +1] = (this.buffer.readUint32BE(Math.floor(byte)) << ((byte * 8) % 8)) >> (32- meta.bits);
                            byte += meta.bits / 8;
                            this.subBands[band].samples[grain +2] = (this.buffer.readUint32BE(Math.floor(byte)) << ((byte * 8) % 8)) >> (32- meta.bits);
                            byte += meta.bits / 8;
                        }
                    }
                    for (let band = 0; band < this.subBands.length; band++) {
                        const meta = this.subBands[band].allocation;
                        if (!meta) continue;
                        for (let i = 0; i < this.subBands[band].samples.length; i++) {
                            const sample = this.subBands[band].samples[i];
                            const signed = this._applySign(sample, meta.bits);
                            const [c,d] = cdTable[meta.levels];
                            this.subBands[band].samples[i] = (c * (signed + d)) * this.subBands[band].scaleFactor[i % 3];
                        }
                    }
                    
                    this.stage = 0;
                }
                break;
            }
        }
    }
}

module.exports = { DecodeMP3, EncodeMP3 };
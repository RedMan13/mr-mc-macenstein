const { Transform } = require('stream');

/**
 * @typedef {Object} MappingSpecs
 * @prop {(this: Buffer, idx: number) => number} read The buffer instance function used to read this type
 * @prop {(this: Buffer, value: number, idx: number) => void} write The buffer instance function used to write this type
 * @prop {number} width The number of bit width of this type
 * @prop {number} top The maximum value that can be stored in this type
 * @prop {number} bottom The minimum value that can be stored in this type
 * @prop {number} range The distance between the top and bottom
 */

/** @type {{ [key: string]: MappingSpecs }} */
const mapping = {
    int8: { top: 0x7F, bottom: -0x8F, width: 1, read: Buffer.prototype.readInt8, write: Buffer.prototype.writeInt8 },
    uint8: { top: 0xFF, bottom: 0x00, width: 1, read: Buffer.prototype.readUInt8, write: Buffer.prototype.writeUInt8 },

    int16le: { top: 0x7FFF, bottom: -0x8FFF, width: 2, read: Buffer.prototype.readInt16LE, write: Buffer.prototype.writeInt16LE },
    uint16le: { top: 0xFFFF, bottom: 0x0000, width: 2, read: Buffer.prototype.readUInt16LE, write: Buffer.prototype.writeUInt16LE },
    int32le: { top: 0x7FFFFFFF, bottom: -0x8FFFFFFF, width: 4, read: Buffer.prototype.readInt32LE, write: Buffer.prototype.writeInt32LE },
    uint32le: { top: 0xFFFFFFFF, bottom: 0x00000000, width: 4, read: Buffer.prototype.readUInt32LE, write: Buffer.prototype.writeUInt32LE },
    floatle: { top: 1, bottom: -1, width: 4, read: Buffer.prototype.readFloatLE, write: Buffer.prototype.writeFloatLE },
    doublele: { top: 1, bottom: -1, width: 8, read: Buffer.prototype.readDoubleLE, write: Buffer.prototype.writeDoubleLE },

    int16be: { top: 0x7FFF, bottom: -0x8FFF, width: 2, read: Buffer.prototype.readInt16BE, write: Buffer.prototype.writeInt16BE },
    uint16be: { top: 0xFFFF, bottom: 0x0000, width: 2, read: Buffer.prototype.readUInt16BE, write: Buffer.prototype.writeUInt16BE },
    int32be: { top: 0x7FFFFFFF, bottom: -0x8FFFFFFF, width: 4, read: Buffer.prototype.readInt32BE, write: Buffer.prototype.writeInt32BE },
    uint32be: { top: 0xFFFFFFFF, bottom: 0x00000000, width: 4, read: Buffer.prototype.readUInt32BE, write: Buffer.prototype.writeUInt32BE },
    floatle: { top: 1, bottom: -1, width: 4, read: Buffer.prototype.readFloatBE, write: Buffer.prototype.writeFloatBE },
    doublele: { top: 1, bottom: -1, width: 8, read: Buffer.prototype.readDoubleBE, write: Buffer.prototype.writeDoubleBE }
}
for (const map in mapping) map.range = map.top - map.bottom;
mapping.int16 = mapping.int16le;
mapping.uint16 = mapping.uint16le;
mapping.int32 = mapping.int32le;
mapping.uint32 = mapping.uint32le;
mapping.float = mapping.floatle;
mapping.double = mapping.doublele;

class Resampler extends Transform {
    /** @type {{ type?: string, sampleRate?: number, channels?: number } & MappingSpecs} */
    from;
    /** @type {{ type?: string, sampleRate?: number, channels?: number } & MappingSpecs} */
    to;
    /** @type {[number, number][][]} */
    plugboard;

    /**
     * Re-samples an entire stream from one format to another.
     * The `plugboard` argument defines how the input channels map to the output channels, including channel mixing.
     * If not specified, then it will be automatically generated as "downscaling", much the same as in an image.
     * The length of the plugboard is the same as the output channel count, The contents of which are arrays with any number and combination of the input channels
     * @param {{ type: string, sampleRate?: number, channels?: number } & MappingSpecs} from Input shape
     * @param {{ type: string, sampleRate?: number, channels?: number } & MappingSpecs} to Output shape
     * @param {import('stream').Stream.TransformOptions & { plugboard: [number, number][][] }} args 
     */
    constructor(from, to, args) {
        super(args);
        /** @type {{ sampleRate: number } & MappingSpecs} */
        this.from = from.type ? Object.assign({}, from, mapping[from.type]) : Object.assign({}, from);
        this.from.sampleRate ??= 1;
        this.from.channels ??= 1;
        /** @type {{ sampleRate: number } & MappingSpecs} */
        this.to = to.type ? Object.assign({}, to, mapping[to.type]) : Object.assign({}, to);
        this.to.sampleRate ??= 1;
        this.to.channels ??= 1;

        this.plugboard = args?.plugboard;
        if ((!this.plugboard && this.from.channels !== this.to.channels) || (this.plugboard && this.plugboard.length !== this.to.channels)) {
            this.plugboard = new Array(this.to.channels).fill(null).map(() => []);
            for (let i = 0; i < this.from.channels; i++) {
                const outPos = this.to.channels <= 1 ? 0 : Math.floor(i / (this.to.channels -1));
                this.plugboard[outPos].push([i, 1]);
            }
        }
    }
    /** @param {Buffer} data */
    _transform(data, _, callback) {
        const samples = (data.length / this.from.width) / this.from.channels;
        let converted = data;
        let sample;
        if (this.plugboard) {
            converted = Buffer.alloc(this.from.width * this.to.channels * samples);
            sample = 0;
            while (sample < samples) {
                const inputs = new Array(this.from.channels).fill(null)
                    .map((_,i) => this.from.read.call(data, ((sample * this.from.channels) + i) * this.from.width));
                for (let i = 0; i < this.plugboard.length; i++) {
                    let total = 0, length = 0;
                    for (let j = 0; j < this.plugboard[i].length; j++) {
                        total += inputs[this.plugboard[i][j][0]] * this.plugboard[i][j][1];
                        length += this.plugboard[i][j][1];
                    }
                    this.from.write.call(converted, total / length, ((sample * this.from.channels) + i) * this.from.width);
                }
                sample++;
            }
        }
        if (this.from.type !== this.to.type || !this.to.type || !this.from.type) {
            const data = converted;
            converted = Buffer.alloc(this.to.width * this.to.channels * samples);
            sample = 0;
            while (sample < (samples * this.to.channels)) {
                const value = (this.from.read.call(data, sample * this.from.width) - this.from.bottom) / this.from.range;
                this.to.write.call(converted, (value * this.to.range) + this.to.bottom, sample * this.to.width);
                sample++;
            }
        }
        if (this.from.sampleRate !== this.to.sampleRate) {
            const resSamples = (samples / this.from.sampleRate * this.to.sampleRate);
            const data = converted;
            converted = Buffer.alloc(this.to.width * this.to.channels * resSamples);
            sample = 0;
            while (sample < resSamples) {
                for (let i = 0; i < this.to.channels; i++) {
                    const source = sample / this.from.sampleRate * this.to.sampleRate;
                    const step = source - Math.floor(source);
                    const start = this.to.read.call(data, (i + (Math.floor(source) * this.to.channels)) * this.to.width);
                    const end = this.to.read.call(data, (i + (Math.ceil(source) * this.to.channels)) * this.to.width);
                    this.to.write.call(converted, start + ((start - end) * step));
                }
                sample++;
            }
        }

        callback(null, converted);
    }
}

module.exports = Resampler;
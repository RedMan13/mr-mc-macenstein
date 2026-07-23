const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { AttachmentBuilder } = require('discord.js');

const defaultBoard = 'rnbkqbnr-pppppppp-++++++++-++++++++-++++++++-++++++++-PPPPPPPP-RNBKQBNR';
const pieces = {
    r: fs.readFileSync(path.resolve(__dirname, '../assets/chess/black-rook.svg')),
    n: fs.readFileSync(path.resolve(__dirname, '../assets/chess/black-knight.svg')),
    b: fs.readFileSync(path.resolve(__dirname, '../assets/chess/black-bishop.svg')),
    k: fs.readFileSync(path.resolve(__dirname, '../assets/chess/black-king.svg')),
    q: fs.readFileSync(path.resolve(__dirname, '../assets/chess/black-queen.svg')),
    p: fs.readFileSync(path.resolve(__dirname, '../assets/chess/black-pawn.svg')),
    a: fs.readFileSync(path.resolve(__dirname, '../assets/chess/black-pawn.svg')),

    R: fs.readFileSync(path.resolve(__dirname, '../assets/chess/white-rook.svg')),
    N: fs.readFileSync(path.resolve(__dirname, '../assets/chess/white-knight.svg')),
    B: fs.readFileSync(path.resolve(__dirname, '../assets/chess/white-bishop.svg')),
    K: fs.readFileSync(path.resolve(__dirname, '../assets/chess/white-king.svg')),
    Q: fs.readFileSync(path.resolve(__dirname, '../assets/chess/white-queen.svg')),
    P: fs.readFileSync(path.resolve(__dirname, '../assets/chess/white-pawn.svg')),
    A: fs.readFileSync(path.resolve(__dirname, '../assets/chess/white-pawn.svg'))
}

class Chess {
    static assetSize = 45;
    static pos(coord) {
        const x = 'ABCDEFGH'.indexOf(coord[0].toUpperCase());
        const y = parseInt(coord[1]) -1;

        return [x,y];
    }

    constructor(state) {
        const [board, op, author] = state.split(':');
        this.board = board.split('-').map(row => row.split(''));
        this.oponent = op;
        this.author = author;
        this.highlighted = null;
    }
    stringify() { return this.board.map(row => row.join('')).join('-') + ':' + this.oponent }
    render() {
        const raw = {
            channels: 3,
            width: Math.floor(8.5 * Chess.assetSize),
            height: Math.floor(8.5 * Chess.assetSize)
        }
        const buffer = new Uint8ClampedArray(raw.width * raw.height * raw.channels);
        for (let i = 0; i < buffer.length; i++) {
            const px = i / 3;
            const x = Math.floor((px % raw.width) / Chess.assetSize);
            const y = Math.floor((px / raw.width) / Chess.assetSize);
            if (x >= 8 || y >= 8) {
                buffer[i] = [174, 168, 106][i % 3];
                continue;
            }
            if (this.highlighted && this.pieceCanHere(this.highlighted, [x,y])) {
                buffer[i] = ((x % 2) >= 1 !== (y % 2) >= 1 ? [255, 122, 82] : [200, 122, 82])[i % 3];
                continue;
            }
            buffer[i] = ((x % 2) >= 1 !== (y % 2) >= 1 ? [238, 232, 170] : [64, 128, 64])[i % 3];
        }

        const img = sharp(buffer, { raw });
        /** @type {sharp.OverlayOptions[]} */
        const images = [
            {
                input: { text: { text: '1', dpi: 132, rgba: true } },
                left: Math.floor(8.15 * Chess.assetSize),
                top: Math.floor(.35 * Chess.assetSize),
            },
            {
                input: { text: { text: '2', dpi: 132, rgba: true } },
                left: Math.floor(8.15 * Chess.assetSize),
                top: Math.floor(1.35 * Chess.assetSize),
            },
            {
                input: { text: { text: '3', dpi: 132, rgba: true } },
                left: Math.floor(8.15 * Chess.assetSize),
                top: Math.floor(2.35 * Chess.assetSize),
            },
            {
                input: { text: { text: '4', dpi: 132, rgba: true } },
                left: Math.floor(8.15 * Chess.assetSize),
                top: Math.floor(3.35 * Chess.assetSize),
            },
            {
                input: { text: { text: '5', dpi: 132, rgba: true } },
                left: Math.floor(8.15 * Chess.assetSize),
                top: Math.floor(4.35 * Chess.assetSize),
            },
            {
                input: { text: { text: '6', dpi: 132, rgba: true } },
                left: Math.floor(8.15 * Chess.assetSize),
                top: Math.floor(5.35 * Chess.assetSize),
            },
            {
                input: { text: { text: '7', dpi: 132, rgba: true } },
                left: Math.floor(8.15 * Chess.assetSize),
                top: Math.floor(6.35 * Chess.assetSize),
            },
            {
                input: { text: { text: '8', dpi: 132, rgba: true } },
                left: Math.floor(8.15 * Chess.assetSize),
                top: Math.floor(7.35 * Chess.assetSize),
            },
            {
                input: { text: { text: 'A', dpi: 132, rgba: true } },
                left: Math.floor(.35 * Chess.assetSize),
                top: Math.floor(8.125 * Chess.assetSize),
            },
            {
                input: { text: { text: 'B', dpi: 132, rgba: true } },
                left: Math.floor(1.35 * Chess.assetSize),
                top: Math.floor(8.125 * Chess.assetSize),
            },
            {
                input: { text: { text: 'C', dpi: 132, rgba: true } },
                left: Math.floor(2.35 * Chess.assetSize),
                top: Math.floor(8.125 * Chess.assetSize),
            },
            {
                input: { text: { text: 'D', dpi: 132, rgba: true } },
                left: Math.floor(3.35 * Chess.assetSize),
                top: Math.floor(8.125 * Chess.assetSize),
            },
            {
                input: { text: { text: 'E', dpi: 132, rgba: true } },
                left: Math.floor(4.35 * Chess.assetSize),
                top: Math.floor(8.125 * Chess.assetSize),
            },
            {
                input: { text: { text: 'F', dpi: 132, rgba: true } },
                left: Math.floor(5.35 * Chess.assetSize),
                top: Math.floor(8.125 * Chess.assetSize),
            },
            {
                input: { text: { text: 'G', dpi: 132, rgba: true } },
                left: Math.floor(6.35 * Chess.assetSize),
                top: Math.floor(8.125 * Chess.assetSize),
            },
            {
                input: { text: { text: 'H', dpi: 132, rgba: true } },
                left: Math.floor(7.35 * Chess.assetSize),
                top: Math.floor(8.125 * Chess.assetSize),
            },
        ];
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const img = pieces[this.board[y][x]];
                if (!img) continue;
                images.push({
                    input: img,
                    left: Math.floor(x * Chess.assetSize),
                    top: Math.floor(y * Chess.assetSize),
                })
            }
        }
        img.composite(images);
        return img.png().toBuffer();
    }
    pieceCanHere(from, to) {
        if (from[0] === to[0] && from[1] === to[1]) return true;
        switch (this.board[from[1]][from[0]]) {
        case 'R':
        case 'r':
            if (from[0] === to[0]) return true;
            if (from[1] === to[1]) return true;
            break;
        case 'N':
        case 'n':
            if ((from[0] +2) === to[0] && (from[1] +1) === to[1]) return true;
            if ((from[0] +2) === to[0] && (from[1] -1) === to[1]) return true;
            if ((from[0] -2) === to[0] && (from[1] +1) === to[1]) return true;
            if ((from[0] -2) === to[0] && (from[1] -1) === to[1]) return true;
            if ((from[0] +1) === to[0] && (from[1] +2) === to[1]) return true;
            if ((from[0] +1) === to[0] && (from[1] -2) === to[1]) return true;
            if ((from[0] -1) === to[0] && (from[1] +2) === to[1]) return true;
            if ((from[0] -1) === to[0] && (from[1] -2) === to[1]) return true;
            break;
        case 'B':
        case 'b':
            if (Math.abs(from[0] - to[0]) === Math.abs(from[1] - to[1])) return true; 
            break;
        case 'Q':
        case 'q':
            if (from[0] === to[0]) return true;
            if (from[1] === to[1]) return true;
            if (Math.abs(from[0] - to[0]) === Math.abs(from[1] - to[1])) return true; 
            break;
        case 'K':
        case 'k':
            if (Math.abs(from[0] - to[0]) <= 1 && Math.abs(from[1] - to[1]) <= 1) return true;
            break;
        case 'P':
            if (from[0] !== to[0]) break;
            if ((from[1] -1) === to[1]) return true;
            if ((from[1] -2) === to[1]) return true;
            break;
        case 'p':
            if (from[0] !== to[0]) break;
            if ((from[1] +1) === to[1]) return true;
            if ((from[1] +2) === to[1]) return true;
            break;
        case 'A':
            if (from[0] !== to[0]) break;
            if ((from[1] -1) === to[1]) return true;
        case 'a':
            if (from[0] !== to[0]) break;
            if ((from[1] +1) === to[1]) return true;
            break;
        }
        return false;
    }
    setMoving(piece) { this.highlighted = Chess.pos(piece); }
    move(from, to) {
        const fromPos = Chess.pos(from);
        const toPos = Chess.pos(to);
        if (!this.pieceCanHere(fromPos, toPos)) return this.setMoving(from);
        let piece = this.board[fromPos[1]][fromPos[0]];
        if (piece === 'p') piece = 'a';
        if (piece === 'P') piece = 'A';
        this.board[toPos[1]][toPos[0]] = piece;
        this.board[fromPos[1]][fromPos[0]] = '+';
    }
}

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'chess',
    category: 'dumb fun',
    sDesc: 'Plays chess.',
    lDesc: 'Starts a game of chess.',
    work: 1,
    args: [
        {
            name: 'against',
            desc: 'When starting: Who (user) to play chess with. When replying to a game: which piece to move',
            type: 'any',
            required: false
        },
        {
            name: 'move',
            desc: 'Where to move a piece to.',
            type: 'any',
            required: false
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (message.reference?.messageId) {
            /** @type {import('discord.js').Message} */
            const msg = await message.channel.messages.fetch(message.reference.messageId);
            const state = msg.attachments.at(0).description;
            const board = new Chess(state);
            if (!message.arguments.move)
                board.setMoving(message.arguments.against);
            else
                board.move(message.arguments.against, message.arguments.move);
            msg.edit({ files: [new AttachmentBuilder(await board.render(), { name: 'board.png', description: board.stringify() })] });
            return;
        }
        const op = message.mentions.members.at(0) || message.arguments.against || 'ai';
        const board = new Chess(defaultBoard + ':' + op + ':' + message.author.id);
        message.reply({ files: [new AttachmentBuilder(await board.render(), { name: 'board.png', description: board.stringify() })] });
    },
};

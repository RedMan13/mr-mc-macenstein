const { SectionBuilder, ButtonBuilder, Message, MessageFlags } = require('discord.js');

const defaultBoard = 'rnbkqbnr-pppppppp-++++++++-++++++++-++++++++-++++++++-PPPPPPPP-RNBKQBNR';

function parseBoard(state) { return state.split('-').map(row => row.split('')) }
function stringifyBoard(board) { return board.map(row => row.join('')).join('-') }

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'chess',
    category: 'dumb fun',
    sDesc: 'Plays chess.',
    lDesc: 'Starts a game of chess.',
    work: 1,
    args: [],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message, state = defaultBoard) => {
        let board = parseBoard(state);
        if (message instanceof Message) {
            message.reply({
                // flags: MessageFlags.IsComponentsV2,
                components: [
                    new SectionBuilder({
                        components: [
                            new ButtonBuilder({ disabled: true, emoji: '☑️' }),
                            new ButtonBuilder({ disabled: true, emoji: '☑️' }),
                            new ButtonBuilder({ disabled: true, emoji: '☑️' }),
                            new ButtonBuilder({ disabled: true, emoji: '☑️' }),
                            new ButtonBuilder({ disabled: true, emoji: '☑️' }),
                            new ButtonBuilder({ disabled: true, emoji: '☑️' }),
                            new ButtonBuilder({ disabled: true, emoji: '☑️' }),
                            new ButtonBuilder({ disabled: true, emoji: '☑️' }),
                            new ButtonBuilder({ disabled: true, emoji: '☑️' })
                        ]
                    })
                ]
            });
            return;
        }
    },
};

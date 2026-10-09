const { Tokenizer } = require('builder');

function lexEquation(text) {
    const tok = new Tokenizer(text, {
        variable: /[a-z_$][a-z_$0-9]*/gsi,
        number: /[0-9]+(?:\.[0-9]+)?/gsi,
        subtract: /-/,
        add: /\+/,
        divide: /\//,
        multiply: /\*/,
        modulo: /%/,
        power: /\^/,
        openParen: /\(/,
        closeParen: /\)/,
    });
}

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'calculate',
    aliases: ['calc'],
    category: 'general',
    sDesc: 'Runs some calculations!',
    lDesc: 'Acts as a calculator on any input text, can provide a ui for writing calculations aswell.',
    work: 'any',
    args: {
        execute: [['default', 'e'], {}, 'The equation to execute.'],
        gui: [['g'], { noValue: true, default: false }, 'If an entire gui should be given for the calculator.'],
        scientific: [['s', 'a'], { noValue: true, default: false, needs: ['gui'] }, 'If the calculator gui should provide nearly all possible syntax.']
    },
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        message.reply({
            flags: 'IsComponentsV2',
            components: [
                <container>
                    <text>
                        ```
                        {message.arguments.execute}
                        ```
                    </text>
                </container>
            ]
        })
    },
};

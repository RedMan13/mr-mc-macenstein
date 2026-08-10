const fs = require('fs');
const path = require('path');
const Markov = require('../statics/markovinator.js');
const markov = new Markov(null, '\n');
const text = fs.readFileSync(path.resolve(__dirname, '../assets/gsa.txt'), 'utf8');
// chunks are divided by one of
// a space
// a new line (without removing the newline)
// a none-spoken character followed by a spoken character (without removing either)
// a spoken character followed by a none-spoken character (without removing either)
markov.feed(text, /(?<=\n)|(?<=[a-z0-9])(?=[^a-z0-9])|(?<=[^a-z0-9 ])(?=[a-z0-9])/gi);

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'gas',
    category: 'dumb fun',
    sDesc: 'Markov chain of myself!',
    lDesc: 'Uses the messages i have sent to create new messages that i have never sent.',
    work: 1,
    args: [
        {
            type: 'any',
            name: 'word',
            required: false,
            desc: 'Sets what word the generator should start with.'
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        message.reply({
            content: markov.generate(message.arguments.word, '').slice(0, 2000),
            allowedMentions: {
                parse: [],
                roles: [],
                users: [],
                repliedUser: true
            }
        })
    },
};

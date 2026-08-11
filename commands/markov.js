const fs = require('fs');
const path = require('path');
const Markov = require('../statics/markovinator.js');
const markov = new Markov(null, '\n');
// chunks are divided by one of
// a new line (without removing the newline)
// a none-spoken character followed by a spoken character (without removing either)
// a spoken character (including space) followed by a none-spoken character (without removing either)
markov.feed(dbs.trainingData, /(?<=\n)|(?<=[a-z0-9])(?=[^a-z0-9])|(?<=[^a-z0-9 ])(?=[a-z0-9])/gi);
dbs.onNewData['markov'] = data => markov.feed(data);

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'markov',
    category: 'dumb fun',
    sDesc: 'Jeremies markov but technically better.',
    lDesc: 'Uses the messages in <#1490146686776119497> to generate nonsense.',
    work: 'any',
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
            content: markov.generate(message.arguments.word, 10, '').slice(0, 2000),
            allowedMentions: {
                parse: [],
                roles: [],
                users: [],
                repliedUser: true
            }
        })
    },
};

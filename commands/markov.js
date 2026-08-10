const fs = require('fs');
const path = require('path');
const Markov = require('../statics/markovinator.js');
const markov = new Markov(null, '\n');
markov.feed(dbs.trainingData, / |(?<=\n)/g);

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'markov',
    category: 'dumb fun',
    sDesc: 'Jeremies markov but objectively worse.',
    lDesc: 'Uses the messages in <#1490146686776119497> to generate nonsense.',
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
            content: markov.generate(message.arguments.word, ' '),
            allowedMentions: {
                parse: [],
                roles: [],
                users: [],
                repliedUser: true
            }
        })
    },
};

const fs = require('fs');
const path = require('path');
const Markov = require('../statics/markovinator.js');
const text = fs.readFileSync(path.resolve(__dirname, '../assets/samples.txt'), 'utf8');
const markov = new Markov(null, '\n');
markov.feed(dbs.trainingData, '');
dbs.onNewData['ipsum'] = data => markov.feed(data);

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'ipsum',
    category: 'dumb fun',
    sDesc: 'Creates a laurum-ipsum kindof text.',
    lDesc: 'Uses the messages in <#1490146686776119497> to generate nonsense placeholder text.',
    work: 'any',
    args: [
        {
            type: 'any',
            name: 'char',
            required: false,
            desc: 'Sets what character the generator should start with.'
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        message.reply({
            content: markov.generate(message.arguments.char, 0).slice(0, 2000),
            allowedMentions: {
                parse: [],
                roles: [],
                users: [],
                repliedUser: true
            }
        })
    },
};

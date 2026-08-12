const fs = require('fs');
const path = require('path');
const Markov = require('../statics/markovinator.js');
const { EmbedBuilder } = require('discord.js');
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
            desc: 'Sets what word the generator should start with. Setting to `has-said` will pull up statistics info for the following word, if it has been said.'
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (message.arguments.word === 'has-said') {
            let word = message.args.split(' ').at(-1).toLowerCase();
            if (!markov.chances[word]) word = markov.chars.find(a => a[0].endsWith(word))?.[0];
            if (!markov.chances[word]) return message.reply('Never said that!');
            const data = markov.chances[word];
            const chances = Object.entries(data.chars)
                .sort((a,b) => b[1] - a[1])
                .map(a => [a[0], (a[1] / data.total) * 100])
                .map(a => `${a[0].replace('\n', '{end}')} (${a[1].toFixed(1)}%)`)
                .map(v => v.replaceAll('-', '\\-').replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('*', '\\*'))
                .join('') 
                .slice(0, 1024);
            const uses = markov.chars.find(v => v[0] === word)[1];
            message.reply({
                embeds: [new EmbedBuilder()
                    .setTitle(word)
                    .setDescription(`This word has been used a total of ${uses} times!`)
                    .addFields([
                        { name: 'Followed by', value: chances }
                    ])]
            })
            return;
        }
        message.reply({
            content: markov.generate(message.arguments.word, 3, '').slice(0, 2000),
            allowedMentions: {
                parse: [],
                roles: [],
                users: [],
                repliedUser: true
            }
        })
    },
};

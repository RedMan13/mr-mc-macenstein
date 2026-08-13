const fs = require('fs');
const path = require('path');
const Markov = require('../statics/markovinator.js');
const { EmbedBuilder } = require('discord.js');
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
            desc: 'Sets what char the generator should start with. Setting to `has-said` will pull up statistics info for the following char, if it has been said.'
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (message.arguments.char === 'has-said') {
            let word = markov.findWord(message.args.split(' ').at(-1));
            if (!markov.chances[word]) word = markov.chars.find(a => a[0].endsWith(word));
            if (!markov.chances[word] || !word) return message.reply('Never said that!');
            const data = markov.chances[word];
            const chances = Object.entries(data.chars)
                .sort((a,b) => b[1] - a[1])
                .map(a => [a[0], (a[1] / data.total) * 100])
                .map(a => `${a[0].replace('\n', '{end}')} (${a[1].toFixed(1)}%)`)
                .map(v => v.replaceAll('-', '\\-').replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('*', '\\*'))
                .join('') 
                .slice(0, 1024);
            const uses = markov.chars[word];
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

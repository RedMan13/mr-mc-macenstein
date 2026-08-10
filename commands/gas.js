const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
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
            desc: 'Sets what word the generator should start with. Setting to `has-said` will pull up statistics info for the following word, if it has been said.'
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (message.arguments.word === 'has-said') {
            const word = message.args.split(' ').at(-1).toLowerCase();
            if (!markov.chances[word]) return message.reply('Never said that!');
            const data = markov.chances[word];
            const chances = data.chars
                .map((v,i,a) => a[i -1] ? [v[0], v[1] - a[i -1][1]] : v)
                .sort((a,b) => b[1] - a[1])
                .map(a => [a[0], (a[1] / data.total) * 100])
                .filter(a => a[1] >= 0.1)
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

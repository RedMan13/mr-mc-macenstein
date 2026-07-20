const fs = require('fs');
const path = require('path');
const data = fs.readFileSync(path.resolve(__dirname, '../assets/samples.txt'), 'utf8').split('');

const chances = {}; 
const pureChances = {};

data.forEach((char, i) => {
    char = char.toLowerCase();
    chances[char] ??= { chars: {}, total: 0 };
    pureChances[char] ??= 0;
    pureChances[char]++;
    if (data[i +1]) {
        const next = data[i +1].toLowerCase();
        chances[char].chars[next] ??= 0;
        chances[char].chars[next]++;
        chances[char].total++;
    }
});

for (const source in chances) {
    let acc = 0;
    for (const char in chances[source].chars) {
        acc += chances[source].chars[char];
        chances[source].chars[char] = acc;
    }
    chances[source].chars = Object.entries(chances[source].chars);
}

let total = 0;
for (const char in pureChances) {
    total += pureChances[char];
    pureChances[char] = total;
}
const chars = Object.entries(pureChances);

function findNext(char) {
    const pick = (Math.random() * (chances[char].total +1));
    return chances[char].chars.find(v => pick <= v[1])[0];
}

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'ipsum',
    category: 'dumb fun',
    sDesc: 'Creates a laurum-ipsum kindof text.',
    lDesc: 'Uses the messages in <#1490146686776119497> to generate nonsense placeholder text.',
    work: 1,
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
        let char = message.arguments.char || chars.find(v => Math.floor(Math.random() * total) <= v[1])[0];
        let acc = char;
        while (char !== '\n') {
            char = findNext(char);
            acc += char;
        }

        message.reply({
            content: acc,
            allowedMentions: {
                parse: [],
                roles: [],
                users: [],
                repliedUser: true
            }
        })
    },
};

console.log('starting...')

require('./statics/uptimer');
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenAI } = require("@google/genai");
const { exec } = require("child_process");
const fs = require('fs');
const path = require('path');
require('dotenv').config();
let process = require('process');
const config = require('./statics/config.json');
const syncSlash = require('@frostzzone/discord-sync-commands');
const { createQuoteCard, createQuoteMessage } = require('./statics/quote-generator.js');

process.on('uncaughtException', err => console.warn(err));

globalThis.imports = {
    exec,
    process,
    createQuoteCard,
    createQuoteMessage,
    Discord: require('discord.js'),
    db: require('./statics/database-manager.js'),
    locateCategory(name, fields) {
        for (let field = 0; field < fields.length; field++) {
            if (fields[field].name == name) {
                return field
            }
        }
    },
    getAllArgs: require('./statics/arguments-parser'),
    client: new Client({ 
        intents: [
            GatewayIntentBits.Guilds, 
            GatewayIntentBits.MessageContent, 
            GatewayIntentBits.GuildMessages
        ] 
    }),
    ai: new GoogleGenAI({})
}

globalThis.dbs = { // databases
    config: config,
    /** @type {{ [key: string]: import('discord.js').Channel }} */
    channels: {},
    database: imports.db,
    commands: {},
    commandConfig: config.commands
}

let slashCommands = []

console.log('\n')
fs.readdir('./commands', async (err, files) => { // read commands folder into a list of commands
    console.log(err ? err : 'reading commands with no error')
    files.forEach(async file => {
        let command = require('./commands/' + file)
        if (command.slashCmd) {
            console.log(`pushed ${command.comData.name} to slash command sync list`)
            slashCommands.push(command.comData)
            dbs.commands[command.comData.name] = {
                description: command.comData.description,
                command,
                isSlash: command.slashCmd
            }
            return
        }
        console.log(`loading command ${command.name}`)
        dbs.commands[command.name] = {
            description: command.sDesc,
            category: command.category,
            command
        }
    });
});
console.log('\n')
syncSlash(imports.client, slashCommands, { debug: true })
console.log('\n')

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) { // add events via files
    console.log(`applying event ${file}`)
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        imports.client.once(event.name, async (...args) => event.execute(...args))
    } else {
        imports.client.on(event.name, async (...args) => event.execute(...args))
    }
}

/* login */
imports.client.login(process.env.token);

globalThis.stop = () => {
    imports.client.destroy();
    imports.exec('kill 1');
}

console.log('starting...')

// require('./statics/uptimer');
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenAI } = require("@google/genai");
const { exec } = require("child_process");
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const process = require('process');
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
const commandsPath = path.resolve(__dirname, 'commands');
fs.readdir(commandsPath, async (err, files) => { // read commands folder into a list of commands
    console.log(err ? err : 'reading commands with no error')
    files.forEach(async file => {
        const filePath = path.resolve(commandsPath, file);
        const command = require(filePath)
        if (command.slashCmd) {
            console.log(`pushed ${command.comData.name} to slash command sync list`)
            slashCommands.push(command.comData)
            dbs.commands[command.comData.name] = {
                description: command.comData.description,
                command,
                isSlash: command.slashCmd,
                file: filePath
            }
            return
        }
        console.log(`loading command ${command.name}`)
        dbs.commands[command.name] = {
            description: command.sDesc,
            category: command.category,
            command,
            file: filePath
        }
    });
});
fs.watch('./commands', (type, filename) => {
    const file = path.resolve('./commands', filename);
    const exists = fs.existsSync(file);
    for (const commandName in dbs.commands) {
        const command = dbs.commands[commandName];
        if (command.file !== file) continue;
        delete dbs.commands[commandName];
        if (!exists) return; // if the file nolonger exists then this is it
        const newCommand = require(file);
        if (newCommand.slashCmd) {
            console.log(`pushed ${newCommand.comData.name} to slash command sync list`)
            slashCommands.push(newCommand.comData)
            dbs.commands[newCommand.comData.name] = {
                description: newCommand.comData.description,
                command: newCommand,
                isSlash: newCommand.slashCmd,
                file
            }
            // manually re-sync if a slash command gets updated
            syncSlash(imports.client, slashCommands, { debug: true });
            return;
        }
        console.log(`loading command ${newCommand.name}`)
        dbs.commands[newCommand.name] = {
            description: newCommand.sDesc,
            category: newCommand.category,
            command: newCommand,
            file
        }
        return; // no reason to keep running the loop now
    }
    // fell through due to being a new file
    if (exists && type === 'rename') {
        const command = require(file)
        if (command.slashCmd) {
            console.log(`pushed ${command.comData.name} to slash command sync list`)
            slashCommands.push(command.comData)
            dbs.commands[command.comData.name] = {
                description: command.comData.description,
                command,
                isSlash: command.slashCmd,
                file: filePath
            }
            return
        }
        console.log(`loading command ${command.name}`)
        dbs.commands[command.name] = {
            description: command.sDesc,
            category: command.category,
            command,
            file: filePath
        }
    }
});
console.log('\n')
syncSlash(imports.client, slashCommands, { debug: true })
console.log('\n')

const eventsPath = path.resolve(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) { // add events via files
    console.log(`applying event ${file}`)
    const filePath = path.resolve(eventsPath, file);
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

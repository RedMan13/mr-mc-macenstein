console.log('starting...')

// require('./statics/uptimer');
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenAI } = require("@google/genai");
const { exec, spawn } = require("child_process");
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const process = require('process');
const config = require('./statics/config.json');
const syncSlash = require('@frostzzone/discord-sync-commands');
const { createQuoteCard, createQuoteMessage } = require('./statics/quote-generator.js');
const util = require('util');

process.on('exit', () => {
    dbs.channels.console.send('Bot turned off...');
});

globalThis.imports = {
    exec,
    process,
    createQuoteCard,
    createQuoteMessage,
    Discord: require('discord.js'),
    db: require('./statics/database-manager.js'),
    getAllArgs: require('./statics/arguments-parser'),
    parseArgs: require('./statics/argument-parser.js'),
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
    commandConfig: config.commands,
    startedAt: Date.now()
}

let slashCommands = []

/**
 * @typedef {Object} CommandDefinition
 * @prop {boolean} slashCmd
 * @prop {Object?} comData
 * @prop {string?} name
 * @prop {string?} category
 * @prop {string?} sDesc
 * @prop {string?} lDesc
 * @prop {import('./statics/argument-parser.js').CLIArguments|import('./statics/arguments-parser.js').Argument[]|null} args
 * @prop {(message: import('discord.js').Message) => void} execute
 */

function loadCommand(file) {
    try {
        /** @type {CommandDefinition} */
        const command = require(file);
        delete require.cache[file]; // do not let commands get cached! they could change at any moment
        if (command.slashCmd) {
            console.log(`pushed ${command.comData.name} to slash command sync list`);
            slashCommands.push(command.comData);
            dbs.commands[command.comData.name] = {
                description: command.comData.description,
                command,
                isSlash: command.slashCmd,
                file
            }
            return command.name;
        }
        console.log(`loading command ${command.name}`);
        dbs.commands[command.name] = {
            description: command.sDesc,
            category: command.category,
            command,
            useCLI: !Array.isArray(command.args),
            file
        }
        return command.name;
    } catch (err) {
        console.warn(err.message);
        return null
    }
}
console.log('\n')
const commandsPath = path.resolve(__dirname, 'commands');
fs.readdir(commandsPath, async (err, files) => { // read commands folder into a list of commands
    console.log(err ? err : 'reading commands with no error')
    files.forEach(async file => {
        const filePath = path.resolve(commandsPath, file);
        loadCommand(filePath);
    });
});
fs.watch(commandsPath, (type, filename) => {
    const file = path.resolve(commandsPath, filename);
    const exists = fs.existsSync(file);
    for (const commandName in dbs.commands) {
        const command = dbs.commands[commandName];
        if (command.file !== file) continue;
        delete dbs.commands[commandName];
        if (!exists) return dbs.channels.console.send(`Command ${commandName} has been deleted`); // if the file nolonger exists then this is it
        loadCommand(file);
        dbs.channels.console.send(`Command ${commandName} has been reloaded`);
        return; // no reason to keep running the loop now
    }
    // fell through due to being a new file
    if (exists && type === 'rename') {
        const name = loadCommand(file);
        if (!name) return;
        dbs.channels.console.send(`Command ${name} has been loaded`);
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
    process.exit();
}

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
const electron = require('electron');
const util = require('util');

const logs = fs.createWriteStream(path.resolve(__dirname, './errors.log'));
for (const func of ['log', 'warn', 'error', 'debug', 'info']) {
    const old = console[func];
    console[func] = function(...args) {
        old(...args);
        const text = util.format(...args);
        logs.write(text + '\n');
    }
}
process.on('beforeExit', () => logs.close());

process.on('uncaughtException', err => console.warn(err));
const child = spawn(electron, [require.resolve('./electron/index.js')], { stdio: 'inherit', windowsHide: false });
process.on('SIGINT', () => { child.kill(); process.exit(); });
process.on('SIGTERM', () => { child.kill(); process.exit(); });
process.on('SIGUSR2', () => { child.kill(); process.exit(); });

globalThis.imports = {
    exec,
    process,
    createQuoteCard,
    createQuoteMessage,
    Discord: require('discord.js'),
    db: require('./statics/database-manager.js'),
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

function loadCommand(file) {
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
        return;
    }
    console.log(`loading command ${command.name}`);
    dbs.commands[command.name] = {
        description: command.sDesc,
        category: command.category,
        command,
        file
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
        if (!exists) return; // if the file nolonger exists then this is it
        loadCommand(file);
        return; // no reason to keep running the loop now
    }
    // fell through due to being a new file
    if (exists && type === 'rename') loadCommand(file);
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
    child.kill();
}

console.log('starting...')  

// require('./statics/uptimer');
const { loadImage } = require('./statics/canvas');
const sharp = require('sharp');
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenAI } = require("@google/genai");
const { exec } = require("child_process");
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const process = require('process');
const config = require('./statics/config.json');
const embedBuilder = require('./statics/discord-embeds.js');
const getBatteryInfo = require('./statics/analyze-battery.js');

process.send ??= () => {};

const jsHandle = require.extensions['.js'];
require.extensions['.js'] = (module, filename) => {
    if (!filename.includes('commands') && !filename.includes('events')) return jsHandle(module, filename);
    const text = embedBuilder(fs.readFileSync(filename, 'utf8'));
    try {
        module._compile(text, filename);
    } catch (err) {
        console.error(err);
        throw err;
    }
}

process.on('uncaughtException', err => {
    if (err.code === 'ENOTFOUND') throw err;
    console.warn(err)
});

if (fs.existsSync(path.resolve(__dirname, './node_modules/dbus/build')))
   process.send({ spawn: path.resolve(__dirname, './media-status.js'), name: 'media-status-manager', options: { restarts: true } });

globalThis.imports = {
    exec,
    process,
    Discord: require('discord.js'),
    db: require('./statics/database-manager.js'),
    getAllArgs: require('./statics/arguments-parser'),
    parseArgs: require('./statics/argument-parser.js'),
    /**
     * @param {import('discord.js').TextBasedChannel} channel 
     * @param {(message: import('discord.js').Message) => boolean} stop 
     */
    async scrapeChannel(channel, stop = () => {}) {
        const res = [];
        let messages;
        let count = 0;
        let start = Date.now();
        while (!messages || messages.size >= 100) {
            const since = Date.now() - start;
            // fifty thousand messages is probably plenty, especially since by here we are going to overuse our stay
            // but, if discord will let us, we may aswell keep going just in case
            if (count >= 50 && since < 1000) break;
            if (since >= 1000) start = Date.now();

            const args = { limit: 100 };
            if (messages && messages.size > 0)
                args.before = res.at(-1).id;

            messages = (await channel.messages.fetch(args));
            res.push(...messages.values());
            if (messages.some(stop)) break;

            count++;
        }
        
        return res;
    },
    /**
     * @param {import('discord.js').Message} message 
     * @returns {Promise<Buffer[]>}
     */
    async fetchTargetImages(message, limit) {
        if (message.reference?.messageId)
            message = await message.channel.messages.fetch(message.reference.messageId);

        const links = [];
        if (message.attachments?.size > 0) 
            links.push(...message.attachments.map(attachment => attachment.proxyURL));
        if (links.length <= 0)
            links.push(
                message.member?.avatarURL?.() ??
                message.author.avatarURL() ??
                `https://cdn.discordapp.com/embed/avatars/${+message.author.id % 6}.png`
            );

        if (typeof limit === 'number') // remove everything at and after length
            links.splice(limit, links.length);

        return Promise.all(links.map(url => fetch(url)
            .then(async req => ({
                contentType: req.headers.get('content-type'),
                data: Buffer.from(await req.bytes())
            }))));
    },
    /**
     * @param {import('discord.js').Message} message 
     * @param {number} [limit=1] 
     * @returns {Promise<import('./statics/canvas').Image[]|import('./statics/canvas').Image>}
     */
    async loadTargetImages(message, limit = 1) {
        const images = (await this.fetchTargetImages(message, limit))
            .map(async asset => {
                let image = asset.data;
                if (['image/webp', 'image/gif', 'image/avif'].includes(asset.contentType))
                    image = sharp(asset.data);
                
                return loadImage(image);
            });

        if (limit <= 1) return images[0];
        return Promise.all(images);
    },
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
    startedAt: Date.now(),
    major: false,
    lost: true,
    needsAppended: [],
    trainingData: fs.readFileSync(path.resolve(__dirname, './assets/samples.txt'), 'utf8'),
    onNewData: {},
    commandFailures: {}
}

/**
 * @typedef {Object} CommandDefinition
 * @prop {boolean} slashCmd
 * @prop {import('discord.js').ApplicationCommandDataResolvable?} comData
 * @prop {string?} name
 * @prop {string?} category
 * @prop {string?} sDesc
 * @prop {string?} lDesc
 * @prop {import('./statics/argument-parser.js').CLIArguments|import('./statics/arguments-parser.js').Argument[]|null} args
 * @prop {(message: import('discord.js').Message) => void} execute
 */

function loadCommand(file, enabled = false) {
    try {
        console.log(`loading command ${path.basename(file)}`);
        /** @type {CommandDefinition} */
        const command = require(file);
        delete require.cache[file]; // do not let commands get cached! they could change at any moment
        if (command.slashCmd) {
            dbs.commands[command.comData.name] = {
                description: command.comData.description,
                command,
                work: command.work === 'all' ? 'any' : command.work,
                enabled,
                isSlash: true,
                file
            }
            return command.name;
        }
        dbs.commands[command.name] = {
            description: command.sDesc,
            category: command.category,
            command,
            enabled,
            work: command.work,
            useCLI: !Array.isArray(command.args),
            file
        }
        if (Array.isArray(command.aliases))
            command.aliases.forEach(name => dbs.commands[name] = { aliasFor: command.name })
        return command.name;
    } catch (err) {
        dbs.commandFailures[path.relative(__dirname, file)] = err.message.split('\n')[0];
        return null
    }
}
console.log('\n')
const commandsPath = path.resolve(__dirname, 'commands');
fs.readdir(commandsPath, { recursive: true, withFileTypes: true }, async (err, files) => { // read commands folder into a list of commands
    console.log(err ? err : 'reading commands')
    files.forEach(async file => {
        if (!file.isFile()) return;
        const filePath = path.resolve(commandsPath, file.parentPath, file.name);
        loadCommand(filePath);
    });
});
fs.watch(commandsPath, { recursive: true }, (type, filename) => {
    const file = path.resolve(commandsPath, filename);
    const exists = fs.existsSync(file);
    for (const commandName in dbs.commands) {
        const command = dbs.commands[commandName];
        if (command.file !== file) continue;
        const enabled = dbs.commands[commandName].enabled;
        delete dbs.commands[commandName];
        if (!exists) return dbs.channels.console.send(`Command ${commandName} has been deleted`); // if the file nolonger exists then this is it
        loadCommand(file, enabled);
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

const eventsPath = path.resolve(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) { // add events via files
    console.log(`applying event ${file}`)
    const filePath = path.resolve(eventsPath, file);
    const event = require(filePath);
    const onRun = event.global 
        ? async (...args) => event.execute(...args)
        : async (...args) => {
            if (!dbs.major) return;
            event.execute(...args);
        }
    if (event.name === 'connected') {
        dbs.needsAppended.push([event, onRun]);
        continue;
    }
    if (event.once) {
        imports.client.once(event.name, onRun)
    } else {
        imports.client.on(event.name, onRun)
    }
}

/* login */
imports.client.login(process.env.token);

let batteryWarnings = 0;
let wasPluggedIn = false;
async function checkBattery() {
    if (!dbs.channelsLoaded) return setImmediate(checkBattery);
    const info = await getBatteryInfo();
    if (!info.hasBattery) return;

    if (info.charging && info.isDying)
        dbs.channels.console.send(`<@${dbs.config.users.owner}> Battery isnt charging on ${dbs.alias}!! dying <t:${info.diesAt}:R>`);
    else if (info.charging && !wasPluggedIn)
        dbs.channels.console.send(`<@${dbs.config.users.owner}> Plugged in ${dbs.alias}, charged <t:${info.diesAt}:R>`);
    wasPluggedIn = info.charging;

    if (info.charging && batteryWarnings >= 0) batteryWarnings = -1;
    if (!info.charging && batteryWarnings <= 0) batteryWarnings = 0;

    if (info.percentage >= 100 && batteryWarnings === -1) {
        dbs.channels.console.send(`<@${dbs.config.users.owner}> ${dbs.alias} has finished charging!`);
        batteryWarnings--;
    }
    if (info.percentage < 30 && batteryWarnings === 0) {
        dbs.channels.console.send(`<@${dbs.config.users.owner}> Plug in ${dbs.alias} please, dying <t:${info.diesAt}:R>`);
        batteryWarnings++;
    }
    if (info.percentage < 20 && batteryWarnings === 1) {
        dbs.channels.console.send(`<@${dbs.config.users.owner}> Plug in ${dbs.alias} right now, dying <t:${info.diesAt}:R>`);
        batteryWarnings++;
    }
    if (info.percentage < 10 && batteryWarnings === 2) {
        dbs.channels.console.send(`<@${dbs.config.users.owner}> Plug me the FUCK in you utter BAFOON. ${dbs.alias} dying <t:${info.diesAt}:R>`);
        batteryWarnings++;
    }

    setTimeout(checkBattery, 500);
}; checkBattery();

globalThis.stop = async () => {
    console.log('Forcing shut down...')
    await dbs.database.forceSave();
    imports.client.destroy();
    process.exit();
}

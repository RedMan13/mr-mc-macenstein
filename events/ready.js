const util = require('util');
const rate = require('../statics/self-rating');
const { v7: uuid } = require('uuid');
const path = require('path');
const MIDI = require('midi-file');
const textSamples = path.resolve(__dirname, '../assets/samples.txt');
const midiSamples = path.resolve(__dirname, '../assets/midis.txt');
const fs = require('fs/promises');

module.exports = {
    name: 'clientReady',
    once: true,
    global: true,
    /**
     * @param {import("discord.js").Client} client 
     */
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        dbs.id = uuid();
        dbs.alias = process.arch !== 'x64' ? 'phone' : 'pc';
        dbs.channels = Object.fromEntries(await Promise.all(Object.entries(dbs.config.channels)
            .map(async ([name, id]) => [name, await client.channels.fetch(id).catch(console.warn)])));
        dbs.channelsLoaded = true;
        dbs.channels.console.send(`Ready! Logged in as ${client.user.tag}`);
        for (const name of ['log', 'warn', 'error', 'debug', 'info']) {
            const item = console[name];
            console[name] = function(...args) {
                const str = util.format(...args);
                // dbs.channels.console.send(`\`\`\`${str}\`\`\``).catch(() => {});
                item.call(this, ...args);
            };
        }

        // not used for now, cant fgure out why its blocking mouse inputs
        // try {
        //     const electron = require('electron');
        //     process.send({
        //         spawn: electron, args: [require.resolve('../electron/index.js')],
        //         options: { windowsHide: false },
        //         name: 'overlay-manager'
        //     });
        // } catch (err) { console.warn(err.message) }

        const global = dbs.database.global();
        await global.loaded;
        if (global.get('restarted')) {
            if (global.has('restartChannel')) {
                /** @type {import('discord.js').TextChannel} */
                const channel = await client.channels.fetch(global.get('restartChannel'));
                channel?.send?.({
                    content: 'Bot restarted!',
                    reply: { messageReference: global.get('restartMessage') }
                });
                global.delete('restartChannel');
                global.delete('restartMessage');
            }
            global.set('restarted', false);
        }


        const shard = client.ws.shards.at(0);
        for (const [event, onRun] of dbs.needsAppended) {
            if (event.name !== 'connected') continue;
            onRun(); // oh look! this *is* that very ready event that would be listened for
            if (!event.once)
                shard.on('resumed', onRun);
        }
        dbs.needsAppended = [];


        fs.stat(textSamples)
            .catch(async () => {
                const messages = (await imports.scrapeChannel(dbs.channels.textFeed))
                    .map(message => message.cleanContent)
                    .join('\n');
                fs.writeFile(textSamples, messages);
            })
        fs.stat(midiSamples)
            .catch(async () => {
                const promises = (await imports.scrapeChannel(dbs.channels.midiFeed))
                    .filter(message => message.attachments.size > 0)
                    .flatMap(message => message.attachments.toJSON())
                    .filter(file => file.contentType === 'audio/sp-midi')
                    .map(file => fetch(file.url).then(req => req.bytes()).catch(() => {}));
                const samples = (await Promise.all(promises))
                    .filter(data => data.length)
                    .map(data => MIDI.parseMidi(data))
                    .map(midi => JSON.stringify(midi))
                    .join('\n') + '\n';
                
                fs.writeFile(midiSamples, samples);
            })
    },
};
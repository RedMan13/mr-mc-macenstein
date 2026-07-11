const util = require('util');
const rate = require('../statics/self-rating');
const { v7: uuid } = require('uuid');

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

        try {
            const electron = require('electron');
            process.send({
                spawn: electron, args: [require.resolve('../electron/index.js')],
                options: { windowsHide: false },
                name: 'overlay-manager'
            });
        } catch (err) { console.warn(err.message) }

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

        const rating = rate(client.readyTimestamp);
        dbs.channels.watchDog.send(`mc;rate ${JSON.stringify({ id: dbs.id, rating })}`);
    },
};
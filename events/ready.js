const util = require('util');

module.exports = {
    name: 'clientReady',
    once: true,
    /**
     * @param {import("discord.js").Client} client 
     */
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        dbs.channels = Object.fromEntries(await Promise.all(Object.entries(dbs.config.channels)
            .map(async ([name, id]) => [name, await client.channels.fetch(id).catch(console.warn)])));
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
            process.on('uncaughtException', err => console.warn(err));
            const child = spawn(electron, [require.resolve('./electron/index.js')], { stdio: 'inherit', windowsHide: false });
            process.on('SIGINT', () => { child.kill(); process.exit(); });
            process.on('SIGTERM', () => { child.kill(); process.exit(); });
            process.on('SIGUSR2', () => { child.kill(); process.exit(); });
        } catch (err) { console.warn(err.message) }
    },
};
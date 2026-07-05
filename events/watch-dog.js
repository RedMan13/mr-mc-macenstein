const rate = require('../statics/self-rating');

const rated = [];
let handleRated = null;
let time = null;
let lost = false;
module.exports = {
    name: 'messageCreate',
    once: false,
    global: false,
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (message.channelId !== dbs.config.channels.watchDog) return;
        if (message.author.id === imports.client.user.id) {
            const jsonStart = message.content.indexOf('{');
            const jsonEnd = message.content.lastIndexOf('}');
            if (jsonStart <= -1) return;
            const meta = JSON.parse(message.content.slice(jsonStart, jsonEnd +1));
            if (!rated.some(v => v.id === meta.id)) rated.push(meta);
            else {
                const idx = rated.findIndex(v => v.id === meta.id);
                rated.splice(idx, 1, meta);
            }
            clearTimeout(handleRated);
            handleRated = setTimeout(() => {
                if (!rated.some(v => v.id === dbs.id)) rated.push(rate(message.createdTimestamp));
                const usable = rated
                    .filter(host => host.rating.available > 0)
                    .sort((a,b) => a.rating.ping - b.rating.ping)
                    .sort((a,b) => b.rating.available - a.rating.available);
                dbs.major = rated.length <= 1 || usable[0].id === dbs.id;
                for (const command in dbs.commands) {
                    if (dbs.commands[command].work === 0) { dbs.commands[command].enabled = true; continue; }
                    const bestId = usable.find(host => host.rating.commands.includes(command))?.id;
                    // if no one else is capable (i.e. no one else exists) then we must bear the given iregardless of capacity
                    dbs.commands[command].enabled = !bestId || bestId === dbs.id;
                }
                if (dbs.major) console.log('This bot is handling events.');
                else console.log('This bot will nolonger handle events.');
                console.log('The following commands are enabled: ', Object.entries(dbs.commands).filter(([n, command]) => command.enabled).map(n => n[0]));
            }, 3000);
        }
        if (message.author.id !== '1455453433565020306') return; // ddededodediamantes gabriel
        if (time) clearTimeout(time);
        if (lost) {
            lost = false;
            console.log('Watch-dog signal reappeared!');
        }

        const rating = rate(message.createdTimestamp);
        message.reply(`Hello gabriel! i am ${JSON.stringify({ id: dbs.id, rating })}`);
        rated.splice(0, rated.length);

        time = setTimeout(() => {
            message.reply('Gabriel? you there?');
            console.log('Lost watch-dog signal.');
            lost = true;
        }, ((5 * 60) * 60) * 1000);
    }
};


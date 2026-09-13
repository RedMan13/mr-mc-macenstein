/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'progress-bar',
    category: 'dumb fun',
    sDesc: 'makes a fake progress bar',
    lDesc: 'sets up and displays an entirely fake progress bar for your entertainment',
    work: 'any',
    args: [
        {
            type: 'number',
            name: 'length',
            desc: 'The length of the progress bar',
            min: 1,
            max: 999,
            required: true
        },
        {
            type: 'number',
            max: Infinity,
            min: 0,
            name: 'time',
            desc: 'What the maximum number of seconds to wait between movements of the bar should be',
            required: false
        },
        {
            type: 'any',
            name: 'on',
            desc: 'What character to use for filled parts of the progress bar',
            required: false
        },
        {
            type: 'any',
            name: 'off',
            desc: 'What character to use for remaining parts of the progress bar',
            required: false
        }
    ],
    async execute(message) {
        const len = message.arguments.length;
        const time = message.arguments.time || 10;
        let on = message.arguments.on || '=';
        let off = message.arguments.off || ' ';
        if (off.length < on.length) off = off.repeat(Math.ceil(on.length / off.length)).slice(0, on.length);
        if (on.length < off.length) on = on.repeat(Math.ceil(off.length / on.length)).slice(0, off.length);

        let progress = 0;
        const msg = await message.reply(`\`[${on.repeat(progress)}${off.repeat(len - progress)}]\``);
        const tick = () => {
            progress += (Math.random() * 3) +1;
            if (progress >= len) {
                progress = len;
                msg.edit(`\`[${on.repeat(progress)}]\``);
                return;
            }
            msg.edit(`\`[${on.repeat(progress)}${off.repeat((len - progress) +1)}]\``);
            setTimeout(tick, Math.random() * time)
        }; tick();
    },
};
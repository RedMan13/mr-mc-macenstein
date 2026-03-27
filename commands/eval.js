const util = require('util');
const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;

module.exports = {
    name: 'eval',
    category: 'operator',
    sDesc: 'Evaluates javascript',
    lDesc: 'Runs any arbitrary javascript inside of the bot',
    args: [
        {
            type: 'string',
            name: 'code',
            desc: 'The code to run, of course',
            required: true
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        if (message.author.id !== "860531746294726736") {
            message.reply(`you are not authorized to use this`);
            return;
        }
        if (message.arguments.code.startsWith('```')) message.arguments.code = message.arguments.code.replace(/^```js|```$/gi, '');
        let output;
        try {
            const res = await new AsyncFunction('message', 'require', message.arguments.code)(message, require);
            output = util.inspect(res, { showHidden: true, colors: true });
        } catch (err) {
            output = err.stack;
        }
        if (output.length > 1989) output = output.slice(0, 1985) + '...';
        message.reply('```ansi\n' + output + '```');
    },
};

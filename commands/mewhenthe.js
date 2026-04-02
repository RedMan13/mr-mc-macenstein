const { AttachmentBuilder } = require('discord.js');
const { Canvas } = require('skia-canvas');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'mewhenthe',
    category: 'dumb fun',
    sDesc: 'hehehe me when the color',
    lDesc: 'Generates a random color with the text "Me when the"',
    args: [
        {
            type: 'string',
            name: 'text',
            desc: 'Text to display (top|bottom|#hex)',
            required: false
        }
    ],

    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        const args = message.arguments;
        const text = args['text'] || 'Me when the | Me when the';

        // split
        const parts = text.split('|').map(t => t.trim());
        const topText = parts[0] || 'Me when the';
        const bottomText = parts[1] || 'Me when the';
        let chosenColor = parts[2];

        // validate the hex but if it doesnt work just make it random
        const isValidHex = /^#?[0-9A-Fa-f]{6}$/;
        if (chosenColor && isValidHex.test(chosenColor)) {
            if (!chosenColor.startsWith('#')) chosenColor = `#${chosenColor}`;
        } else {
            chosenColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')}`;
        }

        const canvas = new Canvas(600, 600);
        const ctx = canvas.getContext('2d');

        // background
        ctx.fillStyle = chosenColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 50px Sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // top text
        ctx.fillText(topText, canvas.width / 2, 20);

        // bottom text
        ctx.textBaseline = 'bottom';
        ctx.fillText(bottomText, canvas.width / 2, canvas.height - 20);

        const attachment = new AttachmentBuilder(await canvas.toBuffer(), { name: 'mewhenthe.png' });

        await message.reply({
            content: `me when the ${chosenColor}`,
            files: [attachment]
        });
    },
};

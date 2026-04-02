const { actions, outcomes, rareEvents } = require('../assets/predictions.json');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'prediction',
    category: 'dumb fun',
    sDesc: 'predict the future',
    lDesc: 'Generates a random prophecy about someone.',
    args: [
        {
            type: 'string',
            lBraket: '{',
            rBraket: '}',
            name: 'subject',
            desc: 'The person to predict',
            required: true
        }
    ],
    execute(message) {
        const args = message.arguments;
        const subject = args['subject'] || message.author.username;

        // choose a date up to 30 days in the future
        const dateString = `<t:${Math.floor((Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000) / 1000)}:D>`;

        let action, outcome;

        // chance for rare event 3%
        if (Math.random() < 0.03) {
            action = rareEvents[Math.floor(Math.random() * rareEvents.length)];
            outcome = "nothing will ever be the same";
        } else {
            action = actions[Math.floor(Math.random() * actions.length)];
            outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        }

        const prediction = `On ${dateString}, ${subject} will ${action} and ${outcome}.`;

        message.reply({
            content: prediction,
            allowedMentions: {
                user: [message.author.id],
                role: [],
                parsed: []
            }
        });
    },
};

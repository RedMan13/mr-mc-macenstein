const { actions, outcomes, rareEvents } = require('../assets/predictions.json');

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
        const subject = args['subject'];

        // choose a date up to 30 days in the future
        const now = new Date();
        const future = new Date(now.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
        const dateString = future.toLocaleDateString();

        let action, outcome;

        // chance for rare event 30%
        if (Math.random() < 0.3) {
            action = rareEvents[Math.floor(Math.random() * rareEvents.length)];
            outcome = "and nothing will ever be the same";
        } else {
            action = actions[Math.floor(Math.random() * actions.length)];
            outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        }

        const prediction = `On ${dateString}, ${subject} will ${action} and ${outcome}.`;

        message.reply(prediction);
    },
};

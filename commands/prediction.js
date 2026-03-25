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

        const actions = [
            "find a something awesome",
            "trip over nothing",
            "become famous",
            "eat something... questionable",
            "discover the secrets of the universe",
            "cause the Roaring",
            "win 20 billion dolla dolla",
            "lose something important",
            "meet a strange figure behind a tree",
            "unlock hidden potential",
            "find out the end of Deltarune"
        ];

        const outcomes = [
            "change their life forever",
            "regret it instantly",
            "not understand what happened",
            "laugh about it later",
            "uh... i didnt think that far ahead",
            "become a legend",
            "start a new journey",
            "confuse everyone around them",
            "make history somehow",
            "wish they stayed home",
            "explode"
        ];

        // rare events
        const rareEvents = [
            "break reality itself",
            "vanish without explanation",
            "rewrite their own fate",
            "summon something unknown",
            "glitch through existence",
            "just fucking die",
            "get smited by ddededodediamante",
            "nothing more will happen",
            "it will be the end of the universe",
            "become the owner of PenguinMod",
            "release Deltarune",
            "implement Pluey"
        ];

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

const { ApplicationIntegrationType, InteractionContextType, ApplicationCommandType, ApplicationCommandOptionType, Message, Collection } = require('discord.js');

/** @implements {Message} */
class FakeMessage {
    /** @param {import('discord.js').Interaction} interaction */
    constructor(interaction) {
        // many properties are just carbon copies
        Object.assign(this, interaction);
        this.interaction = interaction;
        this.attachments = new Collection();
        this._deleted = false;
    }
    async reply(...args) {
        await this.interaction.editReply(...args);
        return this; // lie
    }
    edit(...args) { return this.interaction.editReply(...args); }
    delete() {}
    awaitMessageComponent(options) {}
    awaitReactions(options) {}
    createReactionCollector(options) {}
    createMessageComponentCollector(options) {}
    equals(message, rawData) {}
    fetchReference() {}
    fetchWebhook() {}
    crosspost() {}
    fetch(force) {}
    pin(reason) {}
    react(emoji) {}
    removeAttachments() {}
    forward(channel) {}
    resolveComponent(customId) {}
    startThread(options) {}
    suppressEmbeds(suppress) {}
    toJSON() { return this.interaction.toJSON(); }
    toString() { return this.interaction.toString(); }
    unpin(reason) {}
    inGuild() { return this.interaction.inGuild(); }
}
/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    slashCmd: true,
    work: 'any',
    comData: {
        type: ApplicationCommandType.ChatInput,
        name: 'run',
        description: 'Runs any text command, just instead as a slash command',
        integration_types: [ApplicationIntegrationType.UserInstall],
        contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
        options: [
            {
                name: 'command',
                description: 'The command to run.',
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
                required: true
            },
            {
                name: 'arguments',
                description: 'The arguments to run with.',
                type: ApplicationCommandOptionType.String,
                required: false
            },
            {
                name: 'attachment',
                description: 'Some file to send along with it.',
                type: ApplicationCommandOptionType.Attachment,
                required: false
            }
        ]
    },
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    execute: async (interaction, type) => {
        if (type === 'autocomplete') {
            const value = interaction.options.get('command').value;
            const completes = Object.keys(dbs.commands)
                .filter(command => command.startsWith(value))
                .slice(0,25)
                .map(command => ({ name: command, value: command }));
            interaction.respond(completes);
            return;
        }
        const command = dbs.commands[interaction.options.get('command').value];
        if (!command?.enabled) return interaction.reply({ content: 'Command doesnt exist!!', ephumeral: true });
        await interaction.deferReply();
        const msg = new FakeMessage(interaction);
        const attachment = interaction.options.get('attachment');
        if (attachment) msg.attachments.set(attachment.attachment.id, attachment.attachment);
        msg.args = interaction.options.get('arguments')?.value ?? '';
        msg.arguments = command.useCLI
            ? imports.parseArgs(msg.args.split(' '), command.command.args)
            : await imports.getAllArgs(msg, command.command.args);
        command.command.execute(msg);
    }
} 
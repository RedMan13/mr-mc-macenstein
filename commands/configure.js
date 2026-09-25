const { ButtonStyle, ChannelType } = require('discord.js');

function renderServerSettings(settings, page = 'commands', userOnly, userSettings) {
    const hasWordchains = settings.get('wordchains-enabled');
    const wordchainsChannel = settings.get('wordchains-channel');
    const wordErrorsChannel = settings.get('word-errors-channel');

    const usesBlacklist = !settings.has('blacklist-channels') || settings.get('blacklist-channels');
    const channelsList = settings.get('channels-list');

    const ratReact = !settings.has('rat-reactions') || settings.get('rat-reactions');

    const pingsOnErrors = !userSettings.has('wordchains-ping') || userSettings.get('wordchains-ping');
    const ratReactsToThem = !userSettings.has('rat-reactions') || userSettings.get('rat-reactions');

    const pages = {
        ['word-chains-pings']: [
            <text>## Word Chains Ping</text>,
            <text>If i should ping you whenever you make a mistake in wordchains.</text>,
            <row>
                <button id="configure.wordchains-ping.enable" style={pingsOnErrors ? ButtonStyle.Primary : ButtonStyle.Secondary}>Enabled</button>
                <button id="configure.wordchains-ping.disable" style={!pingsOnErrors ? ButtonStyle.Primary : ButtonStyle.Secondary}>Disabled</button>
            </row>
        ],
        ['rat-reacts-me']: [
            <text>## Rat Reacts (to you)</text>,
            <text>If the bot should be allowed to react with 🐀 when rat, cheese, 🐀, or 🧀 are used in your messages.</text>,
            <row>,
                <button id="configure.rat-react-user.enable" style={ratReactsToThem ? ButtonStyle.Primary : ButtonStyle.Secondary}>Enabled</button>
                <button id="configure.rat-react-user.disable" style={!ratReactsToThem ? ButtonStyle.Primary : ButtonStyle.Secondary}>Disabled</button>
            </row>
        ]
    };
    if (!userOnly)
        Object.assign(pages, {
            ['wordchains']: [
                <text>## Word Chains</text>,
                <text>{
                    'Sets up a channel to use for word chains game.\n\n' +
                    'Rules of the game are that:\n' +
                    '1. Each new word must start with the letter the last one ended with.\n' +
                    '2. Each new word can only be a word that has not been used.\n' +
                    '3. Users can not send a new word before someone else sends a new word.\n' +
                    '4. The word must actually be a recognized word, and not random or meaningless slop.\n\n' +

                    'For the very first word of the game, one doesnt apply, so any word can be used.'
                }</text>,
                <row>
                    <button id={`configure.word-chains.enable..${page}`} style={hasWordchains ? ButtonStyle.Primary : ButtonStyle.Secondary}>Enabled</button>
                    <button id={`configure.word-chains.disable..${page}`} style={!hasWordchains ? ButtonStyle.Primary : ButtonStyle.Secondary}>Disabled</button>
                </row>,
                <row>
                    <channel-select id={`configure.word-chains-channel..${page}`} max="1" placeholder="Word Chains Channel" types={[ChannelType.GuildText, ChannelType.PrivateThread, ChannelType.PublicThread]}>
                        {wordchainsChannel && <channel id={wordchainsChannel}/>}
                    </channel-select>
                </row>,
                <row>
                    <channel-select id={`configure.word-errors-channel..${page}`} max="1" placeholder="Word Errors Channel (i.e. a thread)" types={[ChannelType.GuildText, ChannelType.PrivateThread, ChannelType.PublicThread]}>
                        {wordErrorsChannel && <channel id={wordErrorsChannel}/>}
                    </channel-select>
                </row>
            ],
            ['rat-reacts']: [
                <text>## Rat React</text>,
                <text>Reacts to messages with 🐀 when rat, cheese, 🐀, or 🧀 are used in a message.</text>,
                <row>
                    <button id={`configure.rat-react.enable..${page}`} style={ratReact ? ButtonStyle.Primary : ButtonStyle.Secondary}>Enabled</button>
                    <button id={`configure.rat-react.disable..${page}`} style={!ratReact ? ButtonStyle.Primary : ButtonStyle.Secondary}>Disabled</button>
                </row>
            ],
            ['commands']: [
                <text>## Commands</text>,
                <row>
                    <button id={`configure.blacklist-channels.enable..${page}`} style={usesBlacklist ? ButtonStyle.Primary : ButtonStyle.Secondary}>Blacklist</button>
                    <button id={`configure.blacklist-channels.disable..${page}`} style={!usesBlacklist ? ButtonStyle.Primary : ButtonStyle.Secondary}>Whitelist</button>
                </row>,
                <text>### {usesBlacklist ? ' Denied ' : ' Allowed '} Channels</text>,
                <row> 
                    <channel-select id={`configure.command-channels..${page}`} max="25" min="0" types={[ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.GuildForum, ChannelType.GuildMedia]}>
                        {channelsList && channelsList.map(channel => (<channel id={channel}/>))}
                    </channel-select>
                </row>,
                <text>Use `mc;configure [command]` to configure each individual command.</text>
            ]
        });

    return <container>
        <row> 
            <string-select id="configure.change-page" max="1" min="1" placeholder="Category">
                {Object.entries(pages).map(([name, content]) => (<option id={name} default={page === name}>{content[0].content.slice(3)}</option>))}
                <option id="all" title="Shows every single option available" default={page === 'all'}>All</option>
            </string-select>
        </row>
        {page === 'all' ? Object.values(pages).flatMap(components => components) : pages[page] ?? <text>Uh Oh! Invalid page</text>}
    </container>
}

function renderCommandSettings(settings, command) {
    const enabled = !settings.has(`${command}-enabled`) || settings.get(`${command}-enabled`);
    const usesBlacklist = !settings.has(`${command}-blacklist-channels`) || settings.get(`${command}-blacklist-channels`);
    const channelsList = settings.get(`${command}-channels-list`);

    return <container>
        <text>## {' ' + command}</text>
        <row>
            <button id={`configure.command-enable.enable.${command}`} style={enabled ? ButtonStyle.Primary : ButtonStyle.Secondary}>Enabled</button>
            <button id={`configure.command-enable.disable.${command}`} style={!enabled ? ButtonStyle.Primary : ButtonStyle.Secondary}>Disabled</button>
        </row>
        <row>
            <button id={`configure.command-blacklist-channels.enable.${command}`} style={usesBlacklist ? ButtonStyle.Primary : ButtonStyle.Secondary}>Blacklist</button>
            <button id={`configure.command-blacklist-channels.disable.${command}`} style={!usesBlacklist ? ButtonStyle.Primary : ButtonStyle.Secondary}>Whitelist</button>
        </row>
        <text>### {usesBlacklist ? ' Denied ' : ' Allowed '} Channels</text>
        <row> 
            <channel-select id={`configure.command-channel-list..${command}`} max="25" min="0" types={[ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.GuildForum, ChannelType.GuildMedia]}>
                {channelsList && channelsList.map(channel => (<channel id={channel}/>))}
            </channel-select>
        </row>
    </container>
}

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'configure',
    aliases: ['config', 'conf', 'settings'],
    category: 'settings',
    sDesc: 'Opens the user or server settings.',
    lDesc: 'Provides only user settings to normal users, and user + server settings to admins.',
    work: 'any',
    args: [
        {
            name: 'command',
            type: 'any',
            desc: 'A specific command to configure.'
        }
    ],
    /** @param {import('discord.js').MessageComponentInteraction} message */
    execute: async (message, setting, boolean, command, page) => {
        const userSettings = dbs.database.user(message.member?.id ?? message.author.id);
        const userOnly = !message.member.permissions.has('Administrator');
        const settings = dbs.database.server(message.channel.guild.id);

        switch (setting) {
        case 'change-page': page = message.values[0]; break;
        case 'refresh': break;
        case 'wordchains-ping':
            userSettings.set('wordchains-ping', boolean === 'enable');
            break;
        case 'rat-react-user':
            userSettings.set('rat-reactions', boolean === 'enable');
            break;

        case 'command-enable':
            if (userOnly) message.reply({ content: 'No!', flags: 'Ephemeral' });
            settings.set(`${command}-enabled`, boolean === 'enable');
            break;
        case 'command-blacklist-channels':
            if (userOnly) message.reply({ content: 'No!', flags: 'Ephemeral' });
            settings.set(`${command}-blacklist-channels`, boolean === 'enable');
            break;
        case 'command-channel-list':
            if (userOnly) message.reply({ content: 'No!', flags: 'Ephemeral' });
            settings.set(`${command}-channels-list`, message.channels.map(channel => channel.id));
            break;

        case 'rat-react':
            if (userOnly) message.reply({ content: 'No!', flags: 'Ephemeral' });
            settings.set('rat-reactions', boolean === 'enable');
            break;
        case 'command-channels':
            if (userOnly) message.reply({ content: 'No!', flags: 'Ephemeral' });
            settings.set('channels-list', message.channels.map(channel => channel.id));
            break;
        case 'blacklist-channels':
            if (userOnly) message.reply({ content: 'No!', flags: 'Ephemeral' });
            settings.set('blacklist-channels', boolean === 'enable');
            break;
        case 'word-errors-channel':
            if (userOnly) message.reply({ content: 'No!', flags: 'Ephemeral' });
            settings.set('word-errors-channel', message.channels.at(0).id);
            break;
        case 'word-chains-channel':
            if (userOnly) message.reply({ content: 'No!', flags: 'Ephemeral' });
            settings.set('wordchains-channel', message.channels.at(0).id);
            break;
        case 'word-chains':
            if (userOnly) message.reply({ content: 'No!', flags: 'Ephemeral' });
            settings.set('wordchains-enabled', boolean === 'enable');
            break;
        default:
            if (message.arguments.command) {
                if (!dbs.commands[message.arguments.command]) return message.reply('Must be a real command!');
                message.reply({
                    flags: ['IsComponentsV2'],
                    components: [
                        renderCommandSettings(settings, message.arguments.command),
                        <row>
                            <button style={ButtonStyle.Secondary} id={`configure.refresh..${command}`}>Refresh</button>
                        </row>
                    ]
                })
                return;
            }
            message.reply({
                flags: ['IsComponentsV2'],
                components: [
                    renderServerSettings(settings, page, userOnly, userSettings),
                    <row>
                        <button style={ButtonStyle.Secondary} id={`configure.refresh...commands`}>Refresh</button>
                    </row>
                ]
            })
            return;
        }

        if (settings.get('wordchains-enabled')) {
            const wordchains = await imports.client.channels.fetch(settings.get('wordchains-channel')).catch(() => {});
            const wordErrors = await imports.client.channels.fetch(settings.get('word-errors-channel')).catch(() => {});
            if (!wordchains)
                message.message.reply('Word Chains Channel MUST be a valid channel that i can access!');
            if (!wordErrors)
                message.message.reply('Word Errors Channel MUST be a valid channel that i can access!');
        }

        if (command) {
            message.update({
                flags: ['IsComponentsV2'],
                components: [
                    renderCommandSettings(settings, command),
                    <row>
                        <button style={ButtonStyle.Secondary} id={`configure.refresh..${command}`}>Refresh</button>
                    </row>
                ]
            })
            return;
        }
        message.update({
            flags: ['IsComponentsV2'],
            components: [
                renderServerSettings(settings, page, userOnly, userSettings),
                <row>
                    <button style={ButtonStyle.Secondary} id={`configure.refresh...commands`}>Refresh</button>
                </row>
            ]
        })
    },
};

const embedBuilder = require('../statics/discord-embeds.js');


const documentation = {
    'preface': {
        title: 'Preface',
        description: 'The documentation preface',
        content: '- Types are specified with the XML attribute namespace, I.E. `<button style:string disabled:boolean>`.\n' +
            '- Boolean types will automatically be interpreted as true if the content is not equal to `false`.\n' +
            '- Number types can be any valid javascript number, I.E. 0xFE, 047, 0b1010, 10, 10.23, 1.23E+4, etc.\n' +
            '- Components who have element children will close the element and have the child be a list of all possible tags that can be inserted, possibly including the attribute types, I.E. `<media-gallery><video url:string></media-gallery>`\n' +
            '- Components who have string children will close the element and have there child solely be `{strings}`. Anything other then pure text that is put inside such elements will result in an error.\n' +
            '- Alternate tag names will be listed just after the main tagname as regular strings, I.E. `<image src:string> img`.\n' +
            '- Alternate attribute names will be listed just the same as any other, minus type, but will have the name they are an alternate for in the attribute value, I.E. `<button custom-id:string id="custom-id"`.\n' +
            'Namespace is completely ignored from the input, so it is normally safe to just copy/paste the type definitions directly.\n' +
            'Putting elements that are not listed as valid children into another element may result in an error.'
    },
    'container': {
        title: 'Container',
        description: 'Components V2 container, looks like an embed.',
        content: '```xml\n' +
            '<container accent:number color="accent" spoiler:boolean>\n' +
            '  <text-display>\n' +
            '  <seperator>\n' +
            '  <action-row>\n' +
            '  <section>\n' +
            '  <media-gallery>\n' +
            '  <file>\n' +
            '</container>\n' +
            '```\n'
    },
    'text-display': {
        title: 'Text Display',
        description: 'Components V2 rendered text, acts like message content.',
        content: '```xml\n' +
            '<text-display>\n' +
            '  {strings}\n' +
            '</text-display> text\n' +
            '```\n'
    },
    'seperator': {
        title: 'Seperator',
        description: 'Components V2 seperator, adds a gap or line to seperate sections.',
        content: '```xml\n' +
            '<seperator large:boolean solid:boolean>\n' +
            '```\n'
    },
    'media-gallery': {
        title: 'Media Gallery',
        description: 'Components V2 media gallery, displays media the same way as in a discord message.',
        content: '```xml\n' +
            '<media-gallery accent:number color="accent" spoiler:boolean>\n' +
            '  <image url:string src="url" source="url" description:string title="description" spoiler:boolean> video img\n' +
            '</media-gallery> media\n' +
            '```\n'
    },
    'section': {
        title: 'Section',
        description: 'Components V2 section, allows you to put a button/thumbnail in the top right.',
        content: '```xml\n' +
            '<section>\n' +
            '  <text-display>\n' +
            '  <!-- The following elements can ONLY appear at the end of the child list. As they are what can be used as the "accessory" component -->\n' +
            '  <thumbnail>\n' +
            '  <button>\n' +
            '</section>\n' +
            '```\n'
    },
    'thumbnail': {
        title: 'Thumbnail',
        description: 'Components V2 thumbail, like a standalone media gallery item.',
        content: '```xml\n' +
            '<thumbnail url:string src="url" source="url" description:string title="description" spoiler:boolean>\n' +
            '```\n'
    },
    'action-row': {
        title: 'Action Row',
        description: 'Container for interactable components, like buttons and selectors.',
        content: '```xml\n' +
            '<row>\n' +
            '  <button>\n' +
            '  <string-select>\n' +
            '  <user-select>\n' +
            '  <role-select>\n' +
            '  <mentionable-select>\n' +
            '  <channel-select>\n' +
            '</row>\n' +
            '```\n'
    },
    'button': {
        title: 'Button',
        description: 'Button, for clicking on.',
        content: '```xml\n' +
            '<button style:string custom-id:string id="custom-id" sku-id="custom-id" emoji:string url:string disabled:boolean>\n' +
            '  {strings}\n' +
            '</button>\n' +
            '```\n'
    },
    'string-select': {
        title: 'String Select',
        description: 'Selector for strings.',
        content: '```xml\n' +
            '<string-select custom-id:string id="custom-id" placeholder:string min-values:number min="min-values" max-values:number max="max-values" required:boolean disabled:boolean>\n' +
            '  <option value:string id="value" description:string title="description" emoji:string default:boolean>\n' +
            '    {strings}\n' +
            '  </option>\n' +
            '</string-select>\n' +
            '```\n'
    },
    'user-select': {
        title: 'User Select',
        description: 'Selector for users.',
        content: '```xml\n' +
            '<user-select custom-id:string id="custom-id" placeholder:string min-values:number min="min-values" max-values:number max="max-values" required:boolean disabled:boolean>\n' +
            '  <user id:string value="id">\n' +
            '</user-select>\n' +
            '```\n'
    },
    'role-select': {
        title: 'Role Select',
        description: 'Selector for roles.',
        content: '```xml\n' +
            '<role-select custom-id:string id="custom-id" placeholder:string min-values:number min="min-values" max-values:number max="max-values" required:boolean disabled:boolean>\n' +
            '  <role id:string value="id">\n' +
            '</role-select>\n' +
            '```\n'
    },
    'channel-select': {
        title: 'Channel Select',
        description: 'Selector for channels.',
        content: '```xml\n' +
            '<channel-select types:string custom-id:string id="custom-id" placeholder:string min-values:number min="min-values" max-values:number max="max-values" required:boolean disabled:boolean>\n' +
            '  <channel id:string value="id">\n' +
            '</channel-select>\n' +
            '```\n'
    },
    'mentionable-select': {
        title: 'Mentionable Select',
        description: 'Selector for things that can be mentioned.',
        content: '```xml\n' +
            '<mentionable-select types:string custom-id:string id="custom-id" placeholder:string min-values:number min="min-values" max-values:number max="max-values" required:boolean disabled:boolean>\n' +
            '  <user id:string value="id">\n' +
            '  <role id:string value="id">\n' +
            '  <channel id:string value="id">\n' +
            '</mentionable-select>\n' +
            '```\n'
    }
}
/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'components-maker',
    aliases: ['v2-maker', 'components-v2', 'components-helper', 'v2-helper'],
    category: 'languages',
    sDesc: 'Helps with making discord components V2',
    lDesc: 'Uses a bespoke XML format to help produce discord components V2',
    work: 'any',
    args: [
        {
            type: 'string',
            name: 'components',
            desc: 'The XML formated components',
            required: true
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message, isDocs) => {
        const code = message.arguments?.components?.replace?.(/^```[a-z]*|```$/gi, '') || 'docs';
        if (code === 'docs' || isDocs === 'docs') {
            const page = message?.values?.[0] ?? 'preface';
            const payload = {
                flags: 'IsComponentsV2',
                components: [
                    <container>
                        <row>
                            <string-select id="components-maker.docs" max="1" min="1" placeholder="Header">
                                {Object.entries(documentation).map(([id, doc]) => (<option id={id} title={doc.description} default={page === id}>{doc.title}</option>))}
                            </string-select>
                        </row>
                        <text>{documentation[page].content}</text>
                    </container>
                ]
            };
            if (isDocs) return message.update(payload);
            return message.reply(payload);
        } 
        let output = code;
        try {
            const jSON = JSON.parse(output = embedBuilder(`<components>${code}</components>`, true));
            output = JSON.stringify(jSON, null, '\t');
            await message.reply({
                flags: 'IsComponentsV2',
                components: jSON
            });
        } catch (err) {
            console.log(err);
            output = err.message + `\nGot: ${output}`;
        }
        message.channel.send('```json\n' + output + '```');
    },
};

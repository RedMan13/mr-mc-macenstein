module.exports = {
    name: 'test',
    category: 'operator',
    sDesc: 'just testing',
    lDesc: 'your mom LMAO',
    args: [
        {
            type: 'any',
            name: 'demo1',
            desc: 'An input that can be any space-less thing',
            required: true
        },
        {
            type: 'number',
            max: 100,
            min: 0,
            name: 'demo2',
            desc: 'An input that can be any number from 0-100',
            required: true
        },
        {
            type: 'string',
            lBraket: '{',
            rBraket: '}',
            name: 'demo3',
            desc: 'An input that can be a string, either spaceless or encased in `{}`',
            required: true
        },
        {
            type: 'member',
            name: 'demo4',
            desc: 'An input that can be any user',
            required: true
        },
        {
            type: 'channel',
            name: 'demo5',
            desc: 'An input that can be any channel',
            required: true
        },
        {
            type: 'role',
            name: 'demo6',
            desc: 'An input that can be any role',
            required: true
        }
    ],
    execute(message) {
        const args = message.arguments
        message.reply([
            args['demo1'], 
            args['demo2'], 
            args['demo3'], 
            `<@${args['demo4'].id}>`, 
            `<#${args['demo5'].id}>`, 
            args['demo6']
        ].join('\n'))
    },
};
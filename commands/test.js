module.exports = {
    name: 'test',
    category: 'operator',
    sDesc: 'just testing',
    lDesc: 'your mom LMAO',
    args: [
        {
            type: 'any',
            name: 'demo1',
            required: true
        },
        {
            type: 'number',
            max: 100,
            min: 0,
            name: 'demo2',
            required: true
        },
        {
            type: 'string',
            lBraket: '{',
            rBraket: '}',
            name: 'demo3',
            required: true
        },
        {
            type: 'member',
            name: 'demo4',
            required: true
        },
        {
            type: 'channel',
            name: 'demo5',
            required: true
        },
        {
            type: 'role',
            name: 'demo6',
            required: true
        }
    ],
    execute(message) {
        const args = message.arguments
        message.channel.send([
            args['demo1'], 
            args['demo2'], 
            args['demo3'], 
            `<@${args['demo4'].id}>`, 
            `<#${args['demo5'].id}>`, 
            args['demo6']
        ].join('\n'))
    },
};
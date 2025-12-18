module.exports = {
    name: 'messageCreate',
    once: false,
    execute: async (message) => {
        if (message.content.includes('993334503290454030')) {
            message.channel.send({
                embeds: [{
                    color: 0x33cc00,
                    title: 'prefix: ' + dbs.commandConfig.prefix,
                    description: `help: ${dbs.commandConfig.prefix}help`
                }]
            });
      
        }
    },
};
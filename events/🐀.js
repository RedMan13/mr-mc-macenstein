module.exports = {
    name: 'messageCreate',
    once: false,
    global: false,
    execute: async (message) => {
        if (message.content.includes('🧀') || message.content.includes('cheese')) {
            message.react('🐀');
        }
    },
};
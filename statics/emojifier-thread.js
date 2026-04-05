const pixels = require('../assets/emojis.js');

process.on('message', (segments) => {
    let idx = 0;
    const loop = setInterval(() => {
        const start = Date.now();
        for (; true; idx++) {
            if (Date.now() - start > 4000) break;
            if (idx >= segments.length) {
                
                break;
            }
        }
    }, 4010);
})
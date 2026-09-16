const child = require('child_process');

/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'metal-pipe',
    category: 'overlays',
    sDesc: 'Plays metal-pipe.mp3',
    lDesc: 'Plays metal-pipe.mp3 on my system',
    work: 'pc',
    args: [],
    execute: () => child.exec('xfce4-terminal -e "play file /home/godslayerakp/Music/metal-pipe.mp3"')
};

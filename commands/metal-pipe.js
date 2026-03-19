const child = require('child_process');

module.exports = {
    name: 'metal-pipe',
    category: 'dumb fun',
    sDesc: 'Plays metal-pipe.mp3',
    lDesc: 'Plays metal-pipe.mp3 on my system',
    args: [],
    execute: () => child.exec('gnome-terminal -- play file /home/godslayerakp/Music/metal-pipe.mp3')
};

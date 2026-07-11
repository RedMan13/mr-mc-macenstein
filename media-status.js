const DBus = require('dbus');
const { Client } = require('@xhayper/discord-rpc');
const MprisSpecs = require('./assets/mpris-specifications.json');

// small media player scrapper that then also intends to setup things like discord status
const client = new Client({ clientId: '993334503290454030' });
client.on('ready', async () => {
    console.log('Connected to discord');
    const bus = DBus.getBus('session');
    /** @typedef {(
     *  serviceName: string, 
     *  objectPath: string, 
     *  callback: (err: Error, obj: {
     *      [interface: string]: {
     *          method: { [name: string]: { in: string[], out: string[] } },
     *          property: { [name: string]: { type: string, access: string } },
     *          signal: { [name: string]: string[] }
     *      }
     *  })
     * ) => void} Intropect */
    /** @type {Intropect} */
    const trueIntrospect = bus.introspect;
    /** @type {Intropect} */
    bus.introspect = function(serviceName, objectPath, callback) {
        trueIntrospect.call(this, serviceName, objectPath, (err, obj) => {
            if (err?.message === 'No introspectable') { return callback(null, MprisSpecs); }
            callback(err, obj);
        })
    }

    /** @type {DBus.DBusInterface} */
    const internals = await new Promise((g,b) => bus.getInterface('org.freedesktop.DBus', '/org/freedesktop/DBus', 'org.freedesktop.DBus', (e,i) => e ? b(e) : g(i)));
    const names = await new Promise((g,b) => internals.ListNames((e,i) => e ? b(e) : g(i)));
    let majorActivity = null;
    const listenings = [];
    async function hookPlayer(name) {
        const properties = await new Promise((g,b) => bus.getInterface(name, '/org/mpris/MediaPlayer2', 'org.freedesktop.DBus.Properties', (e,i) => e ? b(e) : g(i)));
        const basic = await new Promise((g,b) => bus.getInterface(name, '/org/mpris/MediaPlayer2', 'org.mpris.MediaPlayer2', (e,i) => e ? b(e) : g(i)));
        const player = await new Promise((g,b) => bus.getInterface(name, '/org/mpris/MediaPlayer2', 'org.mpris.MediaPlayer2.Player', (e,i) => e ? b(e) : g(i)));
        // const tracks = await new Promise(g => bus.getInterface(name, '/org/mpris/MediaPlayer2', 'org.mpris.MediaPlayer2.TrackList', (e,i) => g(i)));
        // const playlist = await new Promise(g => bus.getInterface(name, '/org/mpris/MediaPlayer2', 'org.mpris.MediaPlayer2.Playlists', (e,i) => g(i)));
        const ident = await new Promise((g,b) => basic.getProperty('Identity', (e,i) => e ? b(e) : g(i)));
        let rate;
        let start;
        let end;
        let artist;
        let title;
        let status;
        let lastSong = '';
        let lastIcon = '';
        let link;
        let artUrl;
        let pauseStart;
        listenings.push(name);
        
        const wrap = (interface, changes) => paintOut(changes)
        async function paintOut(raw) {
            if (!listenings.includes(name)) return properties.off('PropertiesChanged', wrap);
            if ('PlaybackStatus' in raw) {
                if (raw.PlaybackStatus === 'Playing' && status === 'Paused') { // started playing
                    const dt = Date.now() - pauseStart;
                    start += dt;
                    end += dt;
                }
                status = raw.PlaybackStatus;
                if (status === 'Paused') pauseStart = Date.now();
            }
            if ('Rate' in raw) {
                // rate zero is often used for "paused"
                if (!raw.Rate) status = 'Paused';
                rate = raw.Rate || 1;
            }
            if ('Metadata' in raw) {
                if (!('Position' in raw)) raw.Position = await new Promise((g,b) => player.getProperty('Position', (e,i) => e ? b(e) : g(i)));
                end = (((raw.Metadata['mpris:length'] / 1000) * rate) - ((raw.Position / 1000) / rate)) + Date.now();
                artist = raw.Metadata['xesam:artist']?.join?.(', ') ?? '';
                title = raw.Metadata['xesam:title'] ?? '';
                if ('mpris:artUrl' in raw.Metadata) {
                    if (raw.Metadata['mpris:artUrl'].startsWith('file:')) {
                        const parsed = new URL(raw.Metadata['mpris:artUrl']);
                        const icon = path.basename(decodeURI(parsed.pathname));
                        share._removeFile(lastIcon);
                        lastIcon = icon;
                        share._addFile(decodeURI(parsed.pathname), icon);
                        artUrl = `https://godslayerakp.serv00.net/${encodeURI(share.name)}/file/${encodeURI(icon)}`;
                    } else artUrl = raw.Metadata['mpris:artUrl'];
                } else artUrl = null;
                if ('xesam:url' in raw.Metadata) {
                    if (!raw.Metadata['xesam:url'].startsWith('file:')) link = raw.Metadata['xesam:url'];
                } else link = null; // assume metadata update is complete
            }
            if ('Position' in raw) start = Date.now() - ((raw.Position / rate) / 1000);

            if (majorActivity === null) majorActivity = name;
            if (name !== majorActivity) return;
            if (status !== 'Playing' && listenings) majorActivity = listenings[(listenings.indexOf(name) +1) % listenings.length];
            const activity = {
                type: 2, // listening
                startTimestamp: isFinite(start) && !isNaN(start) ? Math.floor(start) : Date.now(),
                endTimestamp: status === 'Playing' && !isNaN(end) ? Math.max(Math.floor(end), Date.now()) : null,
                status_display_type: 2,
                largeImageKey: artUrl,
                name: ident,
                details: status === 'Paused' ? `Idling on ${title}` : `Listening to ${title}`,
                state: `Song by ${artist}`
            };
            if (link) activity.details_url = link;
            client.user.setActivity(activity)
                .catch(err => console.warn(err, activity, raw));
        }

        paintOut({
            Rate: await new Promise((g,b) => player.getProperty('Rate', (e,i) => e ? b(e) : g(i))),
            Position: await new Promise((g,b) => player.getProperty('Position', (e,i) => e ? b(e) : g(i))),
            Metadata: await new Promise((g,b) => player.getProperty('Metadata', (e,i) => e ? b(e) : g(i))),
            PlaybackStatus: await new Promise((g,b) => player.getProperty('PlaybackStatus', (e,i) => e ? b(e) : g(i)))
        });
        properties.on('PropertiesChanged', wrap);
    }
    names.filter(name => name.startsWith('org.mpris.MediaPlayer2')).forEach(hookPlayer);
    internals.on('NameOwnerChanged', (name, oldValue, newValue) => {
        if (!name.startsWith('org.mpris.MediaPlayer2')) return;
        if (!newValue) {
            const idx = listenings.indexOf(name);
            if (idx <= -1) return;
            listenings.splice(idx, 1);
            client.user.clearActivity();
            return;
        }
        hookPlayer(name);
    });
});
function tryLogin() { client.login().catch(err => {
    console.warn('Failed to connect to discord.');
    setTimeout(tryLogin, 5000);
}) }
client.on('disconnected', () => setTimeout(tryLogin, 10000)); // discord will prob be a minute to get back on its legs
tryLogin();
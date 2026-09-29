const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const crypto = require('crypto');

const KeyWord = new mongoose.Schema({
    file: String,
    key: String,
    content: String
});

const server = mongoose.createConnection(process.env.mongoLink);
server.on('connected', () => {
    Database = MongoDatabase;
    console.log('  Mongo ready!');
});
function failAndRety() {
    console.log('  Whoops!');
    // dont try changing databases? not sure about that but if its already set to mongo then its most likely true that we will later get mongo back
    // Database = FileDatabase;
    setTimeout(() => server.openUri(process.env.mongoLink), 1000);
}
server.on('close', failAndRety);
server.on('error', failAndRety);

const KeyWords = server.model('key-words', KeyWord);

class RootDatabase {
    _name = '';
    _data = {};
    _needsWrite = false;
    _resolveLoaded = null;
    _taboutTimeout = null;
    _saveInterval = null;
    wasEmpty = true;
    loaded = null;
    constructor(name) {
        this.loaded = new Promise(resolve => this._resolveLoaded = resolve);
        this._name = name;
        this._setupSaving();
        this._taboutTimeout = setTimeout(this.close.bind(this), 60000);
    }
    async save(forced) {
        if (!this._needsWrite && !forced) return;
        // never save if the database is empty and was empty
        if (Object.keys(this._data).length <= 0 && this.wasEmpty) return;
        clearTimeout(this._taboutTimeout);
        this._taboutTimeout = setTimeout(this.close.bind(this), 60000);
        console.log(`saving ${this._name}...`);
        await this._saveInternal();
        this._needsWrite = false;
        console.log(`Finished saving ${this._name}`);
    }
    _saveInternal() { console.warn('_saveInternal() needs implemented!') }
    _setupSaving() {
        this._resolveLoaded(true);
        this.loaded = true;
        this._saveInterval = setInterval(this.save.bind(this), 1000);
    }
    clear() {
        clearInterval(this._saveInterval);
        clearTimeout(this._taboutTimeout);
        this.loaded = false;
        delete DatabaseManager.databases[this._name];
    }
    close() {
        this.save(true);
        this.clear();
    }

    add(key) { this._data[key]++; this._needsWrite = true; }
    sub(key) { this._data[key]--; this._needsWrite = true; }
    has(key) { return key in this._data; }
    get(key) { return this._data[key]; }
    set(key, value) { this._data[key] = value; this._needsWrite = true; }
    delete(key) { delete this._data[key]; this._needsWrite = true; }
    flush() { this._needsWrite = true; }
}
class FileDatabase extends RootDatabase {
    _path = '';
    constructor(dir) {
        super(dir);
        this._path = path.resolve(__dirname, '../databases', this._name);
    }

    async _saveInternal() {
        await fs.mkdir(path.dirname(this._path), { recursive: true }).catch(err => console.warn(err));
        await fs.writeFile(this._path, JSON.stringify(this._data, null, '\t')).catch(err => console.warn(err));
    }
    async _setupSaving() {
        // ignore file errors, we will just create it when we need to
        const isReal = await fs.access(this._path, fs.constants.W_OK | fs.constants.R_OK | fs.constants.F_OK).then(() => true).catch(() => false);
        if (isReal) console.log(`Reading database ${this._name}`);
        const data = await fs.readFile(this._path, 'utf8').catch(() => '{}');
        this._data = Object.assign(JSON.parse(data), this._data);
        this.wasEmpty = Object.keys(this._data).length <= 0;
        super._setupSaving();
    }
}

class MongoDatabase extends RootDatabase {
    _hashes = {};
    async _saveInternal() {
        const changes = [];
        for (const key in this._data) {
            const content = JSON.stringify(this._data[key]);
            const newHash = crypto.hash('SHA256', content);
            if (this._hashes[key] === content) continue;

            this._hashes[key] = newHash;
            changes.push({
                updateOne: {
                    filter: { file: this._name, key },
                    update: {
                        $set: { content },
                        $setOnInsert: { file: this._name, key }
                    },
                    upsert: true
                }
            });
        }
        if (changes.length <= 0) return;

        await KeyWords.bulkWrite(changes);
    }
    async _setupSaving() {
        const keys = await KeyWords.aggregate([{ $match: { file: this._name } }]);
        for (const entry of keys) {
            this._data[entry.key] = JSON.parse(entry.content);
            this._hashes[entry.key] = crypto.hash('SHA256', entry.content)
        }
        super._setupSaving();
    }
}

// may need changed in the future, since i dont intend to use FileDatabase ever again it should be safe to preemptively assume mongodb
let Database = MongoDatabase;

class DatabaseManager {
    /** @type {{ [key: string]: RootDatabase }} */
    static databases = {};
    static user(id) {
        const dir = `user/${id}.json`;
        if (!(dir in this.databases)) this.databases[dir] = new Database(dir);
        return this.databases[dir];
    }
    static channel(id) {
        const dir = `channel/${id}.json`;
        if (!(dir in this.databases)) this.databases[dir] = new Database(dir);
        return this.databases[dir];
    }
    static server(id) {
        const dir = `server/${id}.json`;
        if (!(dir in this.databases)) this.databases[dir] = new Database(dir);
        return this.databases[dir];
    }
    static global() {
        const dir = `global.json`;
        if (!(dir in this.databases)) this.databases[dir] = new Database(dir);
        return this.databases[dir];
    }
    static clearAll() {
        Object.values(this.databases).forEach(base => base.clear());
    }
    static forceSave() {
        return Promise.all(Object.values(this.databases).map(base => base.save(true)));
    }
}

module.exports = DatabaseManager
const fs = require('fs/promises');
const path = require('path');

class Database {
    #path = '';
    #data = {};
    #needsWrite = false;
    #resolveLoaded = null;
    #taboutTimeout = null;
    #saveInterval = null;
    loaded = null;
    constructor(dir) {
        this.loaded = new Promise(resolve => this.#resolveLoaded = resolve);
        this.#path = dir;
        this.#setupSaving();
        // this.save(false);
        this.#taboutTimeout = setTimeout(this.close.bind(this), 60000);
        clearTimeout(this.#taboutTimeout);
    }
    async save(forced) {
        if (!this.#needsWrite && !forced) return;
        this.#taboutTimeout = setTimeout(this.close.bind(this), 60000);
        clearTimeout(this.#taboutTimeout);
        console.log(`saving ${path.basename(this.#path)}...`);
        await fs.mkdir(path.dirname(this.#path), { recursive: true }).catch(err => console.warn(err));
        await fs.writeFile(this.#path, JSON.stringify(this.#data, null, '\t')).catch(err => console.warn(err));
        this.#needsWrite = false;
        console.log(`Finished saving ${path.basename(this.#path)}`);
    }
    async #setupSaving() {
        // ignore file errors, we will just create it when we need to
        const isReal = await fs.access(this.#path, fs.constants.W_OK | fs.constants.R_OK | fs.constants.F_OK).then(() => true).catch(() => false);
        if (isReal) console.log(`Reading database ${path.basename(this.#path)}`);
        const data = await fs.readFile(this.#path, 'utf8').catch(() => '{}');
        this.#data = Object.assign(JSON.parse(data), this.#data);
        this.#resolveLoaded(true);
        this.loaded = true;
        this.#saveInterval = setInterval(this.save.bind(this), 1000);
    }
    close() {
        this.save(true);
        clearTimeout(this.#taboutTimeout);
        clearInterval(this.#saveInterval);
        this.loaded = false;
        delete this.databases[dir];
    }

    has(key) { return key in this.#data; }
    get(key) { return this.#data[key]; }
    set(key, value) { this.#data[key] = value; this.#needsWrite = true; }
    delete(key) { delete this.#data[key]; this.#needsWrite = true; }
    flush() { this.#needsWrite = true; }
}
class DatabaseManager {
    /** @type {{ [key: string]: Database }} */
    static databases = {};
    static user(id) {
        const dir = path.resolve(__dirname, '../databases/user', id + '.json');
        if (!(dir in this.databases)) this.databases[dir] = new Database(dir);
        return this.databases[dir];
    }
    static channel(id) {
        const dir = path.resolve(__dirname, '../databases/channel', id + '.json');
        if (!(dir in this.databases)) this.databases[dir] = new Database(dir);
        return this.databases[dir];
    }
    static server(id) {
        const dir = path.resolve(__dirname, '../databases/server', id + '.json');
        if (!(dir in this.databases)) this.databases[dir] = new Database(dir);
        return this.databases[dir];
    }
    static global() {
        const dir = path.resolve(__dirname, '../databases/global.json');
        if (!(dir in this.databases)) this.databases[dir] = new Database(dir);
        return this.databases[dir];
    }
    static forceSave() {
        return Promise.all(Object.values(this.databases).map(base => base.save(true)));
    }
}

module.exports = DatabaseManager
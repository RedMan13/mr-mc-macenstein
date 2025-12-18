const fs = require('fs/promises');
const path = require('path');

class Database {
    #path = '';
    #data = {};
    #needsWrite = false;
    constructor(dir) {
        this.#path = dir;
        this.#setupSaving();
    }
    async #setupSaving() {
        // ignore file errors, we will just create it when we need to
        const isReal = await fs.access(this.#path, fs.constants.W_OK | fs.constants.R_OK | fs.constants.F_OK).then(() => true).catch(() => false);
        if (isReal) console.log(`Reading database ${path.basename(this.#path)}`);
        const data = await fs.readFile(this.#path, 'utf8').catch(() => '{}');
        this.#data = Object.assign(JSON.parse(data), this.#data);
        setInterval(async () => {
            if (!this.#needsWrite) return;
            console.log(`saving ${path.basename(this.#path)}...`);
            await fs.mkdir(path.dirname(this.#path), { recursive: true }).catch(() => null);
            await fs.writeFile(this.#path, JSON.stringify(this.#data, null, '\t')).catch(() => null);
            this.#needsWrite = false;
            console.log(`Finished saving ${path.basename(this.#path)}`);
        }, 1000);
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
        const dir = path.resolve('./databases/user', id + '.json');
        if (!(dir in this.databases)) this.databases[dir] = new Database(dir);
        return this.databases[dir];
    }
    static channel(id) {
        const dir = path.resolve('./databases/channel', id + '.json');
        if (!(dir in this.databases)) this.databases[dir] = new Database(dir);
        return this.databases[dir];
    }
    static server(id) {
        const dir = path.resolve('./databases/server', id + '.json');
        if (!(dir in this.databases)) this.databases[dir] = new Database(dir);
        return this.databases[dir];
    }
    static global() {
        const dir = path.resolve('./databases/global.json');
        if (!(dir in this.databases)) this.databases[dir] = new Database(dir);
        return this.databases[dir];
    }
}

module.exports = DatabaseManager
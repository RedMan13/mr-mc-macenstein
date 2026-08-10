class Markov {
    divider = '';
    finisher = '';
    chances = {};
    chars = [];
    totalChances = 0;
    decider = char => (Math.random() * (char.total +1));

    constructor(decider, finisher) {
        if (decider) this.decider = decider;
        this.finisher = finisher;
    }
    feed(text, divider = this.divider) {
        this.divider = divider;
        const data = text.split(divider); 
        const pureChances = {};

        data.forEach((char, i) => {
            if (!char) return;
            char = char.toLowerCase();
            this.chances[char] ??= { chars: {}, total: 0 };
            pureChances[char] ??= 0;
            pureChances[char]++;
            if (data[i +1]) {
                const next = data[i +1].toLowerCase();
                this.chances[char].chars[next] ??= 0;
                this.chances[char].chars[next]++;
                this.chances[char].total++;
            }
        });

        for (const source in this.chances) {
            let acc = 0;
            for (const char in this.chances[source].chars) {
                acc += this.chances[source].chars[char];
                this.chances[source].chars[char] = acc;
            }
            this.chances[source].chars = Object.entries(this.chances[source].chars);
        }

        this.totalChances = 0;
        for (const char in pureChances) {
            this.totalChances += pureChances[char];
            pureChances[char] = this.totalChances;
        } 
        this.chars = Object.entries(pureChances);
    }

    makeStarter() {
        do {
            const pick = Math.floor(Math.random() * this.totalChances);
            const char = this.chars.find(v => pick <= v[1])?.[0];
            if (char && !char.endsWith(this.finisher)) return char;
        } while (true)
    }
    findNext(chunk) {
        if (!this.chances[chunk]) chunk = this.makeStarter();
        const pick = this.decider(this.chances[chunk]);
        if (pick < 0 || pick > this.chances[chunk].total) return '';
        return this.chances[chunk].chars.find(v => pick <= v[1])?.[0] ?? '';
    }
    generate(starter = this.makeStarter(), divider = this.divider) {
        let char = starter;
        let acc = char;
        while (!char.endsWith(this.finisher)) {
            if (char.includes('\n')) debugger;
            char = this.findNext(char);
            if (!char) break;
            acc += divider + char;
        }

        return acc;
    }
}

module.exports = Markov;
class Markov {
    divider = '';
    finisher = '';
    chances = Object.create(null);
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

        data.forEach((char, i) => {
            if (!char) return;
            this.totalChances++
            char = char.toLowerCase();
            this.chances[char] ??= { chars: Object.create(null), total: 0 };
            this.chars[char] ??= 0;
            this.chars[char]++;
            if (data[i +1]) {
                const next = data[i +1].toLowerCase();
                this.chances[char].chars[next] ??= 0;
                this.chances[char].chars[next]++;
                this.chances[char].total++;
            }
        });
    }
    findWord(word) {
        word = word.toLowerCase();
        if (!this.chances[word]) {
            let proximity = Infinity;
            let best;
            for (const char in this.chars) {
                if (!char.includes(word)) continue;
                if ((char.length - word.length) > proximity) continue;
                proximity = char.length - word.length;
                best = char;
            }
            if (!best) return;
            word = best;
        }
        return word;
    }

    makeStarter() {
        do {
            const pick = Math.floor(Math.random() * this.totalChances);
            let level = 0;
            for (const char in this.chars) {
                level += this.chars[char];
                if (!char || char.endsWith(this.finisher)) continue;
                if (pick < level) return char;
            }
        } while (true)
    }
    findNext(chunk, canEnd) { 
        const pick = this.decider(this.chances[chunk]);
        if (pick < 0 || pick > this.chances[chunk].total) return '\n';

        let level = 0;
        for (const char in this.chances[chunk].chars) {
            level += this.chances[chunk].chars[char];
            if (!canEnd && char.endsWith(this.finisher)) continue;
            if (pick < level) return char;
        }
        return '\n';
    }
    generate(starter, minimum = 20, divider = this.divider) {
        let failedToFind = false;
        if (starter) {
            starter = this.findWord(starter);
            if (!starter) failedToFind = true;
        }
        if (!starter) starter = this.makeStarter();
        let char = starter;
        let acc = char;
        let count = 0;
        while ((!char.endsWith(this.finisher) && count < 1000)) {
            char = this.findNext(char, count >= minimum);
            if (!this.chances[char]) break;
            acc += divider + char;
            count++;
        }
        if (failedToFind) acc += '\n-# The provided starting chunk could not be found!';

        return acc;
    }
}

module.exports = Markov;

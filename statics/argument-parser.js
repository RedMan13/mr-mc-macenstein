function clean(str) {
    return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}
/** @typedef {{ [key: string]: [string[], { noValue?: boolean, repeatable?: boolean, match?: RegExp, needs?: string[], default?: any }, string] }} CLIArguments */
/**
 * Parses the cli arguments
 * @param {string[]} argv 
 * @param {CLIArguments} keys 
 * @returns {{ [key: string]: any }}
 */
module.exports = function parseArgs(argv, keys) {
    const props = Object.fromEntries(Object.entries(keys).map(([k,v]) => [k,v[1]]));
    const lookup = { '?': 'help', 'help': 'help' };
    for (const [k,v] of Object.entries(keys)) {
        for (const varient of v[0]) {
            lookup[clean(varient)] = k;
        }
        lookup[k] = k;
    }

    const args = Object.entries(keys)
        .reduce((cur, [k,v]) => (cur[k] = v[1].default || (v[1].repeatable && []), cur), {});
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const keys = arg[0] === '-'
            ? arg[1] === '-'
                ? [lookup[arg.slice(2)]]
                : [...arg.slice(1)].map(v => lookup[v])
            : [lookup['default'] ?? 'default'];
        let needsAdvance = false;
        for (const key of keys) {
            if (key === 'default') continue;
            if (!props[key]) return `Argument ${arg} does not exist`;
            const hasValue = !props[key].noValue && ((arg[0] === '-' && (argv[i +1]?.[0] ?? '-') !== '-') || key === 'default' || key === lookup['default']);
            needsAdvance ||= arg[0] === '-' && hasValue;
            if (hasValue && props[key].match && !props[key].match.test(argv[i +1])) return `Inputs for ${key} must conform to \`${props[key].match}\``;
            const value = !hasValue ? true : arg[0] !== '-' ? argv[i] : argv[i +1];
            if (props[key].repeatable) args[key].push(value);
            else args[key] = value;
        }
        if (needsAdvance) i++;
    }
    return args;
}
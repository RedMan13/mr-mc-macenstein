const Markov = require('../statics/markovinator.js');
const escape = require('regexp.escape'); // gross
const { JSDOM } = require('jsdom');
const puppeteer = require('puppeteer');
const { MessageFlags } = require('discord.js');

function fetchLikeThat(url) {
    return fetch(url, {
        "credentials": "include",
        "headers": {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Priority": "u=0, i",
            "Alt-Used": "0"
        },
        "method": "GET",
        "mode": "cors"
    }).then(req => req.bytes())
        .catch(e => `Oops!! <a href="/">${e}</a> OOps`);
}
/** @type {puppeteer.Browser} */
let browser;
// chunks are divided by one of
// a new line (without removing the newline)
// a none-spoken character followed by a spoken character (without removing either)
// the following is `|(?<=[^a-z0-9 ])(?=[a-z0-9])|(?<=[^a-z0-9])(?= )` and was removed to make the bot more literate
// a spoken character (including space) followed by a none-spoken character (without removing either)
// a none-spoken character followed by a space (without removing either)
const delimiter = /(?<=\n)|(?<=[a-z0-9])(?=[^a-z0-9])/gi;
/** @type {import('../index.js').CommandDefinition} */
module.exports = {
    name: 'search',
    alias: ['lookup', 'what-is'],
    category: 'markov',
    sDesc: 'Searches the internet for some term.',
    lDesc: 'Looks up something with bing, then rewords it using markov.',
    work: 'any',
    args: [
        {
            type: 'string',
            name: 'search',
            required: true,
            desc: 'What to lookup.'
        }
    ],
    /**
     * @param {import('discord.js').Message} message
     */
    execute: async (message) => {
        browser ??= await puppeteer.launch();

        let searchSpecific = message.arguments.search.split(delimiter);
        const lastChunk = searchSpecific.at(-1).trim()
        searchSpecific[searchSpecific.length -1] = ` "${lastChunk}"`;
        searchSpecific = searchSpecific.join('');
        console.log('Looking up `', searchSpecific, '`');
        const page = await browser.newPage();
        await page.setViewport({ width: 480, height: 360, deviceScaleFactor: 1 });
        await page.goto(`https://www.bing.com/search?q=${encodeURI(searchSpecific)}`);
        await Promise.all([
            page.waitForNavigation(),
            page.click('li h2 a'),
        ]);
        console.log('Landed at', page.url());
        const parsed = new JSDOM(await page.content());
        await page.close();

        const markov = new Markov(null, '\n');
        markov.censorRules = (await message.guild.autoModerationRules.fetch())
            .map(autorule => [
                autorule.triggerMetadata.keywordFilter
                    .map(word => ({ exception: false, match: new RegExp(escape(word), 'i') })),
                autorule.triggerMetadata.allowList
                    .map(word => ({ exception: true, match: new RegExp(escape(word), 'i') })),
                autorule.triggerMetadata.regexPatterns
                    .map(regex => ({ exception: false, match: new RegExp(regex.replace(/\(\?[a-z]+\)/ig, ''), 'imgs')}))
            ]).flat(3);
        let text = '';
        const possibleTextEls = parsed.window.document.querySelectorAll('*:not(script,style)');
        possibleTextEls.forEach(el => {
            el.childNodes.forEach(child => {
                if (child.nodeType !== 3 && child.nodeType !== 4) return;
                text += ' ' + child.textContent;
            });
        })
        markov.feed(text, delimiter);

        message.reply({
            content: markov.generate(lastChunk, 3, '').slice(0, 2000),
            flags: [MessageFlags.SuppressEmbeds],
            allowedMentions: {
                parse: [],
                roles: [],
                users: [],
                repliedUser: true
            }
        })
    },
};

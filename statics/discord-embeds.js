const { Tokenizer, CJSHelpers: { jumpArbit } } = require('builder');

function isUppercase(tag) {
    return 'QWERTYUIOPASDFGHJKLZXCVBNM'.includes(tag[0]);
}
/**
 * @typedef {Object} JSXStartToken
 * @extends {PrecompToken}
 * @property {string} tagname
 * 
 * @typedef {Object} JSXAttributeToken
 * @extends {PrecompToken}
 * @property {string} key
 * @property {string?} value
 * 
 * @typedef {Object} JSXAttributeCloseToken
 * @extends {PrecompToken}
 * 
 * @typedef {Object} JSXEndToken
 * @extends {PrecompToken}
 * @property {string?} tagname
 * 
 * @typedef {[JSXStartToken, ...JSXAttributeToken, JSXAttributeCloseToken, JSXElementToken[], JSXEndToken]} JSXElementToken
 * @param {JSXElementToken[]} tokens 
 */
function parseTokens(tokens, text) {
    const output = [];
    for (const batch of tokens) {
        const end = batch.at(-1);
        const isShorthand = end.name === 'close' || !end.tagname
        const start = batch[0];
        if (end.tagname && end.tagname !== start.tagname && end.namespace !== start.namespace)
            throw new SyntaxError(`XML End must equal XML Start (${start.namespace}:${start.tagname} !== ${end.namespace}:${end.tagname})`);
        const attributes = isShorthand 
            ? batch.slice(1, -2)
            : batch.slice(1, -3);
        const children = [''];
        if (!isShorthand) { 
            const elements = parseTokens(batch.at(-2), text);
            const mid = batch.find(tok => tok.name === 'close');
            let inside = 0;
            if (mid)
            for (let i = mid.end; i < end.start; i++) {
                const el = elements.find(tok => i >= tok.start && i < tok.end);
                if (el) {
                    if (inside && !Array.isArray(children.at(-1)))
                        inside = 0;
                    if (inside) children.at(-1).push(el, '');
                    else children.push(el, '')
                    i = el.end -1;
                    continue;
                }
                if (text[i] === '{') {
                    if (inside <= 0) children.push(['']);
                    inside++;
                    if (inside <= 1) continue;
                }
                if (text[i] === '}') {
                    inside--;
                    if (inside <= 0) children.push('');
                    if (inside <= 0) continue;
                }
                if (inside > 0) {
                    const jmp = jumpArbit(text.slice(i));
                    const js = children.at(-1);
                    if (jmp) {
                        js[js.length -1] += text.slice(i, jmp +i);
                        i += jmp -1;
                        continue;
                    }
                    js[js.length -1] += text[i];
                    continue;
                }
                children[children.length -1] += text[i];
            }
        }

        const isCustom = isUppercase(start.tagname[0]);
        output.push({
            tagname: start.tagname,
            namespace: start.namespace,
            isCustom,
            isEmpty: attributes.length <= 0 && children.filter(Boolean).length <= 0,
            attributes: attributes.map(({ key, value, namespace }) => [key, value, namespace]),
            children: children.map(str => str?.trim?.() ?? str).filter(Boolean),
            start: start.start,
            end: end.end
        });
    }
    return output;
}

function expectChildText(children) {
    let out = '`';
    for (const child of children) {
        if (typeof child === 'string') { out += JSON.stringify(child).slice(1, -1).replaceAll('`', '\\`'); continue; }
        if (!Array.isArray(child)) throw new TypeError('Children can only be text here!');
        out += '${';
        for (const part of child) {
            if (typeof part !== 'string') throw new TypeError('Children can only be text hete!');
            out += part;
        }
        out += '}';
    }
    return out + '`';
}
function expectChildElements(children) {
    let out = '[].concat(';
    for (const child of children) {
        if (typeof child === 'string') continue;
        if (Array.isArray(child)) {
            for (const part of child) {
                if (typeof part === 'string') { out += part; continue; }
                out += makeJSON(part);
            }
            out += ').concat(';
            continue;
        }
        out += makeJSON(child) + ').concat(';
    }
    return `${out}).filter(Boolean)`;
}

function makeJSON(token) {
    if (typeof token === 'string') return;
    token.attributes = token.attributes.map(attr => [attr[0], attr[1] && (attr[1][0] === '{' ? attr[1].slice(1, -1) : attr[1])]);
    switch (token.tagname) {
    case 'embed': break;
    case 'modal': {
        const customId = token.attributes.find(attr => attr[0] === 'id' || attr[0] === 'custom-id' || attr[0] === 'sku-id');
        if (!customId) throw new SyntaxError('Modals inputs must have custom ids');
        const label = token.attributes.find(attr => attr[0] === 'title' || attr[0] === 'label');
        return `{
            custom_id: ${customId[1]},
            title: ${label?.[1]},
            components: ${expectChildElements(token.children)}
        }`
    }
    case 'label': {
        const label = token.attributes.find(attr => attr[0] === 'title' || attr[0] === 'label');
        const desc = token.attributes.find(attr => attr[0] === 'description');
        return `{
            type: 18,
            label: ${label?.[1]},
            description: ${desc?.[1]},
            component: ${expectChildElements(token.children)}.at(0)
        }`
    }
    case 'text-input': {
        const customId = token.attributes.find(attr => attr[0] === 'id' || attr[0] === 'custom-id' || attr[0] === 'sku-id');
        if (!customId) throw new SyntaxError('Text inputs must have custom ids');
        const placeholder = token.attributes.find(attr => attr[0] === 'placeholder');
        const min = token.attributes.find(attr => attr[0] === 'min' || attr[0] === 'min-length');
        const max = token.attributes.find(attr => attr[0] === 'max' || attr[0] === 'max-length');
        const required = token.attributes.some(attr => attr[0] === 'required');
        return `{
            type: 4,
            custom_id: ${customId[1]},
            style: ${token.attributes.some(attr => attr[0] === 'paragraph' || attr[0] === 'long') +1},
            placeholder: ${placeholder?.[1]},
            value: ${expectChildText(token.children)},
            min_length: ${min?.[1]},
            max_length: ${max?.[1]},
            required: ${required?.[1]}
        }`;
    }
    case 'file-input':
    case 'file-upload': {
        const customId = token.attributes.find(attr => attr[0] === 'id' || attr[0] === 'custom-id' || attr[0] === 'sku-id');
        if (!customId) throw new SyntaxError('File inputs must have custom ids');
        const fileTypes = token.attributes.find(attr => attr[0] === 'types');
        const min = token.attributes.find(attr => attr[0] === 'min' || attr[0] === 'min-values');
        const max = token.attributes.find(attr => attr[0] === 'max' || attr[0] === 'max-values');
        const required = token.attributes.some(attr => attr[0] === 'required');
        if (required && min && min[1] < 1) throw new SyntaxError('The minimum select count must be greater then zero if required!');
        return `{
            type: 19,
            file_types: ${fileTypes?.[1]},
            custom_id: ${customId[1]},
            min_values: ${min?.[1]},
            max_values: ${max?.[1]}, 
            required: ${required}
        }`
    }
    case 'radio-group':
    case 'radio': {
        const customId = token.attributes.find(attr => attr[0] === 'id' || attr[0] === 'custom-id' || attr[0] === 'sku-id');
        if (!customId) throw new SyntaxError('Radios must have custom ids');
        const required = token.attributes.some(attr => attr[0] === 'required');
        return `{
            type: 19,
            options: ${expectChildElements(token.children)},
            custom_id: ${customId[1]},
            required: ${required}
        }`
    }
    case 'checkbox-group': {
        const customId = token.attributes.find(attr => attr[0] === 'id' || attr[0] === 'custom-id' || attr[0] === 'sku-id');
        if (!customId) throw new SyntaxError('Checkboxes must have custom ids');
        const min = token.attributes.find(attr => attr[0] === 'min' || attr[0] === 'min-values');
        const max = token.attributes.find(attr => attr[0] === 'max' || attr[0] === 'max-values');
        const required = token.attributes.some(attr => attr[0] === 'required');
        if (required && min && min[1] < 1) throw new SyntaxError('The minimum select count must be greater then zero if required!');
        return `{
            type: 22,
            options: ${expectChildElements(token.children)},
            custom_id: ${customId[1]},
            min_values: ${min?.[1]},
            max_values: ${max?.[1]}, 
            required: ${required}
        }`
    }
    case 'checkbox': {
        const customId = token.attributes.find(attr => attr[0] === 'id' || attr[0] === 'custom-id' || attr[0] === 'sku-id');
        if (!customId) throw new SyntaxError('Checkboxes must have custom ids');
        const value = token.attributes.find(attr => attr[0] === 'default' || attr[0] === 'checked' || attr[0] === 'value');
        return `{
            type: 23,
            custom_id: ${customId[1]},
            default: ${value?.[1] ?? true}
        }`
    }
    case 'container': {
        const color = token.attributes.find(attr => attr[0] === 'color' || attr[0] === 'accent');
        return `{
            type: 17,
            components: ${expectChildElements(token.children)},
            accent_color: ${color?.[1]},
            spoiler: ${token.attributes.some(attr => attr[0] === 'spoiler')}
        }`;
    }
    case 'text-display':
    case 'text':
        return `{ type: 10, content: ${expectChildText(token.children)} }`;
    case 'seperator':
        return `{
            type: 14,
            divider: ${token.attributes.some(attr => attr[0] === 'solid')},
            spacing: ${token.attributes.some(attr => attr[0] === 'large') +1}
        }`;
    case 'media-gallery':
    case 'media':
        return `{ type: 12, items: ${expectChildElements(token.children)} }`;
    case 'audio':
    case 'video':
    case 'image':
    case 'img': {
        const url = token.attributes.find(attr => attr[0] === 'src' || attr[0] === 'url' || attr[0] === 'source');
        if (!url) throw new SyntaxError('Media url is not optional!');
        const desc = token.attributes.find(attr => attr[0] === 'title' || attr[0] === 'description');
        return `{
            media: { url: ${url[1]} },
            description: ${desc?.[1]},
            spoiler: ${token.attributes.some(attr => attr[0] === 'spoiler')}
        }`;
    }
    case 'section': {
        return `(() => {
            const components = ${expectChildElements(token.children)};
            const accessory = components.pop();
            return { type: 9, components, accessory }
        })()`;
    }
    case 'thumbnail': {
        const url = token.attributes.find(attr => attr[0] === 'src' || attr[0] === 'url' || attr[0] === 'source');
        if (!url) throw new SyntaxError('Media url is not optional!');
        const desc = token.attributes.find(attr => attr[0] === 'title' || attr[0] === 'description');
        return `{
            type: 11,
            media: { url: ${url[1]} },
            description: ${desc?.[1]},
            spoiler: ${token.attributes.some(attr => attr[0] === 'spoiler')}
        }`;
    }
    case 'action-row':
    case 'row': {
        return `{ type: 1, components: ${expectChildElements(token.children)} }`;
    }
    case 'button': {
        const style = token.attributes.find(attr => attr[0] === 'style');
        if (!style) throw new SyntaxError('Buttons must include a style!');
        const emoji = token.attributes.find(attr => attr[0] === 'emoji');
        const customId = token.attributes.find(attr => attr[0] === 'id' || attr[0] === 'custom-id' || attr[0] === 'sku-id');
        if (customId && style[1] === 'link')
            throw new SyntaxError('Link buttons can not have custom ids');
        if (!customId && style[1] !== 'link')
            throw new SyntaxError('None-link buttons must have custom ids');
        const url = token.attributes.find(attr => attr[0] === 'url');
        if (url && style[1] !== 'link')
            throw new SyntaxError('Only link buttons are allowed to have links')
        return `{
            type: 2,
            style: ${style[1]},
            label: ${expectChildText(token.children)},
            emoji: ${emoji?.[1]},
            custom_id: ${style[1] !== 'premium' ? customId?.[1] : undefined},
            sku_id: ${style[1] === 'premium' ? customId?.[1] : undefined},
            url: ${url?.[1]},
            disabled: ${token.attributes.some(attr => attr[0] === 'disabled')}
        }`;
    }
    case 'option': {
        const customId = token.attributes.find(attr => attr[0] === 'id' || attr[0] === 'value');
        if (!customId[1]) throw new SyntaxError('Selection options must have values!');
        const desc = token.attributes.find(attr => attr[0] === 'title' || attr[0] === 'description');
        const emoji = token.attributes.find(attr => attr[0] === 'emoji');
        const defaultKey = token.attributes.find(attr => attr[0] === 'default');

        return `{
            label: ${expectChildText(token.children)},
            value: ${customId[1]},
            description: ${desc?.[1]},
            emoji: ${emoji?.[1]},
            default: ${defaultKey?.[1] || !!defaultKey}
        }`
    }
    case 'channel':
    case 'role':
    case 'user': {
        const id = token.attributes.find(attr => attr[0] === 'id' || attr[0] === 'value');
        return `{ type: ${JSON.stringify(token.tagname)}, id: ${id[1]} }`
    }
    case 'user': return { type: 'user', id: token.children.join(' ') }
    case 'role': return { type: 'role', id: token.children.join(' ') }
    case 'channel': return { type: 'channel', id: token.children.join(' ') }

    case 'string-select':
    case 'user-select':
    case 'role-select':
    case 'channel-select':
    case 'mentionable-select':
        const options = expectChildElements(token.children);
        const customId = token.attributes.find(attr => attr[0] === 'id' || attr[0] === 'custom-id' || attr[0] === 'sku-id');
        if (!customId) throw new SyntaxError('Selectors must have custom ids');
        const channelTypes = token.attributes.find(attr => attr[0] === 'types');
        const placeholder = token.attributes.find(attr => attr[0] === 'placeholder');
        const min = token.attributes.find(attr => attr[0] === 'min' || attr[0] === 'min-values');
        const max = token.attributes.find(attr => attr[0] === 'max' || attr[0] === 'max-values');
        const required = token.attributes.some(attr => attr[0] === 'required');
        if (required && min && min[1] < 1) throw new SyntaxError('The minimum select count must be greater then zero if required!');
        return `{
            type: ${{ 'string-select': 3, 'user-select': 5, 'role-select': 6, 'mentionable-select': 7, 'channel-select': 8 }[token.tagname]},
            options: ${token.tagname === 'string-select' ? options : undefined},
            default_values: ${token.tagname !== 'string-select' ? options : undefined},
            channel_types: ${channelTypes?.[1]},
            custom_id: ${customId[1]},
            placeholder: ${placeholder?.[1]},
            min_values: ${min?.[1]},
            max_values: ${max?.[1]}, 
            required: ${required},
            disabled: ${token.attributes.some(attr => attr[0] === 'disabled')}
        }`
    }
}

global.nostd = true;
module.exports = function(text) {
    const tok = new Tokenizer(text, {
        end: /^(\/>|<\/(?:(?<namespace>[a-z$_][a-z$_0-9-]*):)?(?<tagname>[a-z$_][a-z$_0-9-]*\s*)>)/i,
        _(str) {
            const jmp = jumpArbit(str);
            return jmp ? { length: jmp } : null;
        },
        start: /^<(?:(?<namespace>[a-z$_][a-z$_0-9-]*):)?(?<tagname>[a-z$_][a-z$_0-9-]*)\s*/i,
        attributes(str) {
            for (let i = this.matches.length -1; i >= -1; i--) {
                if (this.matches[i]?.name === '_') continue;
                if (this.matches[i]?.name === 'attributes') break;
                if (this.matches[i]?.name === 'start') break;
                return;
            }
            const name = str.match(/^(?:([a-z$_][a-z$_0-9-]*):)?([a-z$_][a-z$_0-9\-]*)\s*/i);
            if (!name) return;
            const split = name[0].length;
            if (str[split] !== '=') return { key: name[2], namespace: name[1], length: name[2].length };
            const val = str.slice(split +1).trimStart();
            if (val[0] === '"' || val[0] === "'") {
                const value = str.slice(split +1).match(/\s*('([^']|\\')*'|"([^"]|\\")*")/i);
                return {
                    key: name[2],
                    namespace: name[1],
                    value: value[1],
                    length: split + value[0].length +1
                }
            }
            if (val[0] !== '{') return;
            let indent = 0;
            for (let i = 0; i < val.length; i++) {
                const jmp = jumpArbit(val.slice(i));
                if (jmp) {
                    i += jmp -1;
                    continue;
                }
                if (val[i] === '{') indent++;
                if (val[i] === '}') indent--;
                if (indent <= 0)
                    return {
                        key: name[2],
                        namespace: name[1],
                        value: val.slice(0, i +1),
                        length: i + split + (str.slice(split -1).length - val.length)
                    }
            }
        },
        close: /^>/
    });
    const tokens = tok.getGroups(['start', '*attributes', '?close', '^', 'end']);

    let off = 0;
    for (const usage of parseTokens(tokens, text)) {
        const json = makeJSON(usage);
        text = `${text.slice(0, usage.start + off)}${json}${text.slice(usage.end + off)}`;
        off += json.length - (usage.end - usage.start)
    }

    return text;
}
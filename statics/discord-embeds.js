const { Tokenizer, CJSHelpers: { jumpArbit } } = require('builder');

function unescapeXML(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/&([a-z0-9]+);/gi, (_, name) => {
        switch (name) {
        case 'lt': return '<';
        case 'gt': return '>';
        case 'amp': return '&';
        case 'apos': return '\'';
        case 'quot': return '\\"';
        default:
            if (!name[0] === '#') return _;
            if (name[1] === 'x') return String.fromCodePoint(parseInt(name.slice(2), 16));
            return String.fromCodePoint(parseInt(name.slice(1)));
        }
    })
}
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
function parseTokens(tokens, text, js) {
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
            let lineStart = true;
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
                if (js) {
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
                if (!lineStart || !/\s/.test(text[i])) {
                    lineStart = text[i] === '\n';
                    children[children.length -1] += text[i];
                }
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

function expectChildText(children, pure) {
    let out = '"';
    for (const child of children) {
        if (typeof child === 'string') { out += JSON.stringify(unescapeXML(child)).slice(1, -1).replaceAll(',', '\\,'); continue; }
        if (!Array.isArray(child) || pure) throw new TypeError('Children can only be text here!');
        out += '" + (';
        for (const part of child) {
            if (typeof part !== 'string') throw new TypeError('Children can only be text here!');
            out += part;
        }
        out += ') + "';
    }
    return out + '"';
}
function expectChildElements(children, maximum, pure) {
    maximum = Math.min(maximum ?? Infinity, children.length);
    let out = pure ? '[' : '[].concat(';
    for (let i = 0; i < maximum; i++) {
        const child = children[i];
        if (typeof child === 'string') continue;
        if (Array.isArray(child)) {
            if (pure) continue;
            for (const part of child) {
                if (typeof part === 'string') { out += part; continue; }
                out += makeJSON(part, pure);
            }
            out += ').concat(';
            continue;
        }
        out += makeJSON(child, pure) + (pure ? ', ' : ').concat(');
    }
    return pure ? `${out.includes(', ') ? out.slice(0, -2) : out}]` : `${out}).filter(Boolean)`;
}
function expectString(attributes, names, pure) {
    const attribute = attributes.find(attr => names.includes(attr[0]))?.[1];
    if (typeof attribute === 'undefined') return;
    if (pure) return unescapeXML(attribute[0] === '"' ? attribute : `"${attribute.slice(1,-1).replace(/(?<!\\)"/g, '\\"')}"`);
    return attribute.startsWith('{') ? attribute.slice(1, -1) : unescapeXML(attribute);
}
function expectNumber(attributes, names, pure) {
    const attribute = attributes.find(attr => names.includes(attr[0]))?.[1];
    if (typeof attribute === 'undefined') return;
    if (pure || /^['"]/.test(attribute)) return Number(unescapeXML(attribute.slice(1,-1)));
    return `Number(${attribute.startsWith('{') ? attribute.slice(1, -1) : unescapeXML(attribute)})`;
}
function expectBoolean(attributes, names, pure) {
    const attribute = attributes.find(attr => names.includes(attr[0]))?.[1];
    if (typeof attribute === 'undefined') return false;
    if (pure || /^['"]/.test(attribute)) return unescapeXML(attribute.slice(1, -1)).toLowerCase() !== 'false';
    return attribute.startsWith('{') ? attribute.slice(1, -1) : unescapeXML(attribute);
}

function makeJSON(token, pure) {
    if (typeof token === 'string') return;
    switch (token.tagname) {
    case 'components': return `${expectChildElements(token.children, null, pure)}`
    case 'embed': break;
    case 'modal': 
        return `{
            "custom_id": ${expectString(token.attributes, ['id', 'custom-id'], pure)},
            "title": ${expectString(token.attributes, ['title', 'label'], pure)},
            "components": ${expectChildElements(token.children, null, pure)}
        }`;
    case 'label': 
        return `{
            "type": 18,
            "label": ${expectString(token.attributes, ['label'], pure)},
            "description": ${expectString(token.attributes, ['description', 'title'], pure)},
            "component": ${expectChildElements(token.children, 1, pure)}
        }`;
    case 'text-input': {
        const paragraph = pure
            ? expectBoolean(token.attributes, ['paragraph', 'long'], pure) +1
            : `(${expectBoolean(token.attributes, ['paragraph', 'long'], pure)}) +1`;
        return `{
            "type": 4,
            "custom_id": ${expectString(token.attributes, ['id', 'custom-id'], pure)},
            "style": ${paragraph},
            "placeholder": ${expectString(token.attributes, ['placeholder'], pure)},
            "value": ${expectChildText(token.children, pure)},
            "min_length": ${expectString(token.attributes, ['min', 'min-length'], pure)},
            "max_length": ${expectString(token.attributes, ['max', 'max-length'], pure)},
            "required": ${expectBoolean(token.attributes, ['required'], pure)}
        }`;
    }
    case 'file-input':
    case 'file-upload': 
        return `{
            "type": 19,
            "file_types": ${expectString(token.attributes, ['types'], pure)},
            "custom_id": ${expectString(token.attributes, ['id', 'custom-id'], pure)},
            "min_values": ${expectString(token.attributes, ['min', 'min-values'], pure)},
            "max_values": ${expectString(token.attributes, ['max', 'max-values'], pure)}, 
            "required": ${expectBoolean(token.attributes, ['required'], pure)}
        }`;
    case 'radio-group':
    case 'radio': 
        return `{
            "type": 19,
            "options": ${expectChildElements(token.children, null, pure)},
            "custom_id": ${expectString(token.attributes, ['id', 'custom-id'], pure)},
            "required": ${expectBoolean(token.attributes, ['required'], pure)}
        }`;
    case 'checkbox-group': 
        return `{
            "type": 22,
            "options": ${expectChildElements(token.children, null, pure)},
            "custom_id": ${expectString(token.attributes, ['id', 'custom-id'], pure)},
            "min_values": ${expectNumber(token.attributes, ['min', 'min-values'], pure)},
            "max_values": ${expectNumber(token.attributes, ['max', 'max-values'], pure)}, 
            "required": ${expectBoolean(token.attributes, ['required'], pure)}
        }`;
    case 'checkbox': 
        return `{
            "type": 23,
            "custom_id": ${expectString(token.attributes, ['id', 'custom-id'], pure)},
            "required": ${expectBoolean(token.attributes, ['required'], pure)}
        }`;
    case 'container': 
        return `{
            "type": 17,
            "components": ${expectChildElements(token.children, null, pure)},
            "accent_color": ${expectNumber(token.attributes, ['color', 'accent'], pure)},
            "spoiler": ${expectBoolean(token.attributes, ['spoiler'], pure)}
        }`;
    case 'text-display':
    case 'text':
        return `{ "type": 10, "content": ${expectChildText(token.children, pure)} }`;
    case 'seperator': {
        const large = pure
            ? expectBoolean(token.attributes, ['large'], pure) +1
            : `(${expectBoolean(token.attributes, ['large'], pure)}) +1`;
        return `{
            "type": 14,
            "divider": ${expectBoolean(token.attributes, ['solid'], pure)},
            "spacing": ${large}
        }`;
    }
    case 'media-gallery':
    case 'media':
        return `{ "type": 12, "items": ${expectChildElements(token.children, null, pure)} }`;
    // case 'audio': // audio isnt a valid media item, for some fucking reason
    case 'video':
    case 'image':
    case 'img': 
        return `{
            "media": { "url": ${expectString(token.attributes, ['src', 'url', 'source'], pure)} },
            "description": ${expectString(token.attributes, ['title', 'description'], pure)},
            "spoiler": ${expectBoolean(token.attributes, ['spoiler'], pure)}
        }`;
    case 'section': {
        const children = expectChildElements(token.children, null, pure);
        const split = children.lastIndexOf('}, {');
        return pure 
            ? `{
                "type": 9,
                "components": ${children.slice(0, split +1)}],
                "accessory": [${children.slice(split +3)}
            }`
            : `(() => {
                const components = ${children};
                const accessory = components.pop();
                return { type: 9, components, accessory }
            })()`;
    }
    case 'thumbnail': 
        return `{
            "type": 11,
            "media": { "url": ${expectString(token.attributes, ['src', 'url', 'source'], pure)} },
            "description": ${expectString(token.attributes, ['title', 'description'], pure)},
            "spoiler": ${expectBoolean(token.attributes, ['spoiler'], pure)}
        }`;
    case 'action-row':
    case 'row': 
        return `{ "type": 1, "components": ${expectChildElements(token.children, null, pure)} }`;
    case 'button': {
        const style = expectString(token.attributes, ['style'], pure);
        const customId = expectString(token.attributes, ['id', 'custom-id', 'sku-id'], pure);
        return `{
            "type": 2,
            "style": ${style},
            "label": ${expectChildText(token.children, pure)},
            "emoji": ${expectString(token.attributes, ['emoji'], pure)},
            "custom_id": ${style !== 'premium' ? customId : undefined},
            "sku_id": ${style === 'premium' ? customId : undefined},
            "url": ${expectString(token.attributes, ['url'], pure)},
            "disabled": ${expectBoolean(token.attributes, ['disabled'], pure)}
        }`;
    }
    case 'option': 
        return `{
            "label": ${expectChildText(token.children, pure)},
            "value": ${expectString(token.attributes, ['id', 'value'], pure)},
            "description": ${expectString(token.attributes, ['title', 'description'], pure)},
            "emoji": ${expectString(token.attributes, ['emoji'], pure)},
            "default": ${expectBoolean(token.attributes, ['default'], pure)}
        }`;
    case 'channel':
    case 'role':
    case 'user': 
        return `{ "type": ${JSON.stringify(token.tagname)}, "id": ${expectString(token.attributes, ['id', 'value'], pure)} }`;

    case 'string-select':
    case 'user-select':
    case 'role-select':
    case 'channel-select':
    case 'mentionable-select':
        const options = expectChildElements(token.children, null, pure);
        return `{
            "type": ${{ 'string-select': 3, 'user-select': 5, 'role-select': 6, 'mentionable-select': 7, 'channel-select': 8 }[token.tagname]},
            "options": ${token.tagname === 'string-select' ? options : undefined},
            "default_values": ${token.tagname !== 'string-select' ? options : undefined},
            "channel_types": ${pure ? expectString(token.attributes, ['types'], pure).split(',') : expectString(token.attributes, ['types'], pure)},
            "custom_id": ${expectString(token.attributes, ['id', 'custom-id'], pure)},
            "placeholder": ${expectString(token.attributes, ['placeholder'], pure)},
            "min_values": ${expectNumber(token.attributes, ['min', 'min-values'], pure)},
            "max_values": ${expectNumber(token.attributes, ['max', 'max-values'], pure)}, 
            "required": ${expectBoolean(token.attributes, ['required'], pure)},
            "disabled": ${expectBoolean(token.attributes, ['disabled'], pure)}
        }`
    }
}

global.nostd = true;
module.exports = function(text, pure = false) {
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
    for (const usage of parseTokens(tokens, text, !pure)) {
        const json = makeJSON(usage, pure);
        text = `${text.slice(0, usage.start + off)}${json}${text.slice(usage.end + off)}`;
        off += json.length - (usage.end - usage.start)
    }

    return text;
}
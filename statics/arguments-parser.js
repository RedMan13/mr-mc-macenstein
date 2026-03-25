/**
 * Parses incoming arguments into a key:value format
 * @param {import('discord.js').Message} message The message to get argument content from
 * @param {Array<Object>} args The argument mapping
 * @param {boolean} slash If the request is in a slash command
 * @returns {Object|string}
 */
module.exports = async (message, args, slash) => {
    const result = {}
    if (slash) {
        for (let argIndex = 0; argIndex < args.length; argIndex++) {
            result[args.name] = message.options.get(args.name)
        }
        return result
    }
    
    if (args.length <= 0) return result;
    if (args.length === 1 && args[0].type === 'string') {
        result[args[0].name] = message.args;
        return result;
    }
    const messageSplit = message.args.split(' ')
    let isInString = 0
    for (let argIndex = 0; argIndex < args.length; argIndex++) {
        const arg = isInString 
            ? args[isInString] 
            : args[argIndex]
        const name = arg.name
        // end of the arguments
        if (typeof messageSplit[argIndex] !== 'string') break;
        const argContent = String(messageSplit[argIndex]);
        if (!argContent && arg.required) return `The argument "${name}" is required` 
        switch (arg.type) {
        case 'string':
            let valid = true
            const left = arg.lBraket || '"';
            const right = arg.rBraket || '"';
            if (!argContent.startsWith(left) && !isInString) valid = false
            if (!argContent.endsWith(right) && argIndex === args.length-1) valid = false
            if (argContent.startsWith(left) && !isInString) isInString = argIndex
            if (argContent.endsWith(right)) {
                result[name] = messageSplit.slice(isInString, argIndex+1).join(' ')
                messageSplit.splice(isInString, argIndex - isInString)
                argIndex = isInString
                isInString = 0
            }
            if (!valid) {
                return `The argument "${name}" has to be wraped in ${left}${right} and must have whitespace before and after`
            }
            break;
        case 'number':
            const number = Number(argContent)
            if (isNaN(number)) return `The argument "${name}" has to be a number` 
            result[name] = Math.min(Math.max(number, arg.min ?? -Infinity), arg.max ?? Infinity)
            break;
        case 'any':
            result[name] = argContent;
            break;
        case 'member':
            let member = argContent
            member = member.match(/(?:<@!?)?([0-9]+)>?/i);
            member = await message.guild.members.fetch(member[1]).catch(err => console.warn(err));
            if (!member) return `The argument "${name}" has to be a real member`;
            result[name] = member;
            break;
        case 'channel':
            let channel = argContent
            channel = channel.match(/(?:<#)?([0-9]+)>?/i);
            channel = await imports.client.channels.fetch(channel).catch(err => console.warn(err));
            if (!channel) return `The argument "${name}" has to be a real channel`;
            result[name] = channel;
            break;
        case 'role':
            let role = argContent
            role = role.match(/(?:<@&)?([0-9]+)>?/i);
            role = await message.guild.roles.fetch(role).catch(err => console.warn(err));
            if (!role) return `The argument "${name}" has to be a real role`
            result[name] = role;
            break;
        }
    }
    return result
}
module.exports = async (message, args, slash) => {
    const result = {}
    if (slash) {
        for (let argIndex = 0; argIndex < args.length; argIndex++) {
            result[args.name] = message.options.get(args.name)
        }
        return result
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
                message.args.splice(isInString, argIndex - isInString)
                argIndex = isInString + 1
                isInString = 0
            }
            if (!valid) {
                return `The argument "${name}" has to be wraped in ${left}${right} and its contents must contain no whitspace charecters exept for space`
            }
            break;
        case 'number':
            const number = Number(argContent)
            if (number === NaN) return `The argument "${name}" has to be a number` 
            result[name] = Math.min(Math.max(number, arg.min), arg.max)
            break;
        case 'any':
            result[name] = argContent;
            break;
        case 'member':
            let member = argContent
            if (!member.startsWith('<@') && !member.includes('&')) return `The argument "${name}" has to be a member`
            member = member.replace('<@', '').replace('>', '')
            await message.guild.members.fetch(member).then(member => {
                result[name] = member
            }).catch(() => null);
            break;
        case 'channel':
            let channel = argContent
            if (!channel.startsWith('<#')) return `The argument "${name}" has to be a channel`
            channel = channel.replace('<#', '').replace('>', '')
            await imports.client.channels.fetch(channel).then(channel => {
                result[name] = channel
            }).catch(() => null);
            break;
        case 'role':
            let role = argContent
            if (!role.startsWith('<@&')) return `The argument "${name}" has to be a role`
            role = role.replace('<@&', '').replace('>', '')
            role = message.guild.roles.cache.get(role)
            result[name] = role
            break;
        }
    }
    return result
}
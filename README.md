# Mister Mc Macenstein

idk

[Commands](<./commands/>)

[Events (Various features)](<./events/>)

[Overlay engine](<./electron/>)

[General utilities & APIs (And the config)](<./statics/>)

> Object type formating is similar to typescript formating, a question marked type/constant can be null or undefined aswell as the type, but the key must exist. question marked keys are optional and can simply not exist.

## Command Format

There are TWO types of commands, "slash" commands, and text commands. slash commands includes everything that discord will emit to the interactions event.

for text commands, the format is as follows

| type | key | meaning |
| --- | --- | --- |
| `false?` | `slashCmd?` | If this command is a slash command |
| `string` | `name` | The actual name of this command, need not necessarily be the same as the file name |
| `string` | `category` | The category to put this command in. if the category doesnt exist then this command is never revealed in help |
| `string` | `sDesc` | A short description for the command, normally used just after the command name in help |
| `string` | `lDesc` | A complete description for the command, used when getting help for a specific command |
| `number\|'pc'` | `work` | The kind of place that ths command will work, numbers indicate performance ratings, strings indicate device requirements. |
| `CLIArguments\|Argument[]` | `args?` | The arguments for this command, included in specific command help. See `Argument Format` for formating. |
| `(message: Message) => void` | `execute` | The actual command, gets run when the command is ran. `message.arguments: Object` and `message.args: string` are injected into the message object. `message.args` contains the un-processed argument string (content minus command and prefix), `message.arguments` contains the arguments that were parsed according to the rules outlined in the `args` property of this command |

for slash commands, the format is as follows

| type | key | meaning |
| --- | --- | --- |
| `true` | `slashCmd` | If this command is a slash command |
| `number\|'pc'` | `work` | The kind of place that ths command will work, numbers indicate performance ratings, strings indicate device requirements. |
| `ApplicationCommandDataResolvable` | `comData?` | The application command data to register a discord command. |
| `(message: Interaction, ...clues: string[]) => void` | `execute` | The actual command, gets run when the command is ran. Nothing is added to the interaction, `clues` is parts of the custom id (deliminated by `.`) of the interation being handled, i.e. `bc0683b876703.closeButton` will become `['bc0683b876703', 'closeButton']` |

## Argument Format

There are also TWO argument formats, you can either format them like POSIXs CLI arguments, or you can format them like discord message arguments.

idk, read [argument-parser.js (CLI)](<./statics/argument-parser.js>) and [arguments-parser.js (Discord)](<./statics/arguments-parser.js>)
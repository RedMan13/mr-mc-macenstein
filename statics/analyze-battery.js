const child = require('child_process');
const fs = require('fs/promises');

const exec = (command, args = []) => new Promise((resolve, reject) => child.exec(command, args, (err, out) => err ? reject(err) : resolve(out)));
const linuxBatteryDirs = [
    '/sys/class/power_supply/BAT0/uevent',
    '/sys/class/power_supply/BAT1/uevent',
    '/sys/class/power_supply/battery/uevent'
]

module.exports = async function getBatteryInfo() {
    switch (process.platform) {
    case 'android':
        if (process.env.TERMUX_VERSION) { // we dont have permission to ask the class file directly
            const info = JSON.parse(await exec('termux-battery-status'));
            return {
                hasBattery: info.present,
                charging: info.plugged !== 'UNPLUGGED',
                percentage: info.percentage
            }
        }
    case 'linux':
        for (const dir of linuxBatteryDirs) {
            if (!fs.access(dir, fs.constants.R_OK | fs.constants.F_OK).catch(() => false)) continue;
            const data = await fs.readFile(dir, 'utf8');
            const res = { hasBattery: true };
            for (const [_, key, value] of data.matchAll(/^(.+)=(.*)$/gm)) {
                switch (key) {
                case 'POWER_SUPPLY_CAPACITY': res.percentage = Number(value); break;
                case 'POWER_SUPPLY_STATUS': res.charging = value.toLowerCase() !== 'discharging'; break;
                }
            }
            return res;
        }
        return { hasBattery: false };
    case 'win32':
        break;
    case 'darwin':
        break;
    case 'freebsd':
    case 'netbsd':
    case 'openbsd':
        const info = await exec('sysctl', ['-i', 'hw.acpi.battery hw.acpi.acli']);
        const res = { hasBattery: false };
        for (const [_, key, value] of data.matchAll(/^\s*(.+):\s*(.*)$/gm)) {
            switch (key) {
            case 'hw.acpi.battery.units': res.hasBattery = value !== '0'; break;
            case 'hw.acpi.battery.life': res.percentage = Number(value); break;
            case 'hw.acpi.acline': res.charging = value !== '1';
            }
        }
        return res;
    case 'haiku':
    case 'cygwin':
    case 'aix':
    case 'sunos':
    default: return { hasBattery: false };
    } 
}
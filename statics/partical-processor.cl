kernel void simulate(global char *parts, uint width, uint height, char dir) {
    size_t i = get_global_id(0);
    switch (parts[i]) {
    case 0x00: break;
    case 0x01: // sand
        switch (parts[i + width]) {
        case 0x01: {
            char tmp = parts[i + width];
            parts[i + width] = parts[i];
            parts[i] = tmp;
            break;
        }
        case 0x03: // slide or stop
            if (parts[i + width -1] && parts[i + width +1]) break;
            if (parts[i + width +1]) {
                parts[i + width -1] = parts[i];
                parts[i] = 0x00;
                break;
            }
            if (parts[i + width -1]) {
                parts[i + width +1] = parts[i];
                parts[i] = 0x00;
                break;
            }

            if ((i + dir) % 2) {
                parts[i + width +1] = parts[i];
                parts[i] = 0x00;
                break;
            } else {
                parts[i + width -1] = parts[i];
                parts[i] = 0x00;
                break;
            }
            break;
        default: // fall
            parts[i + width] = parts[i];
            parts[i] = 0x00;
        }
        break;
    case 0x02: // water
        switch (parts[i + width]) {
        case 0x01:
        case 0x02:
        case 0x03: // slide around
            if ((i + dir) % 2) {
                parts[i + width +1] = parts[i];
                parts[i] = 0x00;
                break;
            } else {
                parts[i + width -1] = parts[i];
                parts[i] = 0x00;
                break;
            }
            break;
        default: // fall
            parts[i + width] = parts[i];
            parts[i] = 0x00;
        }
        break;
    case 0x03: // solid
        break;
    }
}
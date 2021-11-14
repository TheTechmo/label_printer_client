import usbDevices from "./usbDevices";
import services from "./services";
import relayServer from "./relayServer";

// Should use glob or fs or something this is stupid who wrote this? A SICK PERSON?!
const ipcChannels = {
    'usbDevices': usbDevices,
    'services': services,
    'relayServer': relayServer
}
export default ipcChannels

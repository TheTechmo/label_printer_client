import usbDevices from "./usbDevices";
import services from "./services";
import relayServer from "./relayServer";
const ipcChannels = {
    'usbDevices': usbDevices,
    'services': services,
    'relayServer': relayServer
};
export default ipcChannels;
//# sourceMappingURL=index.js.map
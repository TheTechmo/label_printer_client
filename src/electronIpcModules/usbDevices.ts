import { Device } from "usb-detection";
import * as usbDetect from "usb-detection";
import IpcModule from "./_ipcModule";



// Find all attached devices and emit change event (specific changed device optional)
function findAndEmit(device: Device | null) {
    usbDetect.find().then((devices: Device[]) => {
        usbDevices.emit?.('change', {
            changedDevice: device,
            devices: devices
        })
    })
}



const usbDevices: IpcModule = {
    // Will be injected on import
    emit: () => {
    },


    init() {
        usbDetect.startMonitoring()

        findAndEmit(null)

        usbDetect.on('change', (device) => {
            findAndEmit(device)
        });
    }

}

export default usbDevices
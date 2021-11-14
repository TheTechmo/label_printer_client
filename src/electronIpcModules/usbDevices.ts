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
        // Start monitoring when app is started
        usbDetect.startMonitoring()

        // Give app all devices
        findAndEmit(null)

        // When a change is detected, give app info on that changed device
        usbDetect.on('change', (device) => {
            findAndEmit(device)
        });
    }

}

export default usbDevices

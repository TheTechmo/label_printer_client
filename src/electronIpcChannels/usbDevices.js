const usbDetect = require('usb-detection');


// Find all attached devices and emit change event (specific changed device optional)
function findAndEmit(device) {
    usbDetect.find().then((devices) => {
        usbDevices.emit('change', {
            changedDevice: device,
            devices: devices
        })
    })
}

const usbDevices = {
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
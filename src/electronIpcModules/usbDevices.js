import * as usbDetect from "usb-detection";
// Find all attached devices and emit change event (specific changed device optional)
function findAndEmit(device) {
    usbDetect.find().then((devices) => {
        var _a;
        (_a = usbDevices.emit) === null || _a === void 0 ? void 0 : _a.call(usbDevices, 'change', {
            changedDevice: device,
            devices: devices
        });
    });
}
const usbDevices = {
    // Will be injected on import
    emit: () => {
    },
    init() {
        usbDetect.startMonitoring();
        findAndEmit(null);
        usbDetect.on('change', (device) => {
            findAndEmit(device);
        });
    }
};
export default usbDevices;
//# sourceMappingURL=usbDevices.js.map
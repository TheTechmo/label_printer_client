import IConfig from './config'

const config: IConfig = {
    FAKE_LP_SERIAL: '1304201745272793964007', // Serial number of the a little usb that I use to imitate the label printer being connected. What can I say? I'm lazy
    ACCEPT_FAKE_LP: true, // Turn this off in prod lol
    TIME_CONSTRAINTS: { // Plan to only allow the thing to work during the following hours
        FROM: "0830",
        TO: "1430"
    },
    WINDOW: { // Just for how we want to start off the app window
        WIDTH: 1125 + 320,
        HEIGHT: 1225,
        START_FULLSCREEN: false,
        START_WITH_DEVTOOLS_OPEN: true
    },
    LABEL_SERVICE_POLLING_INTERVAL: 10000, // Poll DLS every X milliseconds
    RELAY_SERVER: { // Info about the relay server
        URL: "square-orders.zachb.nz",
        PING_INTERVAL: 10000
    },
    SELECTED_PRINTER: "DYMO LabelWriter 400", // Which printer we want to use
    LABEL_NAME: "drink_order_with_tagline", // Which label file we want to use
    LABEL_DETAILS_MAX_CHARS: 45, // How many chars are allowed per line of label description
    WINDOWS_DLS: { // Path to DLS file on windows
        PATH: "C:\\Program Files (x86)\\DYMO\\DYMO Label Software",
        FILE: "DYMO.DLS.Printing.Host.exe"
    },
    ALLOWED_CATEGORIES: (category) => { // Whether to allow a category or not - can be either a list or a function
        return category.toLowerCase().indexOf("drink") > -1
    }
}

export default config

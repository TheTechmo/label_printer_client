import IConfig from './config'

const config: IConfig = {
    FAKE_LP_SERIAL: '1304201745272793964007',
    ACCEPT_FAKE_LP: true,
    TIME_CONSTRAINTS: {
        FROM: "0830",
        TO: "1430"
    },
    LABEL_SERVICE_POLLING_INTERVAL: 10000,
    RELAY_SERVER: {
        URL: "square-orders.zachb.nz",
        PING_INTERVAL: 10000
    },
    SELECTED_PRINTER: "DYMO LabelWriter 400",
    LABEL_NAME: "drink_order_with_tagline"
}

export default config
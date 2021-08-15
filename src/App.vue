<template>
    <div>
        <status-bar
                :lp_status="devDeviceConnectedStatus"
                :rs_status="websocketStatus"
                :ls_status="labelServiceStatus"
        />
        <b-container id="app">
            <h2>Time: </h2><span>{{ timestamp }}</span>
            <h2>Working Hours? </h2><span>{{ isWorkingHours }}</span>
            <h2>WebSocket: {{ wsClient == null ? "null" : wsClient.readyState }}
                <b-button @click="connectToRelayServer">Connect</b-button>
            </h2>
            <h2>Status:
                <b-icon :icon="devIcon" :variant="devColour"/>
            </h2>
            <h2>Printers</h2>
            <ul>
                <li v-bind:key="index" v-for="(p, index) in printers">
                    <b-icon :icon="pIcon(p)" :variant="pColour(p)"></b-icon>
                    {{ p.name }}
                </li>
            </ul>
        </b-container>
    </div>
</template>

<script>
import StatusBar from "./components/status/StatusBar";

const xmlJS = require('xml-js')
const {ipcRenderer} = require('electron')
const moment = require('moment')
const Dymo = require('dymojs')

let dymo = new Dymo()


export default {
    name: 'App',
    components: {
        StatusBar
    },
    data() {
        return {
            timestamp: "",
            labelServiceStatus: null,
            connectedDevices: [],
            wsClient: null
        }
    },
    computed: {
        devDeviceConnectedStatus() {
            return this.connectedDevices.map((x) => x.serialNumber)
                .indexOf(this.$config.FAKE_LP_SERIAL) > -1
        },
        devIcon() {
            return this.devDeviceConnectedStatus ? 'check-circle-fill' : 'exclamation-triangle-fill'
        },
        devColour() {
            return this.devDeviceConnectedStatus ? 'success' : 'danger'
        },
        isWorkingHours() {
            const format = "HHmm"
            const now = moment()
            const start = moment(this.$config.TIME_CONSTRAINTS.FROM, format).subtract(1, 'minute')
            const end = moment(this.$config.TIME_CONSTRAINTS.TO, format).add(1, 'minute')
            return now.isBetween(start, end)

        },
        websocketStatus() {
            return this.wsClient != null && this.wsClient.readyState === WebSocket.OPEN
        }
    },
    asyncComputed: {
        printers: {
            get() {
                return dymo.getPrinters().then((x) => {
                    let data = this.fixTheFuckingBase64Preview(x)

                    let js = null
                    try {
                        js = JSON.parse(xmlJS.xml2json(data, {compact: true}))
                    } catch (e) {
                        return
                    }


                    return Object.values(js.Printers).map((obj) => {
                        return {
                            name: obj.Name._text,
                            connected: obj.IsConnected._text.toLowerCase() === "true"
                        }
                    })
                }).catch((e) => alert("ERROR: " + e.toString()))

            },
            default: "..."
        },
    },
    methods: {
        fixTheFuckingBase64Preview(data) {
            return data.substring(1, data.length - 1).replace(/\\n/g, "").replace(/\\/g, '')
        },
        pIcon(p) {
            return p.connected ? 'check-circle-fill' : 'exclamation-triangle-fill'
        },
        pColour(p) {
            return p.connected ? 'success' : 'danger'
        },
        checkDymoStatus() {
            dymo.getStatus()
                .then((status) => this.labelServiceStatus = !!status)
                .catch(() => {
                    this.labelServiceStatus = false
                    ipcRenderer.send('services', {
                        action: "START",
                        service: "dymo_label_service"
                    })
                })
        },
        connectToRelayServer() {
            this.wsClient = new W3CWebSocket(
                "ws://" + this.$config.RELAY_SERVER.URL,
                "echo-protocol",
                "127.0.0.1",
                {
                    "X-SECRET": process.env.VUE_APP_RELAY_SERVER_SECRET
                }
            )

            this.wsClient.onerror = (e) => {
                console.warn(e)
            }

            this.wsClient.onmessage = (m) => {
                console.info(m)
            }

            console.log(this.wsClient)

            console.log("attempted to connect")

        }
    },
    mounted() {
        ipcRenderer.on('usbDevices_change', (event, device, devices) => {
            console.log("Event", event)
            console.log("Device", device)
            console.log("Devices", device)
            this.connectedDevices = devices
            this.$asyncComputed.printers.update()
        })

    },
    created() {
        setInterval(
            () => this.timestamp = moment().toString(),
            1000
        )

        this.connectToRelayServer()


        setInterval(
            this.checkDymoStatus,
            this.$config.LABEL_SERVICE_POLLING_INTERVAL
        )

        ipcRenderer.on('services_action_reply', (event, data) => {
            if (data.error == null) {
                setTimeout(() => this.checkDymoStatus(), 1000)
            }
        })

        this.checkDymoStatus()

    }
}
</script>

<style lang="scss">
//@import "./assets/scss/vendors/bootstrap-vue/index";


#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

li {
  list-style: none !important;
}

.icon-link {
  font-size: 20px;
  cursor: default;

  &::after {
    border: none !important;
  }
}
</style>

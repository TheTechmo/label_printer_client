<template>
    <div>
        <status-bar
                :lp_status="printerStatus"
                :rs_status="relayServerStatus === 1"
                :ls_status="labelServiceStatus"
        />
        <b-container id="app">
            <b-row>
                <b-col cols="4">
                    <h2>Time: </h2><span>{{ timestamp }}</span>
                    <h2>Working Hours? </h2><span>{{ isWorkingHours }}</span>
                    <h2>WebSocket: {{ relayServerStatus }}
                    </h2>
                    <h2>Status:
                        <b-icon :icon="pIcon(printerStatus)" :variant="pColour(printerStatus)"/>
                    </h2>
                    <h2>Printers</h2>
                    <ul>
                        <li :key="'printer-' + name" v-for="(value, name) in printers">
                            <b-icon :icon="pIcon(value)" :variant="pColour(value)"></b-icon>
                            {{ name }}
                        </li>
                    </ul>
                </b-col>
                <b-col cols="8">
                    <div id="imageWrapper">
                        <LabelPreview :key="'label-' + i" v-for="(label, i) in labels" :base64-data="label" />
                    </div>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script>
import StatusBar from "./components/status/StatusBar.vue";

const xmlJS = require('xml-js')
const {ipcRenderer} = require('electron')
const moment = require('moment')
const Dymo = require('dymojs')
import { readFile } from 'fs/promises'
import LabelPreview from "./components/LabelPreview";

let dymo = new Dymo()


export default {
    name: 'App',
    components: {
        LabelPreview,
        StatusBar
    },
    data() {
        return {
            timestamp: "",
            labelServiceStatus: null,
            connectedDevices: [],
            relayServerStatus: null,
            labels: [

            ]
        }
    },
    computed: {
        printerStatus() {
            return (process.env.NODE_ENV === 'development' && this.devDeviceConnectedStatus)
                || this.realPrinterStatus
        },
        realPrinterStatus() {
            return this.printers !== undefined
                && Object.hasOwnProperty.call(this.printers, this.$config.SELECTED_PRINTER)
                && this.printers[this.$config.SELECTED_PRINTER]
        },
        devDeviceConnectedStatus() {
            return this.connectedDevices.map((x) => x.serialNumber)
                .indexOf(this.$config.FAKE_LP_SERIAL) > -1
        },
        isWorkingHours() {
            const format = "HHmm"
            const now = moment()
            const start = moment(this.$config.TIME_CONSTRAINTS.FROM, format).subtract(1, 'minute')
            const end = moment(this.$config.TIME_CONSTRAINTS.TO, format).add(1, 'minute')
            return now.isBetween(start, end)

        },
    },
    asyncComputed: {
        printers: {
            async get() {
                let printersList = this.fixTheFuckingDymoResponse(await dymo.getPrinters())

                let js = null
                try {
                    js = JSON.parse(xmlJS.xml2json(printersList, {compact: true}))
                } catch (e) {
                    return
                }

                let printersDict = {}

                Object.values(js.Printers).forEach((obj) => {
                    let name = obj.Name._text
                    let connected = obj.IsConnected._text.toLowerCase() === "true"
                    printersDict[name] = connected
                })

                return printersDict

            },
            default: {}
        },
    },
    methods: {
        fixTheFuckingDymoResponse(data) {
            return data.substring(1, data.length - 1).replace(/\\n/g, "").replace(/\\/g, '')
        },
        pIcon(p) {
            return p ? 'check-circle-fill' : 'exclamation-triangle-fill'
        },
        pColour(p) {
            return p ? 'success' : 'danger'
        },
        checkDymoStatus() {
            dymo.getStatus()
                .then((status) => this.labelServiceStatus = !!status)
                .catch(() => {
                    this.labelServiceStatus = false
                    ipcRenderer.send('services_action', {
                        action: "START",
                        service: "dymo_label_service"
                    })
                })
        },
        checkRelayServerStatus() {
            ipcRenderer.invoke('relayServer_status').then((response) => {
                this.relayServerStatus = response
            })
        }
    },
    mounted() {
        this.$asyncComputed.printers.update()
        ipcRenderer.on('usbDevices_change', (event, {devices}) => {
            this.connectedDevices = devices
            setTimeout(this.$asyncComputed.printers.update, 250)
        })

    },
    created() {
        setInterval(
            () => this.timestamp = moment().toString(),
            1000
        )


        setTimeout(() => {
            this.checkRelayServerStatus()
            this.checkDymoStatus()
        }, 2000)

        setInterval(this.checkRelayServerStatus, this.$config.RELAY_SERVER.PING_INTERVAL)


        setInterval(
            this.checkDymoStatus,
            this.$config.LABEL_SERVICE_POLLING_INTERVAL
        )

        ipcRenderer.on('services_action_reply', (event, data) => {
            if (data.error == null) {
                setTimeout(() => this.checkDymoStatus(), 1000)
            }
        })

        ipcRenderer.on('relayServer_newOrder', (event, order) => {
            console.info("ORDER: " + order.id)

            this.labels = []

            let label_name = this.$config.LABEL_NAME.toString()
            console.info(label_name)

            readFile(`./src/labels/${ label_name }.label`).then((xml) => {

                order["line_items"].forEach((item) => {

                    let details = item["modifiers"].map((m) => m.name).join(", ") // todo test first

                    if (Object.hasOwnProperty.call(item, 'note')) {
                        details = details + "\n" + item['note']
                    }



                    let labelTemplate = xml.toString()
                        .replace("{{size}}", item["variation_name"][0])
                        .replace("{{title}}", item["name"])
                        .replace("{{details}}", details)

                    dymo.renderLabel(labelTemplate).then((label) => {
                        this.labels.push(this.fixTheFuckingDymoResponse(label))
                        if (this.realPrinterStatus) {
                            console.info("PRINTING: " + order.id)
                            dymo.print(this.$config.SELECTED_PRINTER, labelTemplate)
                        }
                    })

                })

            }).catch((e) => console.error("readFile error: " + e.toString()))

        })


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

#imageWrapper {
  padding: 20px;
  background: gray;
}
</style>

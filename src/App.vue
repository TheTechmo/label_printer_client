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
        <admin-things />
    </div>
</template>

<script lang="ts">
import StatusBar from "./components/status/StatusBar.vue";
import LabelPreview from "./components/LabelPreview.vue";
import AdminThings from "@/components/AdminThings.vue";

import Vue from 'vue'
import * as xmlJS from 'xml-js'
import { ipcRenderer } from 'electron'
import moment from 'moment'
import { readFile } from 'fs/promises'
import {Order, OrderLineItem, OrderLineItemModifier} from "square";


// import * as Dymo from 'dymojs'
const Dymo = require('dymojs')

let dymo = new Dymo()


interface IData {
    timestamp: string,
    labelServiceStatus: boolean,
    connectedDevices: Array<any>,
    relayServerStatus: boolean,
    labels: Array<string>
}

export default Vue.extend({
    name: 'App',
    components: {
        AdminThings,
        LabelPreview,
        StatusBar
    },
    data(): IData {
        return {
            timestamp: "",
            labelServiceStatus: false,
            connectedDevices: [],
            relayServerStatus: false,
            labels: [

            ]
        }
    },
    computed: {
        printerStatus(): boolean {
            return (process.env.NODE_ENV === 'development' && this.devDeviceConnectedStatus)
                || this.realPrinterStatus
        },
        realPrinterStatus(): boolean {
            return this.printers !== undefined
                && Object.hasOwnProperty.call(this.printers, this.$config.SELECTED_PRINTER)
                && this.printers[this.$config.SELECTED_PRINTER]
        },
        devDeviceConnectedStatus(): boolean {
            return this.connectedDevices.map((x) => x.serialNumber)
                .indexOf(this.$config.FAKE_LP_SERIAL) > -1
        },
        isWorkingHours(): boolean {
            const format = "HHmm"
            const now = moment()
            const start = moment(this.$config.TIME_CONSTRAINTS.FROM, format).subtract(1, 'minute')
            const end = moment(this.$config.TIME_CONSTRAINTS.TO, format).add(1, 'minute')
            return now.isBetween(start, end)

        },
    },
    asyncComputed: {
        printers: {
            async get(): Promise<Object> {
                let printersList = this.fixTheFuckingDymoResponse(await dymo.getPrinters())

                let js = null
                try {
                    js = JSON.parse(xmlJS.xml2json(printersList, {compact: true}))
                } catch (e) {
                    return
                }

                let printersDict = {}

                Object.values(js.Printers).forEach((obj: unknown) => {
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
        fixTheFuckingDymoResponse(data: string): string {
            return data.substring(1, data.length - 1).replace(/\\n/g, "").replace(/\\/g, '')
        },
        pIcon(p: boolean) {
            return p ? 'check-circle-fill' : 'exclamation-triangle-fill'
        },
        pColour(p: boolean) {
            return p ? 'success' : 'danger'
        },
        checkDymoStatus() {
            dymo.getStatus()
                .then((status: string) => this.labelServiceStatus = !!status)
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

        ipcRenderer.on('relayServer_newOrder', (event, order: Order) => {
            console.info("ORDER: " + order.id)

            this.labels = []

            let label_name = this.$config.LABEL_NAME.toString()
            console.info(label_name)

            readFile(`./src/labels/${ label_name }.label`).then((xml: Buffer) => {

                order.lineItems?.forEach((item: OrderLineItem) => {

                    let details = item.modifiers?.map((m: OrderLineItemModifier) => m.name).join(", ") // todo test first

                    if (item.note != undefined) {
                        details = details + "\n" + item.note
                    }

                    let size = item.variationName != undefined ? item.variationName.charAt(0) : ""


                    let labelTemplate = xml.toString()
                        .replace("{{size}}", size)
                        .replace("{{title}}", item.name != undefined ? item.name : "")
                        .replace("{{details}}", details != undefined ? details : "")

                    dymo.renderLabel(labelTemplate).then((label: string) => {
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
})
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

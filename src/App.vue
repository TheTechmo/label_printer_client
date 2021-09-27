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
                        <LabelPreview :key="'label-' + i" v-for="(label, i) in labels" :base64-data="label"/>
                    </div>
                </b-col>
            </b-row>
        </b-container>
        <admin-things/>
    </div>
</template>

<script lang="ts">
import StatusBar from "./components/status/StatusBar.vue";
import LabelPreview from "./components/LabelPreview.vue";
import AdminThings from "@/components/AdminThings.vue";

import Vue from 'vue'
import * as xmlJS from 'xml-js'
import {ipcRenderer} from 'electron'
import moment from 'moment'
import {readFile} from 'fs/promises'
import {Order, OrderLineItem, OrderLineItemModifier} from "square";
import {ConnectedPrintersList, XmlPrinter} from "dymojs";
import { Device } from "usb-detection";
import { splitLinesToFit } from "@/utils/strings";
import { orderItemDevLog } from "@/utils/debug";
import {ItemCategories, OrderNotification} from "square-custom";
import {range} from "lodash";


// import * as Dymo from 'dymojs'
const Dymo = require('dymojs')

let dymo = new Dymo({hostname: "localhost"})



export default Vue.extend({
    name: 'App',
    components: {
        AdminThings,
        LabelPreview,
        StatusBar
    },
    data() {
        return {
            timestamp: "",
            labelServiceStatus: false,
            connectedDevices: [] as Array<Device>,
            relayServerStatus: false,
            labels: [] as Array<String>, // TODO make label class?
            printers: {} as ConnectedPrintersList
        }
    },
    computed: {
        printerStatus(): boolean {
            return (process.env.NODE_ENV === 'development' && this.devDeviceConnectedStatus)
                || this.realPrinterStatus
        },
        realPrinterStatus(): boolean {
            return this.$config.SELECTED_PRINTER in this.printers
                && this.printers[this.$config.SELECTED_PRINTER]
        },
        devDeviceConnectedStatus(): boolean {
            return this.connectedDevices.map((x: any) => x.serialNumber)
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
        },
        parseXmlPrinter(p: any): XmlPrinter {
            return {
                name: p?.Name._text,
                modelName: p?.ModelName._text,
                isConnected: p?.IsConnected._text.toLowerCase() == "true",
                isLocal: p?.IsLocal._text.toLowerCase() == "true",
                isTwinTurbo: p?.IsTwinTurbo._text.toLowerCase() == "true"
            }

        },
        async updateConnectedPrinters(): Promise<void> {
                let printersList = this.fixTheFuckingDymoResponse(await dymo.getPrinters())

                let js = JSON.parse(xmlJS.xml2json(printersList, {compact: true})) // todo try catch

                let printersDict: ConnectedPrintersList = {}

                Object.values(js.Printers).forEach((obj: any) => {
                    let p: XmlPrinter = this.parseXmlPrinter(obj)
                    printersDict[p.name] = p.isConnected
                })

                this.printers = printersDict

            },
    },
    mounted() {
        this.updateConnectedPrinters()
        ipcRenderer.on('usbDevices_change', (event, {devices}) => {
            this.connectedDevices = devices
            setTimeout(this.updateConnectedPrinters, 250)
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

        setInterval(this.checkRelayServerStatus, this.$config.RELAY_SERVER.PING_INTERVAL) // TODO what is this


        setInterval(
            this.checkDymoStatus,
            this.$config.LABEL_SERVICE_POLLING_INTERVAL
        )

        ipcRenderer.on('services_action_reply', (event, data) => {
            if (data.error == null) {
                setTimeout(() => this.checkDymoStatus(), 1000)
            }
        })

        // TODO replace with socket.io to get rid of IPC middleman
        ipcRenderer.on('relayServer_newOrder', (event, orderNotif: OrderNotification) => {
            const order: Order = orderNotif.order;
            const categories: ItemCategories = orderNotif.categories

            console.info("ORDER: " + order.id)
            console.log(order)

            // TODO make custom square types for snake case

            this.labels = []

            let label_name = this.$config.LABEL_NAME.toString()
            console.info(label_name)

            readFile(`./src/labels/${label_name}.label`).then((xml: Buffer) => {
                console.log("Opened label template")

                console.log("\n===== PROCESSING ITEMS =====\n")

                // TODO only print if item is a drink
                // TODO repeat for quantities
                order.lineItems?.forEach((item: OrderLineItem) => {
                    let log = orderItemDevLog(item.name, this.devDeviceConnectedStatus || this.$isDevEnv)
                    console.log(item)

                    if (item.uid == undefined) {
                        log("Item UID could not be found. ===IGNORING===")
                        return;
                    }

                    // TEST CATEGORY
                    if (!(item.uid in categories)) {
                        log("Could not find category for item. ===IGNORING===")
                        return;
                    }

                    let category: string = categories[item.uid].categoryData.name

                    if (category == undefined) {
                        log("Item category is invalid. ===IGNORING===")
                        return;
                    }

                    log("Category", category)

                    // If allowed categories is specified as a list of names, test if name is in list
                    if (Array.isArray(this.$config.ALLOWED_CATEGORIES)) {
                        if (this.$config.ALLOWED_CATEGORIES.indexOf(category) < 0) {
                            log("Category not allowed. ===IGNORING===")
                            return
                        }

                    }
                    // If allowed categories is a function that returns a boolean (if category is allowed), run that function
                    else if ((typeof this.$config.ALLOWED_CATEGORIES) === "function") {
                        if (!this.$config.ALLOWED_CATEGORIES(category)) {
                            log("Category not allowed. ===IGNORING===")
                            return
                        }
                    }

                    let details;

                    // If item has modifiers, construct a string containing modifier names, else an empty string
                    if (item.modifiers != undefined && item.modifiers.length > 0) {
                        details = item.modifiers?.filter((m: OrderLineItemModifier) => m.name != undefined)
                            .map((m: OrderLineItemModifier) => m.name).join(", ")
                    } else {
                        details = ""
                    }

                    log("Details", details)

                    // If item has note, append note text to details
                    if (item.note != undefined) {
                        log("Note", item.note)
                        details = details + ", " + item.note
                    }

                    // Run algorithm to insert new lines at the right places to make details fit the width of a label
                    details = splitLinesToFit(details, this.$config.LABEL_DETAILS_MAX_CHARS)

                    // Get size letter (S, L)
                    let size = item.variationName != undefined ? item.variationName.charAt(0) : ""
                    log("Size", size)

                    // Insert info into label template
                    let labelTemplate = xml.toString()
                        .replace("{{size}}", size)
                        .replace("{{title}}", item.name != undefined ? item.name : "")
                        .replace("{{details}}", details != undefined ? details : "")

                    log("Label templated")

                    // Render labels
                    for (let i of range(parseInt(item.quantity))) {
                        dymo.renderLabel(labelTemplate).then((label: string) => {
                            if (label == undefined || label.toLowerCase().includes("error")) {
                                console.error("[%s] LABEL RENDERING ERROR OCCURRED:", item.name, label)
                            }
                            log("Label rendered (%s of %s)", i+1, item.quantity)

                            this.labels.push(this.fixTheFuckingDymoResponse(label))
                            log("Label pushed to state (%s of %s)", i+1, item.quantity)


                        })

                        // Print labels if printer connected
                        if (this.realPrinterStatus) {
                            log("Printing label (%s of %s)", i+1, item.quantity)
                            dymo.print(this.$config.SELECTED_PRINTER, labelTemplate)
                        }
                    }

                })

            }).catch((e) => console.error("Templating error: " + e.toString()))

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

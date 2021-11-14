<template>
    <div>
        <!-- Status Bar -->
        <status-bar
                :lp_status="printerStatus"
                :rs_status="relayServerStatus === 1"
                :ls_status="labelServiceStatus"
        />
        <b-container id="app">
            <b-row>
                <!-- Info panel -->
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

                <!-- Label previews -->
                <b-col cols="8">
                    <div id="imageWrapper">
<!--                        <FancyLabel :label="null" />-->
                        <LabelPreview :key="'label-' + i" v-for="(label, i) in labels" :base64-data="label"/>
                    </div>
                </b-col>
            </b-row>
        </b-container>
        <!-- W.I.P. -->
        <admin-things/>
    </div>
</template>

<script lang="ts">
// Components
import StatusBar from "./components/status/StatusBar.vue";
import LabelPreview from "./components/label/LabelPreview.vue";
import AdminThings from "@/components/AdminThings.vue";

// Library imports, duh.
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

// Can't be fucked to figure out the ES6 equivilent for this
const Dymo = require('dymojs')

// Initiate a Dymo instance
let dymo = new Dymo({
    hostname: process.platform == "win32" // Windows sucks, yeah?
        ? "localhost"
        : "127.0.0.1"
})


/**
 * Look, I know what you're thinking: WOW this code is all over the place - not to mention how shit it
 *                                      is and that it's all crammed into this one file.
 *
 * You gotta understand tho - being in crippling pain for months on end does things to a man, and by extension, his code.
 * This thing will be polished and grand in time, a lot of time. Right now I'm on heavy medication and don't
 * have enough brain power to do any of this properly. That's it. Enjoy the following
 */
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
        // Get the status of the printer
        printerStatus(): boolean {
            return (process.env.NODE_ENV === 'development' && this.devDeviceConnectedStatus)
                || this.realPrinterStatus
        },
        // Get the status of the real printer (not dev device)
        realPrinterStatus(): boolean {
            return this.$config.SELECTED_PRINTER in this.printers
                && this.printers[this.$config.SELECTED_PRINTER]
        },
        // Is the dev device connected? We'll never know...
        devDeviceConnectedStatus(): boolean {
            return this.connectedDevices.map((x: any) => x.serialNumber)
                .indexOf(this.$config.FAKE_LP_SERIAL) > -1
        },
        // Fuck me I hate working with time
        isWorkingHours(): boolean {
            const format = "HHmm"
            const now = moment()
            const start = moment(this.$config.TIME_CONSTRAINTS.FROM, format).subtract(1, 'minute')
            const end = moment(this.$config.TIME_CONSTRAINTS.TO, format).add(1, 'minute')
            return now.isBetween(start, end)

        },
    },
    methods: {
        // The god damn response I get from the dymo library is fucked for some reason so just have to pass it through this.
        fixTheFuckingDymoResponse(data: string): string {
            return data.substring(1, data.length - 1).replace(/\\n/g, "").replace(/\\/g, '')
        },
        // Why yes, I am an icon
        pIcon(p: boolean) {
            return p ? 'check-circle-fill' : 'exclamation-triangle-fill'
        },
        // Colours are cool, aren't they? p.s. these two functions are just to help the status bar
        pColour(p: boolean) {
            return p ? 'success' : 'danger'
        },
        // Ping the DLS. If it fails, send a request for a restart
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
        // Check the status of the websocket connection
        checkRelayServerStatus() {
            ipcRenderer.invoke('relayServer_status').then((response) => {
                this.relayServerStatus = response
            })
        },
        // XML sucks so we transform it to a nice simple JSON object
        parseXmlPrinter(p: any): XmlPrinter {
            return {
                name: p?.Name._text,
                modelName: p?.ModelName._text,
                isConnected: p?.IsConnected._text.toLowerCase() == "true",
                isLocal: p?.IsLocal._text.toLowerCase() == "true",
                isTwinTurbo: p?.IsTwinTurbo._text.toLowerCase() == "true"
            }

        },
        // Update the connected printers list - usually called on a usb device change
        async updateConnectedPrinters(): Promise<void> {
            // So we get a list of printers from DLS
            let printersList = this.fixTheFuckingDymoResponse(await dymo.getPrinters())

            // Transform to JSON because XML can go to hell
            let js = JSON.parse(xmlJS.xml2json(printersList, {compact: true})) // todo try catch

            // Transform to a nice object of {printerName: isConnected} string: bool
            let printersDict: ConnectedPrintersList = {}
            Object.values(js.Printers).forEach((obj: any) => {
                let p: XmlPrinter = this.parseXmlPrinter(obj)
                printersDict[p.name] = p.isConnected
            })

            // Update state
            this.printers = printersDict

        },
    },
    // Like a horse, but made from 1s and 0s
    mounted() {
        // Check connected printers for the first time
        this.updateConnectedPrinters()

        // Listen for usb device changes and update state when one happens
        ipcRenderer.on('usbDevices_change', (event, {devices}) => {
            this.connectedDevices = devices
            setTimeout(this.updateConnectedPrinters, 250)
        })

    },
    // I am GOD
    created() {
        // Update the timestamp every second
        setInterval(
            () => this.timestamp = moment().toString(),
            1000
        )

        // Check the websocket and DLS statuses in 2 seconds
        setTimeout(() => {
            this.checkRelayServerStatus()
            this.checkDymoStatus()
        }, 2000)

        // Check the relay server status every X seconds
        setInterval(this.checkRelayServerStatus, this.$config.RELAY_SERVER.PING_INTERVAL)

        // Check DLS status every X seconds
        setInterval(
            this.checkDymoStatus,
            this.$config.LABEL_SERVICE_POLLING_INTERVAL
        )

        // Once DLS has been restarted we recheck the status in a second
        ipcRenderer.on('services_action_reply', (event, data) => {
            if (data.error == null) {
                setTimeout(() => this.checkDymoStatus(), 1000)
            }
        })

        /**
         * ORDER HANDLING! YAY!
         */
        // TODO replace with socket.io to get rid of IPC middleman
        ipcRenderer.on('relayServer_newOrder', (event, orderNotif: OrderNotification) => {
            // Unpack order and item categories
            const order: Order = orderNotif.order;
            const categories: ItemCategories = orderNotif.categories

            console.info("ORDER: " + order.id)
            console.log(order)

            // Reset state
            this.labels = []

            let label_name = this.$config.LABEL_NAME.toString()
            console.info(label_name)

            // Load label XMl file - this should really use await now that i think about it
            readFile(`./src/labels/${label_name}.label`).then((xml: Buffer) => {
                console.log("Opened label template")

                console.log("\n===== PROCESSING ITEMS =====\n")

                // For each item ordered
                order.lineItems?.forEach((item: OrderLineItem) => {
                    let log = orderItemDevLog(item.name, this.devDeviceConnectedStatus || this.$isDevEnv)
                    console.log(item)

                    // Skip item if it does not have an ID
                    if (item.uid == undefined) {
                        log("Item UID could not be found. ===IGNORING===")
                        return;
                    }

                    // Skip item if cannot find a category for it
                    if (!(item.uid in categories)) {
                        log("Could not find category for item. ===IGNORING===")
                        return;
                    }

                    // Get item category
                    let category: string = categories[item.uid].categoryData.name

                    // Skip item if category is undefined
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

                    // Get size letter e.g. S, L
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

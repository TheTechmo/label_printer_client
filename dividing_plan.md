### Data
| Name | Signature | Description |
| -------- | -------- | -------- |
| Timestamp | `string` | Current time for display updating every second |
| Label Service Status | `boolean` | Status for if the app can connect to the Dymo label service software |
| Relay Server Status | `boolean` | Status for if the app has a WS connection to the webhook relay server |
| Connected Devices | `Array<Device>` | Connected USB devices updated via electron IPC channels |
| Labels | `Array<String>` | Current labels printing |
| Printers | `ConnectedPrintersList` | List of connected label printers from Dymo service |


### Computed
| Name | Signature | Description |
| -------- | -------- | -------- |
| Printer Status | `boolean` | If config-specified label printer is connected, or if in dev environment, if dev printer device is connected. |
| Real Printer Status | `boolean` | If config-specified printer is in list of connected devices |
| Dev Device Connected Status | `boolean` | If dev label printer device is connected |
| Is Working Hours | `boolean` | If within config-specified working hours |


### Methods
| Name | Signature | Description |
| -------- | -------- | -------- |
| Fix Dymo Response | `(data: string): string` | Dymo response xml is a bit screwed so we need to alter it a bit before parsing it |
| Printer Status Icon | `(p: boolean): string` | Status icon |
| Printer Status Colour | `(p: boolean): string` | Status colour |
| Check Dymo Status | `(): void` | Check and update the dymo service status |
| Check Relay Server Status | `(): void` | Check and update the relay server status |
| Parse Xml Printer | `(p: any): XmlPrinter` | Turn stupid xml into a nice printer object |
| Update Connected Printers | `async (): Promise<void>` | Fetch connected printers, parse them and chuck them into the state |


### Mounted Workings
- Start worker to update connected printers every 250ms


### Created Workings
- Start worker to update timestamp every second
- Start worker to check relay server and dymo service status every 2s
- Start worker to check relay server every CONFIG seconds
- Start worker to check dymo service status every CONFIG seconds
- On IPC service action replay, check the dymo service status a second later
- On IPC new order from relay server, fetch label template, fill in details from order, push to state and print
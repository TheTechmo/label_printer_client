import WebSocket from 'ws'
import config from '../../config'
import IpcModule from "./_ipcModule";

// State
interface RelayServer extends IpcModule {
    data: {
        sock: WebSocket | null
    }
}


const relayServer: RelayServer = {
    data: {
        sock: null
    },

    emit: () => {},

    init() {
        try {
            // Establish websocket connection with auth
            this.data.sock = new WebSocket("wss://" + config.RELAY_SERVER.URL, 'wss', {
                    method: 'POST',
                    headers: {
                        "X-SECRET": process.env.RELAY_SERVER_SECRET
                    },
                    followRedirects: true,
                },
            )

        } catch (e) {
            console.info("error")
            console.error("relay server init") // TODO restart until success
            console.error(e)
            console.error(this.data.sock)
        }

        // When we receive a message
        this.data.sock?.on('message', (msg: Buffer) => {
            console.info("[WS] MESSAGE RECEIVED")
            const message = JSON.parse(msg.toString()) // Parse to JSON
            // console.log(message)

            // If the message contains an error
            if (message.message === "ERROR") {
                console.error("     RECEIVED ERROR: ", message.description)
                return
            }

            // If the message contains a new order
            else if (message.message === "NEW_ORDER") {
                const payload = JSON.parse(message.payload) // Parse payload
                console.info("ORDER: " + payload.order)

                // Create a response payload
                const response = {
                    message: "RECEIVED_ORDER",
                    orderId: payload.order.id
                }

                // Send response
                this.data.sock?.send(JSON.stringify(response))

                // Pass order to frontend
                this.emit?.('newOrder', payload)
            }

        })

        // setInterval(() => console.error(this.data.sock.readyState), 1000)

        // this.data.sock.on('open', console.error)
    },

    handlers: {
        async status() {
            return relayServer.data.sock?.readyState
        }
    }
}

export default relayServer

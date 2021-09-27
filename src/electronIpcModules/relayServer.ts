import WebSocket from 'ws'
import config from '../../config'
import IpcModule from "./_ipcModule";
import {Order} from "square";


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

        this.data.sock?.on('message', (msg: Buffer) => {
            console.info("[WS] MESSAGE RECEIVED")
            const message = JSON.parse(msg.toString())
            // console.log(message)

            if (message.message === "ERROR") {
                console.error("     RECEIVED ERROR: ", message.description)
                return
            } else if (message.message === "NEW_ORDER") {
                const payload = JSON.parse(message.payload)
                console.info("ORDER: " + payload.order)


                const response = {
                    message: "RECEIVED_ORDER",
                    orderId: payload.order.id
                }

                this.data.sock?.send(JSON.stringify(response))
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

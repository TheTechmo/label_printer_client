import WebSocket from 'ws'
<<<<<<< Updated upstream:src/electronIpcModules/relayServer.ts
import config from '../../config'
import IpcModule from "./_ipcModule";
=======

const config = require('../../config')
>>>>>>> Stashed changes:src/electronIpcChannels/relayServer.js


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

            this.data.sock.on('message', (msg) => {
                let order = JSON.parse(JSON.parse(msg.toString())).order
                console.error("ORDER: " + order.id)
                this.emit('newOrder', order)
            })
        } catch (e) {
            console.info("error")
            console.error("relay server init") // TODO restart until success
            console.error(e)
            console.error(this.data.sock)
        }

<<<<<<< Updated upstream:src/electronIpcModules/relayServer.ts
        this.data.sock?.on('message', (msg) => {
            console.info("WS MESSAGE RECEIVED")
            const payload = JSON.parse(msg.toString())

            if (payload.message === "ERROR") {
                console.error("WS ERROR: ", payload.description)
                return
            } else if (payload.message === "NEW_ORDER") {
                const order = JSON.parse(payload.order)
                console.info("ORDER: " + order.id)

                const response = {
                    message: "RECEIVED_ORDER",
                    orderId: order.id
                }

                this.data.sock?.send(JSON.stringify(response))
                this.emit?.('newOrder', order)
            }

        })
=======
>>>>>>> Stashed changes:src/electronIpcChannels/relayServer.js

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

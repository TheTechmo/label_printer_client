import WebSocket from 'ws'
const config = require('../../config')

const relayServer = {
    data: {
        sock: null,
    },

    emit: () => {
    },

    init() {
        try {
            this.data.sock = new WebSocket("wss://" + config.RELAY_SERVER.URL, 'wss', {
            method: 'POST',
            headers: {
                "X-SECRET": process.env.RELAY_SERVER_SECRET
            },
            followRedirects: true
        })
        } catch (e) {
            console.error("relay server init") // TODO restart until success
            console.error(e)
            console.error(this.data.sock)
        }

        this.data.sock.on('message', (msg) => {
            let order = JSON.parse(JSON.parse(msg.toString())).order
            console.error("ORDER: " + order.id)
            this.emit('newOrder', order)
        })

        // setInterval(() => console.error(this.data.sock.readyState), 1000)

        // this.data.sock.on('open', console.error)
    },

    handlers: {
        async status() {
            return relayServer.data.sock.readyState
        }
    }
}

export default relayServer

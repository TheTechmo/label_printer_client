import WebSocket from 'ws'
const config = require('../../config')

const relayServer = {
    data: {
        sock: null,

    },

    emit: () => {
    },

    init() {
        this.data.sock = new WebSocket("wss://" + config.RELAY_SERVER.URL, 'wss', {
            method: 'POST',
            headers: {
                "X-SECRET": process.env.RELAY_SERVER_SECRET
            },
            followRedirects: true
        })

        // setInterval(() => console.error(this.data.sock.readyState), 1000)

        // this.data.sock.on('open', console.error)
    },

    events: {
        status(event, data) {
            console.log(event, data)
            this.emit('status', this.data.sock.readyState)
        }
    }
}

export default relayServer
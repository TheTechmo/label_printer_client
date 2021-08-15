import WebSocket from 'ws'
import config from '../../config'

module.exports = {
    data: {
        sock: null,

    },

    emit: () => {
    },

    init() {
        this.data.sock = new WebSocket(config.RELAY_SERVER.URL, null, {
            headers: {
                "X-SECRET": process.env.RELAY_SERVER_SECRET
            }
        })
    },

    events: {
        status(event, data) {
            this.emit('status')
        }
    }
}
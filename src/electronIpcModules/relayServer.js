import { __awaiter } from "tslib";
import WebSocket from 'ws';
import config from '../../config';
const relayServer = {
    data: {
        sock: null
    },
    emit: () => { },
    init() {
        var _a;
        try {
            this.data.sock = new WebSocket("wss://" + config.RELAY_SERVER.URL, 'wss', {
                method: 'POST',
                headers: {
                    "X-SECRET": process.env.RELAY_SERVER_SECRET
                },
                followRedirects: true
            });
        }
        catch (e) {
            console.error("relay server init"); // TODO restart until success
            console.error(e);
            console.error(this.data.sock);
        }
        (_a = this.data.sock) === null || _a === void 0 ? void 0 : _a.on('message', (msg) => {
            var _a;
            const order = JSON.parse(JSON.parse(msg.toString())).order;
            console.error("ORDER: " + order.id);
            (_a = this.emit) === null || _a === void 0 ? void 0 : _a.call(this, 'newOrder', order);
        });
        // setInterval(() => console.error(this.data.sock.readyState), 1000)
        // this.data.sock.on('open', console.error)
    },
    handlers: {
        status() {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                return (_a = relayServer.data.sock) === null || _a === void 0 ? void 0 : _a.readyState;
            });
        }
    }
};
export default relayServer;
//# sourceMappingURL=relayServer.js.map
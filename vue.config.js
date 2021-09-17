// const fs = require('fs')
// const path = require('path')

module.exports = {
    devServer: {
        host: "127.0.0.1",
        port: 4545,
        disableHostCheck: true
    },
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true
        }
    }

}


const { exec } = require("child_process");

const services = {
    emit: () => {
    },


    events: {
        action(event, data) {
            if (data.action === "START") {
                if (data.service === "dymo_label_service") {

                    switch (process.platform) {
                        case "darwin":
                            exec("launchctl start com.dymo.dls.webservice", (err, stout, stderr) => {
                                let reply = {
                                    "error": err,
                                    "stout": stout,
                                    "stderr": stderr
                                }
                                event.reply('services_action_reply', reply)
                            })
                            break

                        case "win32":
                            throw Error("Not Implemented")
                            exec("") // TODO
                            break
                    }

                }
            }
        }
    }


}

export default services
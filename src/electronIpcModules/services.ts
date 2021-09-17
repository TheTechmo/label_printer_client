import { exec } from 'child_process'
import { IpcMainEvent } from 'electron'
import IpcModule from "./_ipcModule";

interface ServiceActionArgs {
    action: "START",
    service: string
}

const services: IpcModule = {
    emit() {},


    listeners: {
        action(event: IpcMainEvent, data: ServiceActionArgs) {
            if (data.action === "START") {
                if (data.service === "dymo_label_service") {

                    switch (process.platform) {
                        case "darwin":
                            exec("launchctl start com.dymo.dls.webservice", (err, stout, stderr) => {
                                const reply = {
                                    "error": err,
                                    "stout": stout,
                                    "stderr": stderr
                                }
                                event.reply('services_action_reply', reply)
                            })
                            break

                        case "win32":
                            throw Error("Not Implemented")
                            // exec("") // TODO
                            // break
                    }

                }
            }
        }
    }


}

export default services
import { exec, execFile } from 'child_process'
import { IpcMainEvent } from 'electron'
import IpcModule from "./_ipcModule";
import config from '../../config'

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
                            execFile(config.WINDOWS_DLS.PATH + '\\' + config.WINDOWS_DLS.FILE, (err, stout, stderr) => {
                                const reply = {
                                    "error": err,
                                    "stout": stout,
                                    "stderr": stderr
                                }
                                event.reply('services_action_reply', reply)
                            })
                            break
                    }

                }
            }
        }
    }


}

export default services

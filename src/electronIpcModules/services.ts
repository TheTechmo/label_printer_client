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
        // When we are asked by the frontend to action a service
        action(event: IpcMainEvent, data: ServiceActionArgs) {

            // START action
            if (data.action === "START") {

                // DLS service
                if (data.service === "dymo_label_service") {

                    // Handling depends on platform
                    // Why isn't linux here you may ask? Because I said so.
                    switch (process.platform) {

                        // macOS
                        case "darwin":

                            // Execute file
                            exec("launchctl start com.dymo.dls.webservice", (err, stout, stderr) => {
                                const reply = {
                                    "error": err,
                                    "stout": stout,
                                    "stderr": stderr
                                }

                                // Reply with info
                                event.reply('services_action_reply', reply)
                            })
                            break

                        // Windows
                        case "win32":

                            // start executable
                            execFile(config.WINDOWS_DLS.PATH + '\\' + config.WINDOWS_DLS.FILE, (err, stout, stderr) => {
                                const reply = {
                                    "error": err,
                                    "stout": stout,
                                    "stderr": stderr
                                }

                                // Reply with info
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

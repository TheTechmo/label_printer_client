import {IpcMainEvent, IpcMainInvokeEvent} from "electron";

interface IpcModule {
    data?: Object, // State
    handlers?: { // Handlers (like one-off events)
        [key: string]: (event?: IpcMainInvokeEvent, data?: any) => void
    },
    listeners?: { // Listeners (events that you can reply to)
        [key: string]: (event: IpcMainEvent, data?: any) => void
    },
    emit?: (channel: string, args: any) => void, // To get data out
    init?: () => void, // In case you need to establish something
}

export default IpcModule

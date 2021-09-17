import {IpcMainEvent, IpcMainInvokeEvent} from "electron";

interface IpcModule {
    data?: Object,
    handlers?: {
        [key: string]: (event?: IpcMainInvokeEvent, data?: any) => void
    },
    listeners?: {
        [key: string]: (event: IpcMainEvent, data?: any) => void
    },
    emit?: (channel: string, args: any) => void,
    init?: () => void,
}

export default IpcModule
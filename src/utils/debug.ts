export function orderItemDevLog(itemName: string | unknown, devStatus: boolean): Function {
    if (!devStatus) return (...a: any) => {}
    return (msg: string, ...args: any[]) => console.log("[%s] " + msg + (args.length > 0 ? ":" : ""), ...[itemName, ...args])
}

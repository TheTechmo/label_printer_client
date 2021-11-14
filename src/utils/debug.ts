
// Just a nice function to only print out order info when in dev mode
export function orderItemDevLog(itemName: string | unknown, devStatus: boolean): Function {
    // Doesn't do anything if not in dev mode
    if (!devStatus) return (...a: any) => {}

    // Give a function that has a preformatted message that variables can just be slotted into
    // Yes it hurts my brain just looking at it too
    return (msg: string, ...args: any[]) => console.log("[%s] " + msg + (args.length > 0 ? ":" : ""), ...[itemName, ...args])
}

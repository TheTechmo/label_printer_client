// TODO

declare module "dymojs" {

    export type Dymo = {
        constructor(options: {
            hostname: string,
            port: number,
            printerName: string
        }): Dymo

        get apiUrl(): string

        print(printerName: string, labelXml: string, labelSetXml?: string): Promise<string>

        renderLabel(labelXml: string): Promise<string>

        getStatus(): Promise<"true" | "false">

        getPrinters(): Promise<string>
    }

}
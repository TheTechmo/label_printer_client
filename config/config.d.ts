interface ITimeConstraints {
    FROM: string
    TO: string
}

interface IWindowsDls{
    PATH: string
    FILE: string
}

interface IRelayServer {
    URL: string
    PING_INTERVAL: number
}

interface IConfig {
    FAKE_LP_SERIAL: string
    ACCEPT_FAKE_LP: boolean
    TIME_CONSTRAINTS: ITimeConstraints
    LABEL_SERVICE_POLLING_INTERVAL: number
    RELAY_SERVER: IRelayServer
    SELECTED_PRINTER: string
    LABEL_NAME: string
    LABEL_DETAILS_MAX_CHARS: number
    WINDOWS_DLS: IWindowsDls
    ALLOWED_CATEGORIES: string[] | function(string)
}

export default IConfig

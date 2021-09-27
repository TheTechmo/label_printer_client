import Vue from 'vue'
import IConfig from '../../config/config'

declare module 'vue/types/vue' {
    interface Vue {
        $config: IConfig,
        $isDevEnv: boolean
    }

    interface App {
        printers: number
    }
}

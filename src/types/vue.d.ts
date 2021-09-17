import Vue from 'vue'
import IConfig from '../../config/config'

declare module 'vue/types/vue' {
    interface Vue {
        $config: IConfig
    }

    interface App {
        printers: number
    }
}
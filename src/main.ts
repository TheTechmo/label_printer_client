import '@babel/polyfill'
import 'mutationobserver-shim'
import Vue from 'vue'
import './plugins/bootstrap-vue'
import App from './App.vue'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import config from '../config'

// Import Bootstrap an BootstrapVue CSS files (order is important)
import './assets/scss/app.scss'

// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue)
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin)


Vue.config.productionTip = false

Vue.prototype.$config = config
Vue.prototype.$isDevEnv = process.env.NODE_ENV === "development"

new Vue({
  render: h => h(App),
}).$mount('#app')

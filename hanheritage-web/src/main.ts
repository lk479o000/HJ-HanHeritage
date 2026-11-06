import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { vPerm } from './directives/perm'
import './assets/styles/global.scss'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.directive('perm', vPerm)
app.mount('#app')

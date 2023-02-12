import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueSoonspace from 'vue-soonspace'

const app = createApp(App)
app.use(VueSoonspace).use(store).use(router).mount('#app')

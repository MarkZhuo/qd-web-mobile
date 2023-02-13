import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueSoonspace from 'vue-soonspace'
import '../public/iconfont/iconfont.css'
// import '../public/js/rem'

const app = createApp(App)
app.use(VueSoonspace).use(store).use(router).mount('#app')

import { createApp } from 'vue'
import { router } from './app/router'
import App from './app/App.vue'
import '@fontsource/bitter/latin-400.css'
import '@fontsource/bitter/latin-500.css'
import '@fontsource/bitter/latin-600.css'
import '@fontsource/caveat/latin-700.css'
import './styles/base.css'

createApp(App).use(router).mount('#app')

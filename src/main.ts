import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Rehydrate the user profile from a persisted token on app load. Fire-and-forget:
// guards rely only on the token, and a stale/invalid token is cleared via the
// axios 401 interceptor. We await the router so the first render is guard-ready.
const auth = useAuthStore()
if (auth.token) {
  void auth.fetchMe().catch(() => {
    /* handled by the 401 interceptor */
  })
}

router.isReady().then(() => {
  app.mount('#app')
})

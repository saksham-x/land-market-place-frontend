import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Rehydrate the user (and role) from a persisted token BEFORE the first
// navigation guard runs, so role-gated routes resolve correctly on refresh /
// deep-link. A stale/invalid token is cleared via the axios 401 interceptor.
async function bootstrap(): Promise<void> {
  const auth = useAuthStore()
  if (auth.token) {
    await auth.fetchMe().catch(() => {
      /* invalid token — handled by the 401 interceptor */
    })
  }
  await router.isReady()
  app.mount('#app')
}

void bootstrap()

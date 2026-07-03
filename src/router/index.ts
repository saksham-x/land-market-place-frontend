import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types'

// Augment route meta with our custom, strongly-typed fields.
declare module 'vue-router' {
  interface RouteMeta {
    /** Route requires an authenticated user. */
    requiresAuth?: boolean
    /** Route is only for guests; authenticated users are redirected home. */
    guestOnly?: boolean
    /**
     * Optional role gate. When set, an authenticated user whose role is not
     * in this list is redirected away. (Groundwork for later role-gating.)
     */
    roles?: Role[]
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { guestOnly: true },
  },
  // Catch-all → home (which itself guards for auth).
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'home' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// --- Global navigation guard ---
router.beforeEach((to) => {
  const auth = useAuthStore()
  const isAuthenticated = auth.isAuthenticated

  // Guest-only routes (login/register): send authed users home.
  if (to.meta.guestOnly && isAuthenticated) {
    return { name: 'home' }
  }

  // Protected routes: send anonymous users to login, remembering the target.
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Role gate (used by later phases; harmless when `roles` is unset).
  if (to.meta.requiresAuth && to.meta.roles?.length) {
    const role = auth.role
    if (!role || !to.meta.roles.includes(role)) {
      return { name: 'home' }
    }
  }

  return true
})

export default router

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
    // Smart landing: guests → public browse, authed users → their dashboard.
    path: '/',
    redirect: () => {
      const auth = useAuthStore()
      return auth.isAuthenticated ? { name: 'home' } : { name: 'browse' }
    },
  },
  {
    // Public browse — reachable whether logged in or out.
    path: '/browse',
    name: 'browse',
    component: () => import('@/views/BrowseView.vue'),
  },
  {
    // Public listing detail.
    path: '/listings/:id',
    name: 'listing-detail',
    component: () => import('@/views/ListingDetailView.vue'),
  },
  {
    // Authenticated dashboard/landing.
    path: '/home',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: true },
  },

  // --- Seller listing management (seller-only) ---
  {
    path: '/seller/listings',
    name: 'seller-listings',
    component: () => import('@/views/MyListingsView.vue'),
    meta: { requiresAuth: true, roles: ['seller'] },
  },
  {
    // Static segment must precede the dynamic ':id' route below.
    path: '/seller/listings/new',
    name: 'seller-listing-new',
    component: () => import('@/views/ListingFormView.vue'),
    meta: { requiresAuth: true, roles: ['seller'] },
  },
  {
    path: '/seller/listings/:id/edit',
    name: 'seller-listing-edit',
    component: () => import('@/views/ListingFormView.vue'),
    meta: { requiresAuth: true, roles: ['seller'] },
  },
  {
    path: '/seller/listings/:id',
    name: 'seller-listing-manage',
    component: () => import('@/views/ListingManageView.vue'),
    meta: { requiresAuth: true, roles: ['seller'] },
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
  // Catch-all → public browse.
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'browse' },
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

  // Role gate: authenticated users whose role isn't allowed are sent to the
  // public browse page. (User/role is loaded before the first guard runs; see
  // main.ts, which awaits fetchMe on boot.)
  if (to.meta.requiresAuth && to.meta.roles?.length) {
    const role = auth.role
    if (!role || !to.meta.roles.includes(role)) {
      return { name: 'browse' }
    }
  }

  return true
})

export default router

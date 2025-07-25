import { createRouter, createWebHistory } from 'vue-router'
import MainView from '@/views/MainView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: MainView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/nodemanager',
      name: 'nodemanager',
      component: () => import('../views/NodeManagerView.vue'),
    },
    {
      path: '/mapview',
      name: 'mapview',
      component: () => import('../components/MapView.vue'),
    }
  ],
})

export default router

import { createRouter, createWebHistory } from 'vue-router';
import COPView from '@/views/COPView.vue';
import CesiumOAuthCallback from '@/modules/cesium/CesiumOAuthCallback.vue';

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			name: 'home',
			component: COPView,
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
			path: '/mapview',
			name: 'mapview',
			component: () => import('../modules/map/components/MapView.vue'),
		},
		{
			path: '/oauth/cesium/callback',
			component: CesiumOAuthCallback,
		},
	],
});

export default router;

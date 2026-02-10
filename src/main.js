import './assets/main.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';

// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';

import App from './App.vue';
import router from './router/index.js';

const vuetify = createVuetify({
	components: {
		...components,
	},
	directives,
	icons: {
		defaultSet: 'mdi',
	},
	theme: {
		defaultTheme: 'dark',
	},
});

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

export { pinia };
const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(vuetify);
app.use(Toast, {
	position: 'top-center',
	transition: 'Vue-Toastification__fade',
	timeout: 2984,
	closeOnClick: true,
	pauseOnFocusLoss: true,
	pauseOnHover: true,
	draggable: true,
	draggablePercent: 0.1,
	showCloseButtonOnHover: true,
	hideProgressBar: true,
	closeButton: 'button',
	icon: true,
	rtl: false,
	filterBeforeCreate: (toast, toasts) => {
    if (toasts.filter(
      t => t.type === toast.type
    ).length !== 0) {
      // Returning false discards the toast
      return false;
    }
    // You can modify the toast if you want
    return toast;
  }
});

app.mount('#app');

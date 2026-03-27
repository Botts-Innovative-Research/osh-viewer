// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';
import { VBtn } from 'vuetify/components';

export const vuetify = createVuetify({
	components,
	directives,
	icons: {
		defaultSet: 'mdi',
	},
	theme: {
		defaultTheme: 'dark',
	},
	aliases: {
		IconButton: VBtn,
	},
	defaults: {
		VTab: {
			rounded: 0,
		},
		VTreeview: {
			VBtn: {
				rounded: 'circle',
			},
		},
		VToolbar: {
			VBtn: {
				rounded: 'circle',
			},
		},
		VBtn: {
			rounded: 'lg',
		},
		// Custom icon button
		IconButton: {
			icon: true,
			rounded: 'circle',
			size: 'small',
		},
		VCard: {
			rounded: 'lg',
		},
		VStepper: {
			class: 'elevation-0',
			VStepperHeader: {
				class: 'elevation-0',
			},
			VStepperWindow: {
				class: 'pa-2',
			},
		},
		VExpansionPanels: {
			rounded: 0,
		},
		VList: {
			VListItem: {
				rounded: 'lg',
			},
		},
		VTooltip: {
			openDelay: 500,
		},
		VAlert: {
			rounded: 'lg',
		},
	},
});
// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';

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
		IconButton: components.VBtn,
	},
	defaults: {
		VTab: {
			rounded: 0,
		},
		VTreeview: {
			VBtn: {
				rounded: '100%',
			},
		},
		VToolbar: {
			VBtn: {
				rounded: '100%',
			},
		},
		VBtn: {
			rounded: 10,
		},
		// Custom icon button
		IconButton: {
			icon: true,
			rounded: '100%',
			size: 'small',
		},
		VCard: {
			rounded: 10,
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
			rounded: [20, 8],
			gap: 8,
		},
		VList: {
			VListItem: {
				rounded: 10,
			},
		},
		VTooltip: {
			openDelay: 500,
		},
		VAlert: {
			rounded: 10,
		},
		VAutocomplete: {
			variant: 'outlined',
			rounded: 10,
		},
		VSelect: {
			variant: 'outlined',
			rounded: 10,
		},
		VTextField: {
			variant: 'outlined',
			rounded: 10,
		},
	},
});

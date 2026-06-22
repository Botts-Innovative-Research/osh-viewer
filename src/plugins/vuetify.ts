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
		themes: {
			dark: {
				dark: true,
				colors: {
					primary: '#E64A19',
					secondary: '#03A9F4',
				},
			},
			light: {
				dark: false,
				colors: {
					primary: '#E64A19',
					secondary: '#03A9F4',
				},
			},
		},
	},
	aliases: {
		IconButton: components.VBtn,
	},
	defaults: {
		VTab: {
			rounded: 0,
		},
		VToolbar: {
			VBtn: {
				rounded: '100%',
				color: 'on-primary',
			},
		},
		VBtn: {
			rounded: 10,
			elevation: 0,
		},
		// Custom icon button
		IconButton: {
			icon: true,
			rounded: 10,
			size: 'small',
		},
		VCard: {
			rounded: 20,
			elevation: 0,
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
			rounded: [15, 15],
			gap: 8,
			static: true,
			elevation: 0,
		},
		VExpansionPanel: {
			rounded: 15,
			gap: 8,
			class: 'border-sm',
		},
		VExpansionPanelText: {
			class: 'pa-0',
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
			class: 'pl-2',
		},
		VSelect: {
			variant: 'outlined',
			rounded: 10,
			class: 'pl-2',
		},
		VTextField: {
			variant: 'outlined',
			rounded: 10,
		},
	},
});

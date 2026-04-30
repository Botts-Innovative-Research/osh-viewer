
import { assertArray, isDefined } from 'osh-js/core/utils/Utils';
import { endLLAFromPointBearing } from 'osh-js/source/core/utils/GeoUtils';
import { assertObject, hasValue } from 'osh-js/source/core/utils/Utils';
import Layer from '../Layer.js';

class LoBLayer extends Layer {
	/**
	 * Creates the LoB Layer
	 * @param {Object} properties
	 * @param {Object[]} [properties.locations] - defines the default location of the LoB [lat, lon]
	 * @param {Number} [properties.bearing=0] - defines the bearing of the LoB in degrees
	 * @param {Number} [properties.length=1000] - defines the length of the LoB in meters
	 * @param {Number} [properties.icon] - defines the icon image of the point marker
	 * @param {String} [properties.iconColor="#000000"] - the icon color
	 * @param {Number[]} [properties.iconSize=[16,16]] - defines the icon size of the point marker
	 * @param {Number[]} [properties.labelOffset=[0,0]] - defines the label offset of the point marker
	 * @param {String} [properties.color='red'] - defines the color of the LoB
	 * @param {Number} [properties.weight=1] - defines the weight of the LoB
	 * @param {Number} [properties.opacity=1] - defines the opacity of the LoB
	 * @param {Function} [properties.getLocation] - defines a function to return the location
	 * @param {Function} [properties.getBearing] - defines a function to return the bearing
	 * @param {Function} [properties.getLength] - defines a function to return the length
	 * @param {Function} [properties.getOrigin] - defines a function to return the origin point {x:lat, y:lon}
	 * @param {Function} [properties.getOriginAndBearing] - defines a function to return both origin and bearing {origin: {x:lat, y:lon}, bearing: number}
	 */
	constructor(properties) {
		super(properties);
		this.type = 'lob';
	}

	// call by super class
	init(properties = this.properties) {
		super.init(properties);
		const props = {
			lobId: () => this.getLobId(),
			locations: [],
			bearing: 0,
			length: 1000,
			color: 'red',
			weight: 1,
			opacity: 1,
			maxPoints: 2,
			location: null,
			orientation: {heading: 0},
			icon: null,
			iconAnchor: [16, 16],
			iconSize: [16, 16],
			iconScale: 1.0,
			iconColor: undefined,
			iconColor: undefined,
			iconOpacity: 0.75,
			label: null,
			labelColor: undefined,
			labelOutlineColor: undefined,
			labelBackgroundColor: undefined,
			labelSize: 16,
			labelScale: 1.0,
			labelOffset: [0, 0],
			zoomLevel: 15,
			defaultToTerrainElevation: false,
			zIndex: 0,
			allowBillboardRotation: true,
			options: {},
			getIcon: null,
			getLabel: null,
			clampToGround: true,
		};

		if (hasValue(properties.location)) {
			assertObject(properties.location, 'location');
			props.location = properties.location;
		}

		if (hasValue(properties.locations)) {
			assertArray(properties.locations, 'locations');
			props.locations = properties.locations;
		}

		if (isDefined(properties.bearing)) {
			props.bearing = properties.bearing;
		}

		if (isDefined(properties.length)) {
			props.length = properties.length;
		}

		if (isDefined(properties.label)) {
			props.label = properties.label;
		}

		if (hasValue(properties.color)) {
			props.color = properties.color;
		}

		if (hasValue(properties.weight)) {
			props.weight = properties.weight;
		}

		if (hasValue(properties.opacity)) {
			props.opacity = properties.opacity;
		}

		if (hasValue(properties.icon)) {
			props.icon = properties.icon;
		}

		if (hasValue(properties.iconSize)) {
			props.iconSize = properties.iconSize;
		}

		if (hasValue(properties.iconColor)) {
			props.iconColor = properties.iconColor;
		}

		if (hasValue(properties.labelOffset)) {
			props.labelOffset = properties.labelOffset;
		}

		if (isDefined(properties.polylineId)) {
			props.polylineId = properties.polylineId;
		} else if (isDefined(properties.lobId)) {
			props.polylineId = properties.lobId;
		}
		if (isDefined(properties.markerId)) {
			props.markerId = properties.markerId;
		} else if (isDefined(properties.lobId)) {
			props.markerId = properties.lobId;
		}
		if (isDefined(properties.clampToGround)) {
			props.clampToGround = properties.clampToGround;
		}

		this.definedId('lobId', props);

		if (this.checkFn("getLobId")) {
			const syncIds = async (rec, timestamp, options) => {
				this.updateProperty('polylineId', this.getId());
				this.updateProperty('markerId', this.getId());
			};
			this.addFn(this.getDataSourcesIdsByProperty('getLobId'), syncIds);
		}

		// if (isDefined(properties.getOrigin)) {
		if (this.checkFn("getOrigin")) {
			const fn = async (rec, timestamp, options) => {
				const origin = await this.getFunc('getOrigin')(rec, timestamp, options);
				if (!origin){
					console.warn('[LOB] getOrigin is invalid')
					return;
				}
				const currentProps = this.getCurrentProps();
				const endPoint = endLLAFromPointBearing(
					origin,
					currentProps.bearing,
					currentProps.length
				);
				this.updateProperty('location', origin);
				this.updateProperty('locations', [origin, endPoint]);
			};
			this.addFn(this.getDataSourcesIdsByProperty('getOrigin'), fn);
		}

		// if (isDefined(properties.getBearing)) {
		if (this.checkFn("getBearing")) {
			const fn = async(rec, timestamp, options) => {
				const bearing = await this.getFunc('getBearing')(rec, timestamp, options);
				const currentProps = this.getCurrentProps();
				if (!currentProps.locations || !currentProps.locations[0]) {
					console.warn('[LOB] getBearing called but origin not set');
					return;
				}
				const endPoint = endLLAFromPointBearing(
					currentProps.locations[0],
					bearing,
					currentProps.length
				);
				this.updateProperty('locations', [currentProps.locations[0], endPoint]);
			}
			this.addFn(this.getDataSourcesIdsByProperty('getBearing'), fn);
		}

		// if(isDefined(properties.getOriginAndBearing)) {
		if (this.checkFn("getOriginAndBearing")) {
			const fn = async(rec, timestamp, options) => {
				console.log('[LoB] getOriginAndBearing called');
				const { origin, bearing } = await this.getFunc('getOriginAndBearing')(rec, timestamp, options);
				if (!origin || typeof origin.x === 'undefined' || typeof origin.y === 'undefined') {
					console.warn('[LoB] getOriginAndBearing returned invalid origin:', origin);
					return;
				}
				const currentProps = this.getCurrentProps();
				const endPoint = endLLAFromPointBearing(
					origin,
					bearing,
					currentProps.length
				);
				console.log('[LoB] getOriginAndBearing', origin, bearing, endPoint);
				this.updateProperty('location', origin);
				this.updateProperty('locations', [origin, endPoint]);
			}
			this.addFn(this.getDataSourcesIdsByProperty('getOriginAndBearing'), fn);
		}

		if (this.checkFn("getIcon")) {
			this.updateProperty('icon', this.getFunc('getIcon'));
		}

		if (this.checkFn("getLabel")) {
			this.updateProperty('label', this.getFunc('getLabel'));
		}
	}
}

export default LoBLayer;

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
			options: {}
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

		this.definedId('lobId', props);

		// if (isDefined(properties.getOrigin)) {
		if (this.checkFn("getOrigin")) {
			const fn = async (rec, timestamp, options) => {
				const origin = await this.getFunc('getOrigin')(rec, timestamp, options);
				const endPoint = endLLAFromPointBearing(
					origin,
					this.props.bearing,
					this.props.length
				);
				this.updateProperty('location', origin);
				this.updateProperty('locations', [origin, endPoint]);
			};
			this.addFn(this.getOrigin('getOrigin'), fn);
		}

		// if (isDefined(properties.getBearing)) {
		if (this.checkFn("getBearing")) {
			const fn = async(rec, timestamp, options) => {
				const bearing = await this.getFunc('getBearing')(rec, timestamp, options);
				const endPoint = endLLAFromPointBearing(
					props.locations[0],
					bearing,
					props.length
				);
				this.updateProperty('locations', [this.props.locations[0], endPoint]);
			}
			this.addFn(this.getBearing('getBearing'), fn);
		}

		// if(isDefined(properties.getOriginAndBearing)) {
		if (this.checkFn("getOriginAndBearing")) {
			const fn = async(rec, timestamp, options) => {
				console.log('[LoB] getOriginAndBearing called');
				const { origin, bearing } = await this.getFunc('getOriginAndBearing')(rec, timestamp, options);
				const endPoint = endLLAFromPointBearing(
					origin,
					bearing,
					props.length
				);
				console.log('[LoB] getOriginAndBearing', origin, bearing, endPoint);
				this.updateProperty('location', origin);
				this.updateProperty('locations', [origin, endPoint]);
			}
			this.addFn(this.getDataSourcesIdsByProperty('getOriginAndBearing'), fn);
		}
	}
}

export default LoBLayer;
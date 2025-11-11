import {hasValue, randomUUID} from "../../utils/Utils.js";
import Layer from "./Layer.js";


/**
 Creates a line of bearing Styler
 */
class LineOfBearingLayer extends Layer {
  /**
   *
   @param properties
   */
  constructor(properties) {
    super(properties);
    this.type = 'polyline';
  }

  // call by super class
  init(properties = this.properties) {
    super.init(properties);
    const props = {
      polylineId: () => this.getId(),
      locations: {},
      color: 'red',
      weight: 1,
      opacity: 1,
      smoothFactor: 1,
      maxPoints: 10,
      clampToGround: false,
    };

    if (hasValue(properties.color)) {
      props.color = properties.color;
    }

    if (hasValue(properties.weight)) {
      props.weight = properties.weight;
    }

    if (hasValue(properties.opacity)) {
      props.opacity = properties.opacity;
    }

    if (hasValue(properties.smoothFactor)) {
      props.smoothFactor = properties.smoothFactor;
    }

    if (hasValue(properties.maxPoints)) {
      props.maxPoints = properties.maxPoints;
    }

    if (hasValue(properties.clampToGround)) {
      props.clampToGround = properties.clampToGround;
    }

    this.definedId('polylineId', props);

    let that = this;

    if (hasValue(properties.getLocation)) {
      let fn = async (rec, timestamp, options) => {
        that.updateProperty('locations', that.getFunc('getLocation')(rec));
      };
      this.addFn(that.getDataSourcesIdsByProperty('getLocation'), fn);
    }

    if (hasValue(properties.getColor)) {
      let fn = function (rec) {
        that.updateProperty('color', that.getFunc('getColor')(rec));
      };
      this.addFn(that.getDataSourcesIdsByProperty('getColor'), fn);
    }

    if (hasValue(properties.getWeight)) {
      let fn = function (rec) {
        that.updateProperty('weight', that.getFunc('getWeight')(rec));
      };
      this.addFn(that.getDataSourcesIdsByProperty('getWeight'), fn);
    }

    if (hasValue(properties.getOpacity)) {
      let fn = function (rec) {
        that.updateProperty('opacity', that.getFunc('getOpacity')(rec));
      };
      this.addFn(that.getDataSourcesIdsByProperty('getOpacity'), fn);
    }

    if (hasValue(properties.getSmoothFactor)) {
      let fn = function (rec) {
        that.updateProperty(
          'smoothFactor',
          that.getFunc('getSmoothFactor')(rec)
        );
      };
      this.addFn(that.getDataSourcesIdsByProperty('getSmoothFactor'), fn);
    }
  }

  /**
   *
   */
  clear() {
    const currentProps = this.getCurrentProps();
    currentProps.locations = [];
  }
}

export default LineOfBearingLayer;

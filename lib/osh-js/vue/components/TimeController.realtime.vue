<template>
  <div :id="'control-component-'+this.id" class="control">
    <RangeSliderRealtime
        :start-timestamp="masterTime"
        :dataSynchronizer="dataSynchronizer"
        ref="rangeSliderRef"
        v-if="rangeSliderInit && init"
    ></RangeSliderRealtime>
    <div class="buttons">
      <div class="actions"> <!-- Next Page Buttons -->
        <div class="datasource-actions live">
          <a :id="'replay-btn-'+id" class="control-btn replay" @click="toggleReplay">
            <i class="fa fa-history"></i>
          </a>
        </div>
        <span :id="'current-time-'+id" v-if="masterTime" v-html=parseTime(masterTime)></span>
        <span class="chip live">LIVE</span>
        <div class="out-of-sync" v-if="Object.entries(outOfSync).length > 0">
          <a :id="'out-of-sync-btn-'+id" class="control-btn out-of-sync">
            <i class="fa fa-exclamation-triangle" data-toggle="tooltip" :title="renderOutOfSync()"></i>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RangeSliderViewRealtime from '../../ext/ui/view/rangeslider/RangeSliderView.realtime.js';
import {randomUUID} from '../../core/utils/Utils.js';
import {isDefined} from '../../core/utils/Utils';
import {assertDefined, throttle, debounce} from "../../core/utils/Utils";
import {EventType} from "../../core/event/EventType";
import {Mode} from "../../core/datasource/Mode";
import RangeSliderRealtime from "./RangeSlider.realtime.vue";

/**
 * @module osh-vue/TimeController
 * @desc TimeController component to control timeline of the datasources
 * @vue-prop {DataSource}  [dataSource] - DataSource object
 * @vue-prop {DataSynchronizer} [dataSynchronizer] - DataSynchronizer object
 * @vue-prop {Number} [debounce=800] Debounce time before executing refresh while clicking on backward/forward/replaySpeed action. In millis
 * @vue-prop {Function} [parseTime] - Function used to parse the time and display next to the actions buttons. Return value can be text or HTML.
 * @vue-event {String} [event='toggle-replay'] - Emit event's name after time change
 * @vue-event {Boolean} [supportReplay=false] - Defines if the timeController support replay mode (and display corresponding button)
 */
export default {
  name: "TimeControllerRealtime",
  components: {RangeSliderRealtime},
  props: {
    dataSource: {
      type: Object
    },
    dataSynchronizer: {
      type: Object
    },
    debounce: {
      type: Number,
      default: () => 800 // 800ms
    },
    parseTime: {
      type: Function,
      default: function parseDate(timestamp) {
        const date = new Date(timestamp);
        const isoDate = date.toISOString();

        const smallDate = isoDate.substr(0, 10);
        const smallTime = isoDate.substr(11, 8);

        return '<div class="box-time"><div><strong>' + smallTime + '</strong></div><div><i><small>(' + smallDate + ')</small></i></div></div>';
      }
    }
  },
  data() {
    return {
      id: randomUUID(),
      event: null,
      dataSourceObject: null,
      rangeSliderInit: false,
      init: false,
      lastSynchronizedTimestamp: -1,
      outOfSync: {},
      masterTime: undefined
    };
  },
  watch: {
    event(newValue) {
      this.$emit('event', {
        event: newValue
      });
    }
  },
  beforeMount() {
    assertDefined(this.getDataSourceObject(), 'either dataSource properties or dataSynchronizer must be defined');
    this.dataSourceObject = this.getDataSourceObject();
  },
  updated() {
    // this.initComp();
  },
  mounted() {
    this.initComp();
  },
  methods: {
    async initComp() {
      if(!this.init) {
        assertDefined(this.getDataSourceObject(), 'either dataSource properties or dataSynchronizer must be defined');
        this.subscribeEvents();
        this.displayConsoleWarningIncompatibleVersionThrottle = throttle(this.displayConsoleWarningIncompatibleVersion.bind(this), this.debounce);
        this.init = true;
      }
    },
    displayConsoleWarningIncompatibleVersionThrottle() {

    },
    displayConsoleWarningIncompatibleVersion() {
      console.warn('Incompatible data version');
    },
    subscribeEvents() {
      // listen for BC
      const isDataSynchronizer = isDefined(this.dataSynchronizer);
      this.dataSourceObject.subscribe(message => {
        if(isDataSynchronizer) {
          if(message.type === EventType.MASTER_TIME) {
            // consider here dataSynchronizer sends data in time order
            const contains = message.dataSourceId in this.outOfSync;
            if (message.timestamp < this.lastSynchronizedTimestamp) {
              if (!contains) {
                this.dataSynchronizer.getDataSources().forEach(datasource => {
                  if (datasource.id === message.dataSourceId) {
                    this.outOfSync[datasource.id] = datasource;
                  }
                });
              }
              return;
            } else if (contains) {
              // check that the datasource is not out of sync anymore
              delete this.outOfSync[message.dataSourceId];
            }
            this.lastSynchronizedTimestamp = message.timestamp;
            this.masterTime = message.timestamp;
            if(!this.rangeSliderInit) {
              this.rangeSliderInit = true;
            }
          }
        } else if(message.type === EventType.LAST_TIME) {
          // single dataSource
          this.masterTime = message.timestamp;
          if(!this.rangeSliderInit) {
            this.rangeSliderInit = true;
          }
        }
      }, [EventType.TIME_CHANGED, EventType.MASTER_TIME, EventType.LAST_TIME, EventType.DATA]);
    },
    resetMasterTime() {
      // reset master time
      this.lastSynchronizedTimestamp = -1;
      this.outOfSync = {};
    },

    getDataSourceObject() {
      return (isDefined(this.dataSynchronizer)) ? this.dataSynchronizer : this.dataSource;
    },
    async toggleReplay() {
      this.on();
    },
    on() {
      this.$emit('event', {
        name: 'toggle-replay',
        active: true,
        lastTimestamp: this.lastSynchronizedTimestamp
      });
    }
    ,
    withLeadingZeros(dt) {
      return (dt < 10 ? '0' : '') + dt;
    },
    renderOutOfSync() {
      let content = '';
      for(let key in this.outOfSync) {
        content += this.outOfSync[key].name + ' is out of sync\n';
      }
      return content;
    }
  },
  // vuejs 3.x
  beforeUnmount() {
    const ref = this.$refs.rangeSliderRef;
    if(ref) {
      ref.destroy();
    }
  },
  // vuejs 2.x
  beforeDestroy() {
    const ref = this.$refs.rangeSliderRef;
    if(ref) {
      ref.destroy();
    }
  }
}
</script>
<!-- optional dialog styles, see example -->
<style scoped>
.control {
  width: 100%;
  position: relative;
  bottom: 0px;
  font-family: Sans-Serif;
  background: linear-gradient(to bottom, rgba(116, 117, 119, .8) 0, rgba(58, 68, 82, .8) 11%, rgba(46, 50, 56, .8) 46%, rgba(53, 53, 53, .8) 81%, rgba(53, 53, 53, .8) 100%);
}

.control a {
  -webkit-transition: all 0.5s ease-in-out;
  -moz-transition: all 0.5s ease-in-out;
  -o-transition: all 0.5s ease-in-out;
  transition: all 0.5s ease-in-out;
}

.control .datasource-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-left: 10px;
  width: 450px;
}

.control .control-btn {
  padding: 0px 10px 0px 0;
}
</style>

<style>
/** reduce bar size **/
.control .noUi-horizontal {
  height: 3px;
}

.control .control-back-for {
  width: 80px;
}

.control .box-time small {
  font-size: 60%;
}

.control .box-time {
  display: flex;
  flex-direction: column;
  height: 20px;
  line-height: 12px;
  min-width: 65px;
  margin-bottom: 5px;
}

.control .control-back-for {
  display: flex;
}

.control .control-time {
  display: flex;
}

.control a[disabled] {
  color: gray;
  pointer-events: none;
}

.control .noUi-target {
  background: #FAFAFA;
  border-radius: unset;
  border: unset;
  box-shadow: unset;
}

/** reduce handles **/

.noUi-horizontal {
  width: 100%;
}

.control .fa-exclamation-triangle {
  font-size: 19px;
  margin-left: 10px;
  animation: blinker 500ms cubic-bezier(.5, 0, 1, 1) infinite alternate;
}

@keyframes blinker {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.control .fa-history {
  font-size: 19px;
}

.control button svg, .control a svg {
  width: 30px;
}

.control .buttons {
  color: lightgray;
}

.control-btn.clicked {
  cursor: pointer;
  color: #00B5B8;
}

.control-btn.out-of-sync {
  cursor: pointer;
  color: #d97100;
}

.control-btn:hover {
  cursor: pointer;
  color: #00B5B8;
}

.control {
  background-color: #3d3d3d !important;
  margin: 15px 0 0 0;
  padding: 0 0 5px 0;
}

.control-btn:active {
  color: #00B5B8;
}

.control .live {
  margin-left: 10px;
  top: -1px;
}

.control .live > span {
  font-size: 12px;
  font-weight: 700;
  color: #00B5B8;
}

.control .buttons .actions {
  display: flex;
  align-items: center;
  padding: 45px 5px 5px 0px;
}

.control .noUi-pips-horizontal {
  padding: 0px 0;
}

.noUi-value-horizontal {
  -webkit-transform: translate(-50%, 80%);
  transform: translate(-50%, 80%);
}

.control .buttons .time {
  font-family: "YouTube Noto", Roboto, Arial, Helvetica, sans-serif;
  line-height: 20px;
}

.control {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.control .noUi-handle:after, .noUi-handle:before {
  background: #989898;
}

.control .v-chip.v-size--default {
  height: 18px;
  top: -2px;
  font-size: 13px; /* according to font-family: sans-serif */
  padding-top: 1px; /* according to font-family: sans-serif */
}

.control .control-speed-content {
  margin-right: 10px;
  font-weight: 700;
}

.control .noUi-horizontal .noUi-handle {
  width: 20px;
  height: 25px;
  right: -10px;
  top: -12px;
}

.control .noUi-handle:after, .noUi-handle:before {
  left: 5px;
}

.control .noUi-handle:after, .noUi-handle:after {
  left: 10px;
}

.control .noUi-connect {
  background: rgba(0, 0, 0, 0.25);
}

.control .noUi-connects {
  height: 34px;
  top: -15px;
}

.control .noUi-horizontal {
  height: 0px;
}

.control .control-time {
  width: 150px;
}

.control .datasource-actions.live {
  justify-content: unset;
  align-items: unset;
  width: unset;
}

.control .datasource-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-left: 10px;
  width: 450px;
}

.chip.live {
  border: solid 1px black;
  background: #e0e0e0;
  height: 18px;
  top: -2px;
  font-size: 13px;
  padding-top: 1px;
  align-items: center;
  cursor: default;
  display: inline-flex;
  line-height: 20px;
  max-width: 100%;
  outline: none;
  overflow: hidden;
  padding: 0 12px;
  position: relative;
  text-decoration: none;
  transition-duration: .28s;
  transition-property: box-shadow,opacity;
  transition-timing-function: cubic-bezier(.4,0,.2,1);
  vertical-align: middle;
  white-space: nowrap;
  border-color: rgba(0,0,0,.12);
  color: rgba(0,0,0,.87);
  border-radius: 16px;
  vertical-align: middle;
  margin-left:10px;
  align-items: baseline;
}
</style>

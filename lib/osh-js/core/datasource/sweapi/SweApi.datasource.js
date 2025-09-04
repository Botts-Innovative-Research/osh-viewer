/***************************** BEGIN LICENSE BLOCK ***************************

 The contents of this file are subject to the Mozilla Public License, v. 2.0.
 If a copy of the MPL was not distributed with this file, You can obtain one
 at http://mozilla.org/MPL/2.0/.

 Software distributed under the License is distributed on an "AS IS" basis,
 WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 for the specific language governing rights and limitations under the License.

 Copyright (C) 2015-2022 Georobotix Inc. All Rights Reserved.

 Author: Mathieu Dhainaut <mathieu.dhainaut@gmail.com>

 ******************************* END LICENSE BLOCK ***************************/
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import TimeSeriesDatasource from "../TimeSeries.datasource";
import { Mode } from "../Mode";
import SweApiDatasourceUpdater from "./SweApi.datasource.updater";
var SweApi = /** @class */ (function (_super) {
    __extends(SweApi, _super);
    /**
     * @param {String} name - the datasource name
     * @param {Object} properties - the datasource properties
     * @param {String} properties.protocol - defines the protocol of the datasource. @see {@link DataConnector}, 'http', 'ws', 'mqtt', 'file', 'topic'
     * @param {String} properties.endpointUrl the endpoint url, this property is ignored in case of using 'mqtt' protocol, the properties.mqttOpts.endpointUrl will be used instead
     * @param {String} properties.resource the resource, /procedures, /fois, /observations, /tasks, /datastreams/4778/obs
     * @param {Boolean} properties.tls - defines if use secure TLS connection
     * @param {Boolean} properties.connectorOpts - connector specific Opts
     * @param {Object} [properties.mqttOpts={}] - the Mqtt options if protocol is 'mqtt'
     * @param {String} properties.mqttOpts.prefix - the Mqtt prefix value
     * @param {String} properties.mqttOpts.endpointUrl - the Mqtt specific endpointUrl
     * @param {Number} [properties.responseFormat=application/om+json] the response format (e.g application/om+json)
     * @param {String[]} [properties.parentId=undefined] the parent id
     * @param {String[]} [properties.keywords=undefined] the keyword ids
     * @param {String[]} [properties.includedProps=undefined] the included properties
     * @param {String[]} [properties.excludedProps=undefined] the excluded properties
     * @param {string} [properties.roi=undefined] - WKT geometry and operator to filter resources on their location or geometry
     * @param {String[]} [properties.featureOfInterest=undefined] Comma separated list of feature of interest IDs to get observations for.
     * @param {String[]} [properties.observedProperty=undefined] Comma separated list of observed property URIs to get observations for.
     * @param {String[]} [properties.prefetchBatchSize=250] Number of elements to prefetch at a time
     * @param {String[]} [properties.prefetchBatchDuration=5000] Duration before prefetching the next batch. N.b the next batch will be prefetched at 80% of this duration
     */
    function SweApi(name, properties) {
        return _super.call(this, name, __assign({ reconnectTimeout: 1000 * 5, reconnectRetry: 10, startTime: 'now', endTime: '2055-01-01T00:00:00Z', tls: true, responseFormat: 'application/swe+json', protocol: 'http', type: 'SweApiStream', mode: Mode.REAL_TIME, prefetchBatchSize: 250, prefetchBatchDuration: 5000, connectorOpts: {} }, properties)) || this;
    }
    SweApi.prototype.createTimeUpdater = function () {
        return __awaiter(this, void 0, void 0, function () {
            var first_1;
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.timeUpdater) {
                    this.timeUpdater = new SweApiDatasourceUpdater(this.properties);
                    first_1 = true;
                    this.timeUpdater.onTimeChanged = function (min, max) {
                        if (first_1) {
                            _this.setMinTime(min);
                            first_1 = false;
                        }
                        _this.setMaxTime(max);
                        if (_this.getDataSynchronizer()) {
                            _this.getDataSynchronizer().minMaxChanged(first_1);
                        }
                    };
                    this.timeUpdater.onError = function (err) { return reject(); };
                    return [2 /*return*/, this.timeUpdater.start()];
                } // TO CHECK: if timeUpdater has been created multiple times. Start() should not return anything
                return [2 /*return*/];
            });
        });
    };
    SweApi.prototype.destroyTimeUpdater = function () {
        if (this.timeUpdater) {
            this.timeUpdater.destroy();
        }
        this.timeUpdater = undefined;
    };
    return SweApi;
}(TimeSeriesDatasource));
export default SweApi;
//# sourceMappingURL=SweApi.datasource.js.map
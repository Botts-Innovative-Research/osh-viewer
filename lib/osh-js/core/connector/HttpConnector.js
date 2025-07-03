/***************************** BEGIN LICENSE BLOCK ***************************

 The contents of this file are subject to the Mozilla Public License, v. 2.0.
 If a copy of the MPL was not distributed with this file, You can obtain one
 at http://mozilla.org/MPL/2.0/.

 Software distributed under the License is distributed on an "AS IS" basis,
 WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 for the specific language governing rights and limitations under the License.

 Copyright (C) 2015-2020 Mathieu Dhainaut. All Rights Reserved.

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
import DataConnector from './DataConnector.js';
import { isDefined } from '../utils/Utils.js';
import { Status } from './Status.js';
/**
 * Defines the AjaxConnector to connect to a remote server by making AjaxRequest.
 * @extends DataConnector
 * @example
 * import Ajax from 'core/protocol/Ajax.js';
 *
 * let request = ...;
 * let protocol = new Ajax(url);
 *
 * // handle onSuccess
 * protocol.onSuccess = function(event) {
 *  // does something
 * }
 *
 * protocol.onError = function(event) {
 *  // does something
 * }
 *
 * // send request
 * protocol.sendRequest(request);
 *
 */
var HttpConnector = /** @class */ (function (_super) {
    __extends(HttpConnector, _super);
    /**
     * Creates Ajax.
     * @param {String} url -
     * @param {Object} properties -
     * @param {String} properties.method -
     * @param {String} properties.headers -
     */
    function HttpConnector(url, properties) {
        var _this = _super.call(this, url, properties) || this;
        _this.method = "POST";
        if (isDefined(properties)) {
            if (properties.method) {
                _this.method = properties.method;
            }
            if (properties.headers) {
                _this.headers = properties.headers;
            }
        }
        return _this;
    }
    /**
     * Sends the request to the defined server.
     * @param {String} extraUrl - extra url to append to the url
     * @param {String} queryString - get query parameters
     */
    HttpConnector.prototype.doRequest = function (extraUrl, queryString, responseType) {
        if (extraUrl === void 0) { extraUrl = ''; }
        if (queryString === void 0) { queryString = undefined; }
        if (responseType === void 0) { responseType = undefined; }
        return __awaiter(this, void 0, void 0, function () {
            var domain, fullUrl, that, promiseResponse, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        domain = this.getUrl();
                        fullUrl = domain + extraUrl;
                        if (isDefined(queryString)) {
                            fullUrl += '?' + queryString;
                        }
                        that = this;
                        promiseResponse = fetch(fullUrl, {
                            method: this.method,
                            headers: this.headers
                        })
                            .then(function process(response) {
                            if (!response.ok) {
                                var err = new Error("Got ".concat(response.status, " response from ").concat(domain));
                                err.response = response;
                                throw err;
                            }
                            // if(responseTypeVar === 'application/json') {
                            //     return response.json();
                            // } else if(responseTypeVar === 'plain/text'){
                            //     return response.text();
                            // } else {
                            return response.arrayBuffer();
                            // const reader = response.body.getReader();
                            // reader.read().then(function processText({ done, value }) {
                            //     console.log(value);
                            //     return reader.read().then(processText)
                            // });
                        })
                            // Create a new response out of the stream
                            .catch(function (err) { return console.error(err); });
                        return [4 /*yield*/, promiseResponse];
                    case 1:
                        response = _a.sent();
                        this.onMessage(response);
                        return [2 /*return*/, response];
                }
            });
        });
    };
    HttpConnector.prototype.postRequest = function (extraUrl, payload, responseType) {
        if (extraUrl === void 0) { extraUrl = ''; }
        if (payload === void 0) { payload = {}; }
        if (responseType === void 0) { responseType = undefined; }
        return __awaiter(this, void 0, void 0, function () {
            var fullUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fullUrl = this.getUrl() + extraUrl;
                        // default
                        return [4 /*yield*/, fetch(fullUrl, {
                                method: 'POST',
                                headers: __assign({ 'Accept': 'application/json, text/plain, */*', 'Content-Type': 'application/json' }, this.headers),
                                body: payload
                            })];
                    case 1:
                        // default
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * This is the callback method in case of getting error connection.
     * @param event The error details
     * @event
     */
    HttpConnector.prototype.onError = function (event) {
    };
    /**
     * This is the callback method in case of getting success connection.
     * @param event
     * @event
     */
    HttpConnector.prototype.onMessage = function (event) {
    };
    HttpConnector.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    /**
     * Sends the request
     * @private
     */
    HttpConnector.prototype.connect = function () {
        return this.doRequest();
    };
    HttpConnector.prototype.isConnected = function () {
        return false;
    };
    return HttpConnector;
}(DataConnector));
export default HttpConnector;
//# sourceMappingURL=HttpConnector.js.map
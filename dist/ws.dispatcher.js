"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsDispatcher = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const constants_1 = require("./common/constants");
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const async_retry_1 = __importDefault(require("async-retry"));
const AWS = require("aws-sdk");
const AWSMock = require("aws-sdk-mock");
const db_service_1 = require("./common/db/db.service");
const _ = __importStar(require("lodash"));
const wss_admin_1 = require("./websocket/admin/wss.admin");
let WsDispatcher = class WsDispatcher {
    constructor(logger, config, dbService, httpService, wsAdmin) {
        this.logger = logger;
        this.config = config;
        this.dbService = dbService;
        this.httpService = httpService;
        this.wsAdmin = wsAdmin;
        console.debug('WsDispatcher');
    }
    onApplicationBootstrap() {
        this.useWsInterface = this.config.get("websocket.ws.enabled", false);
        if (this.useWsInterface) {
            this.logger.info({ service: 'WsDispatcher', desc: 'use local ws' });
        }
        else {
            this.useWsInterface = this.config.get("websocket.wss.enabled", false);
            if (this.useWsInterface) {
                this.logger.info({ service: 'WsDispatcher', desc: 'use local wss' });
            }
        }
        let aws_ws_url = this.config.get('aws.webSocketUrl', process.env.AWS_WEB_SOCKET_URL);
        if (!aws_ws_url) {
            console.error({ func: 'WsDispatcher', err: 'process.env.AWS_WEB_SOCKET_URL Not Defined' });
            return;
        }
        let aws_region = this.config.get('aws.region', process.env.AWS_API_GW_REGION);
        if (!aws_region) {
            console.error({ func: 'WsDispatcher', err: 'process.env.AWS_REGION Not Defined' });
            return;
        }
        AWS.config.update({ region: aws_region });
        let aws_mock = this.config.get('aws.mock.ws', false);
        this.logger.warn({ msg: "Using AWS Mock?", useAwsMock: aws_mock });
        if (aws_mock) {
            let aws_mock_http = this.config.get('aws.mock.http', true);
            let mock_aws_ws_url = this.config.get('aws.mock.webSocketUrl');
            let full_component_test = this.config.get('aws.mock.fullComponentTest');
            this.logger.warn({ msg: "Using AWS Mock?", useAwsMock: aws_mock, url: mock_aws_ws_url });
            this.logger.warn({ msg: "Mocking aws WS api gw" });
            AWSMock.setSDKInstance(AWS);
            AWSMock.mock('ApiGatewayManagementApi', 'postToConnection', async (params, callback) => {
                this.logger.info({
                    service: 'ApiGatewayManagementApi',
                    method: 'postToConnection',
                    status: 'mock called'
                });
                if (full_component_test) {
                    const urlArray = mock_aws_ws_url.split(":");
                    const action = urlArray[2].split("/")[1];
                    const port = params.ConnectionId.slice(-4);
                    mock_aws_ws_url = `${urlArray[0]}:${urlArray[1]}:${port}/${action}`;
                }
                if (aws_mock_http) {
                    const requestConfig = {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    };
                    try {
                        this.logger.info(`POST TO CONNECTION MOCK  => ${mock_aws_ws_url}, ==> ${params.ConnectionId}, ==> ${params.Data}`);
                        const responseData = await (0, rxjs_1.lastValueFrom)(this.httpService.post(mock_aws_ws_url, {
                            connectionId: params.ConnectionId,
                            dto: params.Data
                        }, requestConfig).pipe((0, rxjs_1.map)((response) => {
                            return response.data;
                        })));
                        callback(responseData);
                        return;
                    }
                    catch (e) {
                        this.logger.error(e.message);
                        throw new Error("PostToConnection mock failed!!  ");
                    }
                }
                else {
                    callback(undefined, { StatusCode: 200 });
                    return;
                }
            });
        }
        this.apiGwManagementApi = new AWS.ApiGatewayManagementApi({
            apiVersion: constants_1.AWS_API_VERSION,
            endpoint: aws_ws_url
        });
    }
    async sendMessage(wsConnectionId, msg) {
        try {
            this.logger.info({ func: 'sendMessage', connection: wsConnectionId, msg: msg });
            let retries = Number(this.config.get("sendWsMessage.retries", 2));
            let minTimeout = Number(this.config.get("sendWsMessage.minTimeout", 30000));
            let index = 0;
            await (0, async_retry_1.default)(async () => await this.sendWsMessage(wsConnectionId, msg, index), {
                retries: retries,
                minTimeout: minTimeout,
                onRetry: (error, attempt) => {
                    index = attempt;
                }
            });
        }
        catch (e) {
            this.logger.error({ Action: 'Dispatcher sendMessage', error: e.message ? e.message : e });
        }
    }
    async sendWsMessage(wsConnectionId, msg, index) {
        try {
            let connectionId = wsConnectionId;
            this.logger.debug({ action: 'sendWsMessage retry', index: index, conn: wsConnectionId, msg: msg });
            if (index > 0) {
                if (msg && msg.body && msg.body.userId && msg.body.deviceId) {
                    let userData = await this.dbService.getUserData(msg.body.userId, msg.body.deviceId);
                    connectionId = userData && userData.connectionId ? userData.connectionId : wsConnectionId;
                }
            }
            this.logger.debug({ action: 'sendWsMessage', connectionId: connectionId, index: index });
            let message = this.clearMsg(msg);
            if (this.useWsInterface && connectionId.indexOf('_ws_') != -1) {
                await this.sendMessage2WsInterface(connectionId, message);
                return;
            }
            await this.apiGwManagementApi.postToConnection({
                ConnectionId: connectionId,
                Data: JSON.stringify(message)
            }).promise()
                .then(data => {
                this.logger.debug({ action: 'Dispatcher sendWsMessaged', data: data });
            })
                .catch(error => {
                this.logger.error({
                    action: 'Dispatcher sendWsMessaged',
                    connectionId: connectionId,
                    index: index,
                    error: error
                });
                throw new Error(error.message ? error.message : error);
            });
        }
        catch (e) {
            this.logger.error({ func: 'sendMessage to webSocket GW failed', msg: e.message ? e.message : e });
            throw new Error(e.message ? e.message : e);
        }
    }
    async sendMessage2WsInterface(wsConnId, msg) {
        this.logger.info({ func: 'sendMessage2WsInterface', wsConnId: wsConnId, msg: msg });
        await this.wsAdmin.sendMessage(wsConnId, msg);
    }
    clearMsg(msg) {
        let message = _.cloneDeep(msg);
        delete message.body.deviceId;
        delete message.body.userId;
        delete message.body.accessToken;
        delete message.body.appSid;
        delete message.body.organizationId;
        delete message.body.accountId;
        delete message.body.deviceType;
        return message;
    }
};
WsDispatcher = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => wss_admin_1.WssAdmin))),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        configuration_service_1.ConfigurationService,
        db_service_1.DbService,
        axios_1.HttpService,
        wss_admin_1.WssAdmin])
], WsDispatcher);
exports.WsDispatcher = WsDispatcher;
//# sourceMappingURL=ws.dispatcher.js.map
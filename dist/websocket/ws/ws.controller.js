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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsController = void 0;
const common_1 = require("@nestjs/common");
const WebSocket = __importStar(require("ws"));
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const constants_1 = require("../../common/constants");
const wss_admin_1 = require("../admin/wss.admin");
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
const client_msg_handler_1 = require("../../client.msg.handler");
function heartbeat() {
    this.isAlive = true;
}
let WsController = class WsController {
    constructor(config, logger, wssAdmin, msgHandler) {
        this.config = config;
        this.logger = logger;
        this.wssAdmin = wssAdmin;
        this.msgHandler = msgHandler;
    }
    onApplicationBootstrap() {
        let wsEnable = this.config.get("websocket.ws.enabled", false);
        this.logger.info({ service: 'WsController', enabled: wsEnable });
        if (wsEnable) {
            this.init();
        }
    }
    init() {
        this.logger.info({ func: 'WsController:init()', port: constants_1.WS_PORT });
        this.wsServer = new WebSocket.Server({ port: constants_1.WS_PORT });
        let _this = this;
        this.wsServer.on('connection', function connection(ws, req) {
            _this.logger.info({ func: 'OnWsConnect', req: req });
            ws.isAlive = true;
            ws.on('pong', heartbeat);
            _this.wssAdmin.onConnect(req, ws);
            ws.on('message', function message(data) {
                _this.logger.info({ func: 'onMsg', msg: data.toString() });
                let apiMsg = JSON.parse(data.toString());
                let wsReq = {
                    connectionId: _this.wssAdmin.createConnId(req),
                    dto: apiMsg
                };
                _this.msgHandler.handleMsg(wsReq);
            });
            ws.on('close', function () {
                _this.logger.info({ func: 'OnWsClose', conn: _this.wssAdmin.createConnId(req) });
                _this.wssAdmin.onClose(req, ws);
            });
            ws.on('error', function incoming(error) {
                _this.logger.error({ func: 'OnWsError', err: error.message });
            });
        });
    }
};
WsController = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => client_msg_handler_1.ClientMsgHandler))),
    __metadata("design:paramtypes", [configuration_service_1.ConfigurationService,
        mculogger_service_1.MculoggerService,
        wss_admin_1.WssAdmin,
        client_msg_handler_1.ClientMsgHandler])
], WsController);
exports.WsController = WsController;
//# sourceMappingURL=ws.controller.js.map